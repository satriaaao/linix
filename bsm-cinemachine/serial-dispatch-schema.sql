create table public.rentcam_units(id uuid primary key default gen_random_uuid(),product_id text not null,serial text unique not null check(length(serial) between 1 and 100),active boolean not null default true,created_at timestamptz default now());
create sequence rentcam_private.dispatch_seq;
create table public.rentcam_dispatches(id uuid primary key default gen_random_uuid(),order_id uuid unique not null references public.rentcam_orders(id),number text unique not null,status text not null default 'preparing' check(status in('preparing','dispatched','returned','cancelled')),created_at timestamptz default now(),dispatched_at timestamptz);
create table public.rentcam_dispatch_units(id uuid primary key default gen_random_uuid(),dispatch_id uuid not null references public.rentcam_dispatches(id),unit_id uuid not null references public.rentcam_units(id),scanned_at timestamptz default now(),unique(dispatch_id,unit_id));
alter table public.rentcam_units enable row level security;alter table public.rentcam_dispatches enable row level security;alter table public.rentcam_dispatch_units enable row level security;
grant select on public.rentcam_units,public.rentcam_dispatches,public.rentcam_dispatch_units to anon,authenticated;
create policy units_admin on public.rentcam_units for select to anon,authenticated using(rentcam_is_admin());
create policy dispatch_admin on public.rentcam_dispatches for select to anon,authenticated using(rentcam_is_admin());
create policy dispatch_units_admin on public.rentcam_dispatch_units for select to anon,authenticated using(rentcam_is_admin());
create function rentcam_private.rental_serial_gate() returns trigger language plpgsql security definer set search_path=public as $$declare line record;capacity integer;held integer;scanned integer;begin
if new.rental_status='approved' and old.rental_status is distinct from 'approved' then
 perform pg_advisory_xact_lock(hashtext('rentcam-rental-approval'));
 for line in select item->>'id' pid,sum((item->>'quantity')::integer) qty,min(item->>'name') name from jsonb_array_elements(new.items)item group by item->>'id' loop
  select count(*) into capacity from rentcam_units where product_id=line.pid and active;
  select coalesce(sum((i->>'quantity')::integer),0) into held from rentcam_orders o,jsonb_array_elements(o.items)i where o.id<>new.id and o.rental_status in('approved','rented') and o.start_date<=new.end_date and (case when o.rental_status='rented' then greatest(o.end_date,current_date)else o.end_date end)>=new.start_date and i->>'id'=line.pid;
  if capacity<held+line.qty then raise exception 'Nomor seri % belum cukup: % unit terdaftar, % diperlukan termasuk reservasi',line.name,capacity,held+line.qty;end if;
 end loop;
end if;
if new.rental_status='rented' and old.rental_status is distinct from 'rented' then
 for line in select item->>'id' pid,sum((item->>'quantity')::integer) qty,min(item->>'name')name from jsonb_array_elements(new.items)item group by item->>'id' loop
  select count(*) into scanned from rentcam_dispatch_units a join rentcam_dispatches d on d.id=a.dispatch_id join rentcam_units u on u.id=a.unit_id where d.order_id=new.id and u.product_id=line.pid and u.active;
  if scanned<>line.qty then raise exception 'Scan barcode % belum lengkap (% dari %)',line.name,scanned,line.qty;end if;
 end loop;
end if;return new;end;$$;
create function rentcam_private.dispatch_order_sync() returns trigger language plpgsql security definer set search_path=public as $$begin
if new.rental_status='approved' then insert into rentcam_dispatches(order_id,number)values(new.id,'SJ/'||to_char(current_date,'YYYYMM')||'/'||lpad(nextval('rentcam_private.dispatch_seq')::text,6,'0'))on conflict(order_id)do nothing;
elsif new.rental_status='rented' then update rentcam_dispatches set status='dispatched',dispatched_at=coalesce(dispatched_at,now()) where order_id=new.id;
elsif new.rental_status='returned' then update rentcam_dispatches set status='returned' where order_id=new.id;
elsif new.rental_status='cancelled' then update rentcam_dispatches set status='cancelled' where order_id=new.id;end if;return new;end;$$;
revoke all on function rentcam_private.rental_serial_gate(),rentcam_private.dispatch_order_sync() from public;
create trigger rental_serial_gate before update of rental_status on rentcam_orders for each row execute function rentcam_private.rental_serial_gate();
create trigger dispatch_order_sync after update of rental_status on rentcam_orders for each row execute function rentcam_private.dispatch_order_sync();
insert into rentcam_dispatches(order_id,number,status)select id,'SJ/'||to_char(current_date,'YYYYMM')||'/'||lpad(nextval('rentcam_private.dispatch_seq')::text,6,'0'),case when rental_status='rented' then 'dispatched'else 'preparing'end from rentcam_orders where rental_status in('approved','rented')on conflict(order_id)do nothing;
create function rentcam_private.serial_action(p_action text,p_data jsonb)returns jsonb language plpgsql security definer set search_path=public as $$declare pid text;sn text;c jsonb;qty integer;d rentcam_dispatches;o rentcam_orders;u rentcam_units;need integer;have integer;begin
if not rentcam_is_admin()then raise exception 'Akses admin diperlukan';end if;
if p_action in('add','deactivate','reactivate')then
 pid=p_data->>'product_id';perform pg_advisory_xact_lock(hashtext('rentcam-rental-approval'));
 select config into c from rentcam_cms_config where id=1;
 if not exists(select 1 from rentcam_order_catalog where id=pid)and not exists(select 1 from jsonb_array_elements(coalesce(c->'customProducts','[]'))p where p->>'id'=pid)then raise exception 'Produk tidak ditemukan';end if;
 if p_action='add'then
 if jsonb_typeof(p_data->'serials')<>'array'or jsonb_array_length(p_data->'serials')not between 1 and 500 then raise exception 'Isi nomor seri, satu nomor per baris';end if;
 for sn in select upper(trim(value#>>'{}'))from jsonb_array_elements(p_data->'serials')loop
 if length(sn)not between 1 and 100 then raise exception 'Nomor seri tidak valid';end if;
 if exists(select 1 from rentcam_units where serial=sn and product_id<>pid)then raise exception 'Nomor seri % sudah dimiliki produk lain',sn;end if;
 insert into rentcam_units(product_id,serial)values(pid,sn)on conflict(serial)do nothing;
 end loop;
 else
 select * into u from rentcam_units where id=(p_data->>'unit_id')::uuid and product_id=pid for update;if not found then raise exception 'Unit tidak ditemukan';end if;
 if exists(select 1 from rentcam_dispatch_units a join rentcam_dispatches ds on ds.id=a.dispatch_id where a.unit_id=u.id and ds.status in('preparing','dispatched'))then raise exception 'Unit masih ada pada surat jalan aktif';end if;
 if p_action='deactivate' and exists(select 1 from rentcam_orders r,jsonb_array_elements(r.items)i where r.rental_status in('approved','rented')and i->>'id'=pid)then raise exception 'Selesaikan reservasi produk sebelum menonaktifkan unit';end if;
 update rentcam_units set active=p_action='reactivate'where id=u.id;
 end if;
 select count(*)into qty from rentcam_units where product_id=pid and active;
 update rentcam_cms_config set config=jsonb_set(config,'{productOverrides}',coalesce(config->'productOverrides','{}')||jsonb_build_object(pid,coalesce(config->'productOverrides'->pid,'{}')||jsonb_build_object('stock',qty,'serialManaged',true))),updated_at=now()where id=1;return jsonb_build_object('stock',qty);
end if;
if p_action='approve'then
 perform pg_advisory_xact_lock(hashtext('rentcam-rental-approval'));
 select * into o from rentcam_orders where id=(p_data->>'order_id')::uuid for update;if not found then raise exception 'Order tidak ditemukan';end if;
 if o.source='quotation'then update rentcam_orders set source='admin'where id=o.id;end if;
 perform rentcam_private.admin_action(o.id,'approve','{}');return jsonb_build_object('ok',true);
end if;
select * into d from rentcam_dispatches where id=(p_data->>'dispatch_id')::uuid;if not found then raise exception 'Surat jalan tidak ditemukan';end if;
select * into o from rentcam_orders where id=d.order_id for update;
select * into d from rentcam_dispatches where rentcam_dispatches.id=d.id for update;
if p_action='scan'then
 if d.status<>'preparing'or o.rental_status<>'approved'then raise exception 'Surat jalan tidak siap discan';end if;
 sn=upper(trim(p_data->>'barcode'));select * into u from rentcam_units where serial=sn and active for update;if not found then raise exception 'Barcode / nomor seri belum terdaftar';end if;
 if exists(select 1 from rentcam_dispatch_units where dispatch_id=d.id and unit_id=u.id)then return jsonb_build_object('ok',true,'duplicate',true);end if;
 select coalesce(sum((i->>'quantity')::integer),0)into need from jsonb_array_elements(o.items)i where i->>'id'=u.product_id;
 select count(*)into have from rentcam_dispatch_units a join rentcam_units ux on ux.id=a.unit_id where a.dispatch_id=d.id and ux.product_id=u.product_id;
 if need=0 or have>=need then raise exception 'Produk tidak diperlukan atau jumlah scan sudah lengkap';end if;
 if exists(select 1 from rentcam_dispatch_units a join rentcam_dispatches ds on ds.id=a.dispatch_id join rentcam_orders other on other.id=ds.order_id where a.unit_id=u.id and ds.id<>d.id and (ds.status='dispatched'or(ds.status='preparing'and other.start_date<=o.end_date and other.end_date>=o.start_date)))then raise exception 'Unit sedang disewa / dialokasikan ke surat jalan lain';end if;
 insert into rentcam_dispatch_units(dispatch_id,unit_id)values(d.id,u.id);insert into rentcam_order_events(order_id,action,details)values(o.id,'barcode_scanned',jsonb_build_object('serial',u.serial));return jsonb_build_object('ok',true);
elsif p_action='unscan'then
 if d.status<>'preparing'then raise exception 'Surat jalan sudah diberangkatkan';end if;delete from rentcam_dispatch_units where dispatch_id=d.id and unit_id=(p_data->>'unit_id')::uuid;return jsonb_build_object('ok',true);
elsif p_action='dispatch'then perform rentcam_private.admin_action(o.id,'out','{}');return jsonb_build_object('ok',true);
elsif p_action='return'then perform rentcam_private.admin_action(o.id,'return','{}');return jsonb_build_object('ok',true);
else raise exception 'Aksi tidak dikenal';end if;end;$$;
create function public.rentcam_serial_action(p_action text,p_data jsonb)returns jsonb language sql security invoker set search_path=public as $$select rentcam_private.serial_action(p_action,p_data);$$;
revoke all on function rentcam_private.serial_action(text,jsonb),public.rentcam_serial_action(text,jsonb)from public;
grant execute on function rentcam_private.serial_action(text,jsonb),public.rentcam_serial_action(text,jsonb)to anon,authenticated;

CREATE OR REPLACE FUNCTION rentcam_private.stock(p_start date, p_end date, p_exclude uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$declare c jsonb;result jsonb;begin
if not rentcam_is_admin() then raise exception 'Akses admin diperlukan';end if;
if p_start is null or p_end is null or p_end<p_start then raise exception 'Tanggal stok tidak valid';end if;
select config into c from rentcam_cms_config where id=1;
with raw as(select id,product as p from rentcam_order_catalog union all select value->>'id',value from jsonb_array_elements(coalesce(c->'customProducts','[]'))),products as(select distinct on(id) id,p||coalesce(c->'productOverrides'->id,'{}') as p from raw),reserved as(select line->>'id' id,sum((line->>'quantity')::integer) q from rentcam_orders r,jsonb_array_elements(r.items)line where r.rental_status in('approved','rented') and r.id is distinct from p_exclude and r.start_date<=p_end and case when r.rental_status='rented' then greatest(r.end_date,current_date) else r.end_date end>=p_start group by line->>'id')
select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.p->>'name','brand',p.p->>'brand','category',coalesce(p.p->>'mainCategory',p.p->>'cat',p.p->>'category'),'price',coalesce((p.p->>'price')::numeric,0),'stock',(select count(*) from public.rentcam_units u where u.product_id=p.id and u.active),'reserved',coalesce(r.q,0),'available',greatest(0,(select count(*) from public.rentcam_units u where u.product_id=p.id and u.active)-coalesce(r.q,0)))order by p.p->>'name'),'[]') into result from products p left join reserved r on r.id=p.id where coalesce(p.p->>'active','true')<>'false' and coalesce(p.p->>'deleted','false')<>'true';return result;end;$function$

-- Transactional verification
do $test$declare oid uuid=gen_random_uuid();tok uuid=gen_random_uuid();sn1 text='TEST-SN-'||gen_random_uuid();sn2 text='TEST-SN-'||gen_random_uuid();ds uuid;r jsonb;n numeric;blocked boolean=false;begin begin
execute 'create or replace function public.rentcam_is_admin()returns boolean language sql stable security definer set search_path=public as $f$select true$f$';
perform rentcam_private.serial_action('add',jsonb_build_object('product_id','arri-alexa-35','serials',jsonb_build_array(sn1,sn2)));
r=rentcam_private.pro_action('quotation',jsonb_build_object('id',oid,'token',tok,'name','TEST Dispatch Customer','phone','081234567890','start',current_date+90,'end',current_date+90,'items','[{"id":"arri-alexa-35","q":2}]'::jsonb));
select total into n from rentcam_orders where id=oid;
perform rentcam_private.admin_action(oid,'record_payment',jsonb_build_object('amount',n));
perform rentcam_private.serial_action('approve',jsonb_build_object('order_id',oid));
select id into ds from rentcam_dispatches where order_id=oid;
if ds is null then raise exception 'Missing automatic dispatch';end if;
begin perform rentcam_private.admin_action(oid,'out','{}');exception when others then blocked=true;end;if not blocked then raise exception 'Scan bypass';end if;
perform rentcam_private.serial_action('scan',jsonb_build_object('dispatch_id',ds,'barcode',sn1));
perform rentcam_private.serial_action('scan',jsonb_build_object('dispatch_id',ds,'barcode',sn1));
if (select count(*)from rentcam_dispatch_units where dispatch_id=ds)<>1 then raise exception 'Duplicate scan';end if;
blocked=false;begin perform rentcam_private.admin_action(oid,'delivered','{}');exception when others then blocked=true;end;if not blocked then raise exception 'Delivery bypass';end if;
perform rentcam_private.serial_action('scan',jsonb_build_object('dispatch_id',ds,'barcode',sn2));
perform rentcam_private.serial_action('dispatch',jsonb_build_object('dispatch_id',ds));
if (select status from rentcam_dispatches where id=ds)<>'dispatched' then raise exception 'Not dispatched';end if;
perform rentcam_private.serial_action('return',jsonb_build_object('dispatch_id',ds));
if (select status from rentcam_dispatches where id=ds)<>'returned' then raise exception 'Not returned';end if;
raise exception using errcode='P0002',message='rollback verified dispatch';exception when no_data_found then null;end;end $test$;
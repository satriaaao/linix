alter table public.rentcam_orders add column source text not null default 'website' check(source in('website','admin','quotation'));
create sequence rentcam_private.document_seq;
create table public.rentcam_documents(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.rentcam_orders(id),kind text not null check(kind in('quotation','invoice')),number text unique not null,issued_on date not null default current_date,valid_until date,notes text not null default '',created_at timestamptz default now());
create unique index single_invoice_per_order on public.rentcam_documents(order_id) where kind='invoice';
create table public.rentcam_journal_entries(id uuid primary key default gen_random_uuid(),origin_key text unique not null,finance_id uuid references public.rentcam_finance_entries(id) on delete set null,document_id uuid references public.rentcam_documents(id),entry_date date not null,description text not null,created_at timestamptz default now());
create table public.rentcam_journal_lines(id bigint generated always as identity primary key,entry_id uuid not null references public.rentcam_journal_entries(id),account_code text not null,account_name text not null,debit numeric not null default 0 check(debit>=0),credit numeric not null default 0 check(credit>=0),check((debit>0 and credit=0) or(credit>0 and debit=0)));
alter table public.rentcam_documents enable row level security;alter table public.rentcam_journal_entries enable row level security;alter table public.rentcam_journal_lines enable row level security;
grant select on public.rentcam_documents,public.rentcam_journal_entries,public.rentcam_journal_lines to anon,authenticated;
create policy documents_admin on public.rentcam_documents for select to anon,authenticated using(public.rentcam_is_admin());
create policy journal_admin on public.rentcam_journal_entries for select to anon,authenticated using(public.rentcam_is_admin());
create policy journal_lines_admin on public.rentcam_journal_lines for select to anon,authenticated using(public.rentcam_is_admin());
create function rentcam_private.check_journal_balance() returns trigger language plpgsql security definer set search_path=public as $$begin if exists(select 1 from rentcam_journal_lines where entry_id=new.entry_id) and (select sum(debit-credit) from rentcam_journal_lines where entry_id=new.entry_id)<>0 then raise exception 'Jurnal tidak seimbang';end if;return new;end;$$;
revoke all on function rentcam_private.check_journal_balance() from public;
create constraint trigger journal_balance after insert or update on public.rentcam_journal_lines deferrable initially deferred for each row execute function rentcam_private.check_journal_balance();
create function rentcam_private.post_finance(p_id uuid) returns void language plpgsql security definer set search_path=public as $$declare f rentcam_finance_entries;j uuid;inv_total numeric;before_paid numeric;allocation numeric;begin
select * into f from rentcam_finance_entries where id=p_id;if not found then return;end if;
insert into rentcam_journal_entries(origin_key,finance_id,entry_date,description) values('finance:'||f.id,f.id,f.entry_date,f.description) on conflict(origin_key) do nothing returning id into j;if j is null then return;end if;
if f.direction='expense' then
 insert into rentcam_journal_lines(entry_id,account_code,account_name,debit,credit)values(j,'5000','Beban operasional · '||f.category,f.amount,0),(j,'1000','Kas & Bank',0,f.amount);
else
 insert into rentcam_journal_lines(entry_id,account_code,account_name,debit,credit)values(j,'1000','Kas & Bank',f.amount,0);
 if f.order_id is not null and f.category='rental_payment' then
  select o.total into inv_total from rentcam_documents d join rentcam_orders o on o.id=d.order_id where d.order_id=f.order_id and d.kind='invoice';
  select coalesce(sum(amount),0) into before_paid from rentcam_finance_entries where order_id=f.order_id and category='rental_payment' and direction='income' and id<>f.id;
  allocation=case when inv_total is null then 0 else least(f.amount,greatest(0,inv_total-before_paid)) end;
  if allocation>0 then insert into rentcam_journal_lines(entry_id,account_code,account_name,debit,credit)values(j,'1200','Piutang rental',0,allocation);end if;
  if f.amount>allocation then insert into rentcam_journal_lines(entry_id,account_code,account_name,debit,credit)values(j,'2100','Uang muka pelanggan',0,f.amount-allocation);end if;
 else insert into rentcam_journal_lines(entry_id,account_code,account_name,debit,credit)values(j,'4100','Pendapatan lainnya',0,f.amount);end if;
end if;end;$$;
create function rentcam_private.finance_journal_trigger() returns trigger language plpgsql security definer set search_path=public as $$declare j uuid;begin
if tg_op='DELETE' then
 insert into rentcam_journal_entries(origin_key,entry_date,description)values('reverse:'||old.id,current_date,'Pembalikan: '||old.description) on conflict(origin_key)do nothing returning id into j;
 if j is not null then insert into rentcam_journal_lines(entry_id,account_code,account_name,debit,credit)select j,l.account_code,l.account_name,l.credit,l.debit from rentcam_journal_lines l join rentcam_journal_entries e on e.id=l.entry_id where e.origin_key='finance:'||old.id;end if;return old;
end if;perform rentcam_private.post_finance(new.id);return new;end;$$;
revoke all on function rentcam_private.post_finance(uuid),rentcam_private.finance_journal_trigger() from public;
create trigger finance_post_journal after insert on public.rentcam_finance_entries for each row execute function rentcam_private.finance_journal_trigger();
create trigger finance_reverse_journal before delete on public.rentcam_finance_entries for each row execute function rentcam_private.finance_journal_trigger();
do $$declare f record;begin for f in select id from rentcam_finance_entries loop perform rentcam_private.post_finance(f.id);end loop;end$$;
create function rentcam_private.stock(p_start date,p_end date,p_exclude uuid default null) returns jsonb language plpgsql security definer set search_path=public as $$declare c jsonb;result jsonb;begin
if not rentcam_is_admin() then raise exception 'Akses admin diperlukan';end if;
if p_start is null or p_end is null or p_end<p_start then raise exception 'Tanggal stok tidak valid';end if;
select config into c from rentcam_cms_config where id=1;
with raw as(select id,product as p from rentcam_order_catalog union all select value->>'id',value from jsonb_array_elements(coalesce(c->'customProducts','[]'))),products as(select distinct on(id) id,p||coalesce(c->'productOverrides'->id,'{}') as p from raw),reserved as(select line->>'id' id,sum((line->>'quantity')::integer) q from rentcam_orders r,jsonb_array_elements(r.items)line where r.rental_status in('approved','rented') and r.id is distinct from p_exclude and r.start_date<=p_end and case when r.rental_status='rented' then greatest(r.end_date,current_date) else r.end_date end>=p_start group by line->>'id')
select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.p->>'name','brand',p.p->>'brand','category',coalesce(p.p->>'mainCategory',p.p->>'cat',p.p->>'category'),'price',coalesce((p.p->>'price')::numeric,0),'stock',coalesce((p.p->>'stock')::integer,1),'reserved',coalesce(r.q,0),'available',greatest(0,coalesce((p.p->>'stock')::integer,1)-coalesce(r.q,0)))order by p.p->>'name'),'[]') into result from products p left join reserved r on r.id=p.id where coalesce(p.p->>'active','true')<>'false' and coalesce(p.p->>'deleted','false')<>'true';return result;end;$$;
create function public.rentcam_admin_stock(p_start date,p_end date,p_exclude uuid default null) returns jsonb language sql security invoker set search_path=public as $$select rentcam_private.stock(p_start,p_end,p_exclude);$$;
create function rentcam_private.pro_action(p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path=public as $$declare o rentcam_orders;r jsonb;oid uuid;doc rentcam_documents;j uuid;allocated numeric;begin
if not rentcam_is_admin() then raise exception 'Akses admin diperlukan';end if;
if p_action in('direct_order','quotation') then
 oid=(p_data->>'id')::uuid;
 r=rentcam_private.checkout(oid,p_data->>'name',p_data->>'phone',coalesce(p_data->>'email',''),(p_data->>'start')::date,(p_data->>'end')::date,coalesce(p_data->>'notes',''),p_data->'items',jsonb_build_object('customer_token',p_data->>'token','delivery',coalesce(p_data->'delivery','{}')));
 update rentcam_orders set source=case when p_action='quotation' then 'quotation' else 'admin' end where id=oid;
 if p_action='direct_order' then return r;end if;
elsif p_action='convert' then
 update rentcam_orders set source='admin' where id=(p_data->>'order_id')::uuid and source='quotation';return jsonb_build_object('ok',true);
else oid=(p_data->>'order_id')::uuid;end if;
perform pg_advisory_xact_lock(hashtext('rentcam-document:'||oid));
select * into o from rentcam_orders where id=oid for update;if not found or o.rental_status='cancelled' then raise exception 'Pesanan tidak tersedia';end if;
if p_action='invoice' then
 select * into doc from rentcam_documents where order_id=oid and kind='invoice';if found then return to_jsonb(doc);end if;
else select * into doc from rentcam_documents where order_id=oid and kind='quotation';if found then return to_jsonb(doc);end if;end if;
if p_action not in('invoice','quotation','offer') then raise exception 'Aksi tidak dikenal';end if;
insert into rentcam_documents(order_id,kind,number,valid_until,notes)values(oid,case when p_action='invoice' then 'invoice' else 'quotation' end,(case when p_action='invoice' then 'INV/' else 'QUO/' end)||to_char(current_date,'YYYYMM')||'/'||lpad(nextval('rentcam_private.document_seq')::text,6,'0'),case when p_action='invoice' then null else coalesce((p_data->>'valid_until')::date,current_date+7) end,left(coalesce(p_data->>'document_notes',o.notes),2000)) returning * into doc;
if doc.kind='invoice' and o.total>0 then
 insert into rentcam_journal_entries(origin_key,document_id,entry_date,description)values('invoice:'||doc.id,doc.id,current_date,'Invoice '||doc.number) returning id into j;
 insert into rentcam_journal_lines(entry_id,account_code,account_name,debit,credit)values(j,'1200','Piutang rental',o.total,0),(j,'4000','Pendapatan rental',0,o.total);
 allocated=least(o.total,o.paid_amount);
 if allocated>0 then insert into rentcam_journal_lines(entry_id,account_code,account_name,debit,credit)values(j,'2100','Uang muka pelanggan',allocated,0),(j,'1200','Piutang rental',0,allocated);end if;
end if;return to_jsonb(doc);end;$$;
create function public.rentcam_pro_action(p_action text,p_data jsonb) returns jsonb language sql security invoker set search_path=public as $$select rentcam_private.pro_action(p_action,p_data);$$;
revoke all on function rentcam_private.stock(date,date,uuid),public.rentcam_admin_stock(date,date,uuid),rentcam_private.pro_action(text,jsonb),public.rentcam_pro_action(text,jsonb) from public;
grant execute on function rentcam_private.stock(date,date,uuid),public.rentcam_admin_stock(date,date,uuid),rentcam_private.pro_action(text,jsonb),public.rentcam_pro_action(text,jsonb) to anon,authenticated;

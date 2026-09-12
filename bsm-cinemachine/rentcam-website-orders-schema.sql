
create table public.rentcam_order_catalog(id text primary key,product jsonb not null);
alter table public.rentcam_order_catalog enable row level security;
grant select on public.rentcam_order_catalog to anon,authenticated;
create policy catalog_public_read on public.rentcam_order_catalog for select to anon,authenticated using(true);
create table public.rentcam_orders(
 id uuid primary key,
 order_number text unique not null,
 customer_name text not null check(length(customer_name) between 2 and 120),
 phone text not null check(phone ~ '^\+?[0-9]{8,16}$'),
 email text not null default '' check(length(email)<=160),
 start_date date not null,
 end_date date not null check(end_date>=start_date and end_date-start_date<=365),
 notes text not null default '' check(length(notes)<=2000),
 items jsonb not null check(jsonb_typeof(items)='array' and jsonb_array_length(items) between 1 and 50),
 total numeric not null check(total>=0),
 status text not null default 'new' check(status in ('new','confirmed','completed','cancelled')),
 created_at timestamptz not null default now()
);
alter table public.rentcam_orders enable row level security;
grant select,insert,update on public.rentcam_orders to anon,authenticated;
create policy order_public_request on public.rentcam_orders for insert to anon,authenticated with check(status='new' and start_date>=current_date);
create policy order_admin_read on public.rentcam_orders for select to anon,authenticated using(public.rentcam_is_admin());
create policy order_admin_update on public.rentcam_orders for update to anon,authenticated using(public.rentcam_is_admin()) with check(public.rentcam_is_admin());
create or replace function public.rentcam_submit_order(p_id uuid,p_name text,p_phone text,p_email text,p_start date,p_end date,p_notes text,p_items jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare c jsonb; v jsonb; item jsonb; lines jsonb='[]'; pid text; quantity integer; price numeric; subtotal numeric=0; discount numeric; days integer; number text;
begin
 if p_start<current_date or p_end<p_start or p_end-p_start>365 then raise exception 'Tanggal sewa tidak valid';end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'Keranjang tidak valid';end if;
 select config into c from public.rentcam_cms_config where id=1;
 days=p_end-p_start+1;
 for item in select value from jsonb_array_elements(p_items) loop
  pid=item->>'id'; quantity=(item->>'q')::integer;
  if quantity is null or quantity not between 1 and 100 then raise exception 'Jumlah tidak valid';end if;
  select product into v from public.rentcam_order_catalog where id=pid;
  v=coalesce((select value from jsonb_array_elements(coalesce(c->'customProducts','[]')) where value->>'id'=pid limit 1),v);
  v=v||coalesce(c->'productOverrides'->pid,'{}');
  if v is null or v->>'name' is null or v->>'active'='false' or v->>'deleted'='true' then raise exception 'Produk tidak tersedia';end if;
  if upper(coalesce(v->>'labelText',''))='DISCONTINUED' and (coalesce(v->>'labelStart','')='' or (v->>'labelStart')::date<=current_date) and (coalesce(v->>'labelEnd','')='' or (v->>'labelEnd')::date>=current_date) then raise exception 'Produk dihentikan';end if;
  price=(v->>'price')::numeric;
  if price is null or price<0 then raise exception 'Harga produk tidak valid';end if;
  discount=least(100,greatest(0,coalesce((v->>'discountPercent')::numeric,0)));
  if (coalesce(v->>'discountStart','')='' or (v->>'discountStart')::date<=current_date) and (coalesce(v->>'discountEnd','')='' or (v->>'discountEnd')::date>=current_date) then price=round(price*(1-discount/100));end if;
  subtotal=subtotal+price*quantity*days;
  lines=lines||jsonb_build_array(jsonb_build_object('id',pid,'name',v->>'name','quantity',quantity,'price_per_day',price,'days',days,'amount',price*quantity*days));
 end loop;
 number='RC-'||upper(substr(replace(p_id::text,'-',''),1,12));
 insert into public.rentcam_orders(id,order_number,customer_name,phone,email,start_date,end_date,notes,items,total) values(p_id,number,trim(p_name),p_phone,coalesce(p_email,''),p_start,p_end,coalesce(p_notes,''),lines,subtotal) on conflict(id) do nothing;
 return jsonb_build_object('order_number',number,'total',subtotal,'status','new');
end;$$;
revoke execute on function public.rentcam_submit_order(uuid,text,text,text,date,date,text,jsonb) from public;
grant execute on function public.rentcam_submit_order(uuid,text,text,text,date,date,text,jsonb) to anon,authenticated;

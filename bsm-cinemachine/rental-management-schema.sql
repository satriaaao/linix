
alter table public.rentcam_orders add column payment_status text not null default 'unpaid' check(payment_status in ('unpaid','pending','partial','paid','rejected'));
alter table public.rentcam_orders add column paid_amount numeric not null default 0 check(paid_amount>=0);
alter table public.rentcam_orders add column rental_status text not null default 'requested' check(rental_status in ('requested','approved','rented','returned','cancelled'));
alter table public.rentcam_orders add column delivery jsonb not null default '{}';
alter table public.rentcam_orders add column bank_account jsonb not null default '{}';
alter table public.rentcam_orders add column customer_token uuid not null default gen_random_uuid();
revoke update on public.rentcam_orders from anon,authenticated;
create table public.rentcam_payment_proofs(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.rentcam_orders(id) on delete cascade,receipt_path text unique not null,bank_account jsonb not null,declared_amount numeric not null check(declared_amount>0),verified_amount numeric not null default 0 check(verified_amount>=0),status text not null default 'pending' check(status in ('pending','approved','rejected')),review_note text not null default '',created_at timestamptz not null default now(),reviewed_at timestamptz);
create table public.rentcam_finance_entries(id uuid primary key default gen_random_uuid(),order_id uuid references public.rentcam_orders(id) on delete set null,proof_id uuid unique references public.rentcam_payment_proofs(id) on delete set null,direction text not null check(direction in ('income','expense')),amount numeric not null check(amount>0),category text not null,description text not null default '',entry_date date not null default current_date,created_at timestamptz not null default now());
create table public.rentcam_order_events(id bigint generated always as identity primary key,order_id uuid not null references public.rentcam_orders(id) on delete cascade,action text not null,details jsonb not null default '{}',created_at timestamptz not null default now());
alter table public.rentcam_payment_proofs enable row level security;
alter table public.rentcam_finance_entries enable row level security;
alter table public.rentcam_order_events enable row level security;
grant select on public.rentcam_payment_proofs,public.rentcam_order_events to anon,authenticated;
grant select,insert,update,delete on public.rentcam_finance_entries to anon,authenticated;
create policy proofs_admin on public.rentcam_payment_proofs for select to anon,authenticated using(public.rentcam_is_admin());
create policy finance_admin on public.rentcam_finance_entries for all to anon,authenticated using(public.rentcam_is_admin()) with check(public.rentcam_is_admin() and proof_id is null);
create policy events_admin on public.rentcam_order_events for select to anon,authenticated using(public.rentcam_is_admin());
create table rentcam_private.checkout_tokens(token uuid primary key default gen_random_uuid(),ip_hash text not null,expires_at timestamptz not null default now()+interval '30 minutes',consumed boolean not null default false,created_at timestamptz not null default now());
alter table rentcam_private.checkout_tokens enable row level security;
create index checkout_ip_time on rentcam_private.checkout_tokens(ip_hash,created_at);
create index orders_rental_dates on public.rentcam_orders(rental_status,start_date,end_date);
create index proofs_order on public.rentcam_payment_proofs(order_id);
create index events_order on public.rentcam_order_events(order_id);
create index finance_date on public.rentcam_finance_entries(entry_date);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('rental-receipts','rental-receipts',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf']);
create function rentcam_private.issue_checkout_token() returns uuid language plpgsql security definer set search_path=public,extensions as $$
declare ip text; token uuid;
begin
ip=encode(digest(coalesce(current_setting('request.headers',true)::jsonb->>'x-forwarded-for','unknown'),'sha256'),'hex');
if (select count(*) from rentcam_private.checkout_tokens where ip_hash=ip and created_at>now()-interval '1 hour')>=20 then raise exception 'Terlalu banyak upload. Coba kembali nanti.';end if;
insert into rentcam_private.checkout_tokens(ip_hash) values(ip) returning checkout_tokens.token into token;return token;
end;$$;
create function rentcam_private.valid_checkout_token(p_token text) returns boolean language sql stable security definer set search_path=public as $$
select exists(select 1 from rentcam_private.checkout_tokens where token::text=p_token and expires_at>now() and not consumed);$$;
revoke all on function rentcam_private.issue_checkout_token(),rentcam_private.valid_checkout_token(text) from public;
grant execute on function rentcam_private.issue_checkout_token(),rentcam_private.valid_checkout_token(text) to anon,authenticated;
create function public.rentcam_checkout_upload_token() returns uuid language sql security invoker set search_path=public as $$select rentcam_private.issue_checkout_token();$$;
revoke all on function public.rentcam_checkout_upload_token() from public;
grant execute on function public.rentcam_checkout_upload_token() to anon,authenticated;
create policy rental_receipt_upload on storage.objects for insert to anon,authenticated with check(bucket_id='rental-receipts' and rentcam_private.valid_checkout_token((storage.foldername(name))[1]));
create policy rental_receipt_admin_read on storage.objects for select to anon,authenticated using(bucket_id='rental-receipts' and public.rentcam_is_admin());
create function rentcam_private.submit_proof(p_order uuid,p_customer uuid,p_path text,p_bank text,p_amount numeric) returns uuid language plpgsql security definer set search_path=public as $$
declare o public.rentcam_orders; bank jsonb; v_token text; proof uuid;
begin
select * into o from public.rentcam_orders where id=p_order and customer_token=p_customer for update;
if not found then raise exception 'Pesanan tidak ditemukan';end if;
if o.rental_status='cancelled' then raise exception 'Pesanan dibatalkan';end if;
select value into bank from public.rentcam_cms_config,jsonb_array_elements(coalesce(config->'payment'->'bankAccounts','[]')) where id=1 and value->>'id'=p_bank and coalesce(value->>'active','true')<>'false';
if bank is null then raise exception 'Pilih rekening yang tersedia';end if;
if p_amount is null or p_amount<=0 then raise exception 'Nominal transfer tidak valid';end if;
if exists(select 1 from public.rentcam_payment_proofs where receipt_path=p_path and order_id=p_order) then select id into proof from public.rentcam_payment_proofs where receipt_path=p_path and order_id=p_order;return proof;end if;
v_token=split_part(p_path,'/',1);
if not rentcam_private.valid_checkout_token(v_token) or not exists(select 1 from storage.objects where bucket_id='rental-receipts' and name=p_path) then raise exception 'Bukti transfer belum di-upload atau sudah kedaluwarsa';end if;
insert into public.rentcam_payment_proofs(order_id,receipt_path,bank_account,declared_amount) values(p_order,p_path,bank,p_amount) returning id into proof;
update rentcam_private.checkout_tokens set consumed=true where checkout_tokens.token::text=v_token;
update public.rentcam_orders set bank_account=bank,payment_status=case when paid_amount>=total then 'paid' else 'pending' end where id=p_order;
insert into public.rentcam_order_events(order_id,action) values(p_order,'proof_uploaded');return proof;
end;$$;
revoke all on function rentcam_private.submit_proof(uuid,uuid,text,text,numeric) from public;
-- Access to private helpers is granted only through validated API wrappers.
create function rentcam_private.checkout(p_id uuid,p_name text,p_phone text,p_email text,p_start date,p_end date,p_notes text,p_items jsonb,p_details jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb; o public.rentcam_orders; delivery jsonb; mode text; collect text;
begin
if exists(select 1 from public.rentcam_orders where id=p_id) then
 select * into o from public.rentcam_orders where id=p_id;
 if o.customer_token::text<>p_details->>'customer_token' then raise exception 'Pesanan tidak dapat diakses';end if;
 return jsonb_build_object('order_number',o.order_number,'total',o.total,'customer_token',o.customer_token,'id',o.id);
end if;
delivery=coalesce(p_details->'delivery','{}');mode=coalesce(delivery->>'mode','self_pickup');collect=coalesce(delivery->>'return_mode','self_return');
if mode not in ('delivery','self_pickup') or collect not in ('collect','self_return') then raise exception 'Pilihan antar jemput tidak valid';end if;
if mode='delivery' or collect='collect' then
 if length(coalesce(delivery->>'address','')) not between 5 and 500 then raise exception 'Isi alamat antar jemput';end if;
end if;
if mode='delivery' and (coalesce(delivery->>'deliver_at','')='' or ((delivery->>'deliver_at')::timestamptz at time zone 'Asia/Jakarta')::date not between p_start-1 and p_start) then raise exception 'Jadwal antar harus pada hari mulai sewa atau sehari sebelumnya';end if;
if collect='collect' and (coalesce(delivery->>'collect_at','')='' or ((delivery->>'collect_at')::timestamptz at time zone 'Asia/Jakarta')::date not between p_end and p_end+7) then raise exception 'Jadwal jemput harus pada hari selesai sewa atau setelahnya';end if;
result=rentcam_private.rentcam_submit_order(p_id,p_name,p_phone,p_email,p_start,p_end,p_notes,p_items);
update public.rentcam_orders set customer_token=coalesce((p_details->>'customer_token')::uuid,customer_token),delivery=delivery||jsonb_build_object('deliver_status','pending','collect_status','pending') where id=p_id returning * into o;
if coalesce(p_details->>'receipt_path','')<>'' then perform rentcam_private.submit_proof(p_id,o.customer_token,p_details->>'receipt_path',p_details->>'bank_id',(p_details->>'transfer_amount')::numeric);end if;
insert into public.rentcam_order_events(order_id,action) values(p_id,'order_created');
return result||jsonb_build_object('customer_token',o.customer_token,'id',o.id);
end;$$;
create function public.rentcam_checkout(p_id uuid,p_name text,p_phone text,p_email text,p_start date,p_end date,p_notes text,p_items jsonb,p_details jsonb) returns jsonb language sql security invoker set search_path=public as $$select rentcam_private.checkout(p_id,p_name,p_phone,p_email,p_start,p_end,p_notes,p_items,p_details);$$;
create function rentcam_private.customer_order(p_id uuid,p_token uuid) returns jsonb language sql stable security definer set search_path=public as $$
select jsonb_build_object('id',id,'order_number',order_number,'customer_name',customer_name,'start_date',start_date,'end_date',end_date,'items',items,'total',total,'paid_amount',paid_amount,'payment_status',payment_status,'rental_status',rental_status,'delivery',delivery,'proofs',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'status',p.status,'amount',p.declared_amount,'verified_amount',p.verified_amount,'note',p.review_note)) from public.rentcam_payment_proofs p where p.order_id=o.id),'[]')) from public.rentcam_orders o where id=p_id and customer_token=p_token;$$;
create function public.rentcam_customer_order(p_id uuid,p_token uuid) returns jsonb language sql security invoker set search_path=public as $$select rentcam_private.customer_order(p_id,p_token);$$;
create function rentcam_private.customer_proof(p_order uuid,p_customer uuid,p_path text,p_bank text,p_amount numeric) returns uuid language sql security definer set search_path=public as $$select rentcam_private.submit_proof(p_order,p_customer,p_path,p_bank,p_amount);$$;
create function public.rentcam_customer_proof(p_order uuid,p_customer uuid,p_path text,p_bank text,p_amount numeric) returns uuid language sql security invoker set search_path=public as $$select rentcam_private.customer_proof(p_order,p_customer,p_path,p_bank,p_amount);$$;
revoke all on function rentcam_private.checkout(uuid,text,text,text,date,date,text,jsonb,jsonb),rentcam_private.customer_order(uuid,uuid),rentcam_private.customer_proof(uuid,uuid,text,text,numeric),public.rentcam_checkout(uuid,text,text,text,date,date,text,jsonb,jsonb),public.rentcam_customer_order(uuid,uuid),public.rentcam_customer_proof(uuid,uuid,text,text,numeric) from public;
grant execute on function rentcam_private.checkout(uuid,text,text,text,date,date,text,jsonb,jsonb),rentcam_private.customer_order(uuid,uuid),rentcam_private.customer_proof(uuid,uuid,text,text,numeric),public.rentcam_checkout(uuid,text,text,text,date,date,text,jsonb,jsonb),public.rentcam_customer_order(uuid,uuid),public.rentcam_customer_proof(uuid,uuid,text,text,numeric) to anon,authenticated;


create or replace function rentcam_private.checkout(p_id uuid,p_name text,p_phone text,p_email text,p_start date,p_end date,p_notes text,p_items jsonb,p_details jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb; o public.rentcam_orders; v_delivery jsonb; mode text; collect text;
begin
perform pg_advisory_xact_lock(hashtext(p_id::text));
if exists(select 1 from public.rentcam_orders where id=p_id) then
 select * into o from public.rentcam_orders where id=p_id;
 if o.customer_token::text is distinct from p_details->>'customer_token' then raise exception 'Pesanan tidak dapat diakses';end if;
 return jsonb_build_object('order_number',o.order_number,'total',o.total,'customer_token',o.customer_token,'id',o.id);
end if;
v_delivery=coalesce(p_details->'delivery','{}');mode=coalesce(v_delivery->>'mode','self_pickup');collect=coalesce(v_delivery->>'return_mode','self_return');
if mode not in ('delivery','self_pickup') or collect not in ('collect','self_return') then raise exception 'Pilihan antar jemput tidak valid';end if;
if mode='delivery' or collect='collect' then
 if length(coalesce(v_delivery->>'address','')) not between 5 and 500 then raise exception 'Isi alamat antar jemput';end if;
end if;
if mode='delivery' and (coalesce(v_delivery->>'deliver_at','')='' or ((v_delivery->>'deliver_at')::timestamptz at time zone 'Asia/Jakarta')::date not between p_start-1 and p_start) then raise exception 'Jadwal antar harus pada hari mulai sewa atau sehari sebelumnya';end if;
if collect='collect' and (coalesce(v_delivery->>'collect_at','')='' or ((v_delivery->>'collect_at')::timestamptz at time zone 'Asia/Jakarta')::date not between p_end and p_end+7) then raise exception 'Jadwal jemput harus pada hari selesai sewa atau setelahnya';end if;
if length(coalesce(v_delivery->>'address',''))>500 then raise exception 'Alamat terlalu panjang';end if;
result=rentcam_private.rentcam_submit_order(p_id,p_name,p_phone,p_email,p_start,p_end,p_notes,p_items);
update public.rentcam_orders set customer_token=coalesce((p_details->>'customer_token')::uuid,customer_token),delivery=v_delivery||jsonb_build_object('deliver_status','pending','collect_status','pending') where id=p_id returning * into o;
if coalesce(p_details->>'receipt_path','')<>'' then perform rentcam_private.submit_proof(p_id,o.customer_token,p_details->>'receipt_path',p_details->>'bank_id',(p_details->>'transfer_amount')::numeric);
elsif coalesce(p_details->>'bank_id','')<>'' then
 update public.rentcam_orders set bank_account=coalesce((select value from public.rentcam_cms_config,jsonb_array_elements(coalesce(config->'payment'->'bankAccounts','[]')) where id=1 and value->>'id'=p_details->>'bank_id' and coalesce(value->>'active','true')<>'false' limit 1),'{}') where id=p_id;
end if;
insert into public.rentcam_order_events(order_id,action) values(p_id,'order_created');
return result||jsonb_build_object('customer_token',o.customer_token,'id',o.id);
end;$$;
revoke insert,update,delete on public.rentcam_finance_entries from anon,authenticated;
create or replace function rentcam_private.admin_action(p_order uuid,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare o public.rentcam_orders; proof public.rentcam_payment_proofs; amount numeric; pid text; qty integer; capacity integer; reserved integer; v jsonb; c jsonb; entry uuid; banks jsonb; bank jsonb;
begin
if not public.rentcam_is_admin() then raise exception 'Akses admin diperlukan';end if;
if p_action='banks' then
 banks=p_data->'accounts';
 if jsonb_typeof(banks)<>'array' or jsonb_array_length(banks)>20 then raise exception 'Daftar rekening tidak valid';end if;
 for bank in select value from jsonb_array_elements(banks) loop
  if length(coalesce(bank->>'id',''))<1 or length(coalesce(bank->>'bank','')) not between 2 and 80 or coalesce(bank->>'number','') !~ '^[0-9]{4,30}$' or length(coalesce(bank->>'holder','')) not between 2 and 120 then raise exception 'Lengkapi nama bank, nomor rekening, dan pemilik rekening';end if;
 end loop;
 if (select count(distinct value->>'id') from jsonb_array_elements(banks))<>jsonb_array_length(banks) then raise exception 'ID rekening dobel';end if;
 update public.rentcam_cms_config set config=jsonb_set(config,'{payment}',coalesce(config->'payment','{}')||jsonb_build_object('bankAccounts',banks)),updated_at=now() where id=1;return jsonb_build_object('ok',true);
end if;
if p_action='finance_add' then
 amount=(p_data->>'amount')::numeric;
 if amount is null or amount<=0 or p_data->>'direction' not in ('income','expense') or length(coalesce(p_data->>'description',''))>1000 then raise exception 'Transaksi keuangan tidak valid';end if;
 insert into public.rentcam_finance_entries(direction,amount,category,description,entry_date) values(p_data->>'direction',amount,coalesce(p_data->>'category','other'),coalesce(p_data->>'description',''),coalesce((p_data->>'date')::date,current_date)) returning id into entry;return jsonb_build_object('id',entry);
end if;
if p_action='finance_delete' then
 delete from public.rentcam_finance_entries where id=(p_data->>'id')::uuid and proof_id is null and order_id is null;
 if not found then raise exception 'Pembayaran rental tidak dapat dihapus melalui transaksi manual';end if;
 return jsonb_build_object('ok',true);
end if;
if p_action='approve' then perform pg_advisory_xact_lock(hashtext('rentcam-rental-approval'));end if;
select * into o from public.rentcam_orders where id=p_order for update;
if not found then raise exception 'Pesanan tidak ditemukan';end if;
if p_action in ('verify_proof','reject_proof') then
 select * into proof from public.rentcam_payment_proofs where id=(p_data->>'proof_id')::uuid and order_id=p_order for update;
 if not found then raise exception 'Bukti transfer tidak ditemukan';end if;
 if proof.status='approved' then return jsonb_build_object('ok',true);end if;
 if o.rental_status='cancelled' then raise exception 'Pesanan dibatalkan';end if;
 if p_action='verify_proof' then
  amount=(p_data->>'amount')::numeric;if amount is null or amount<=0 then raise exception 'Nominal terverifikasi harus lebih dari nol';end if;
  update public.rentcam_payment_proofs set status='approved',verified_amount=amount,review_note=left(coalesce(p_data->>'note',''),1000),reviewed_at=now() where id=proof.id;
  insert into public.rentcam_finance_entries(order_id,proof_id,direction,amount,category,description) values(p_order,proof.id,'income',amount,'rental_payment','Transfer '||o.order_number) on conflict(proof_id) do nothing;
 else
  update public.rentcam_payment_proofs set status='rejected',review_note=left(coalesce(p_data->>'note','Bukti belum sesuai'),1000),reviewed_at=now() where id=proof.id;
 end if;
 select coalesce(sum(f.amount),0) into amount from public.rentcam_finance_entries f where order_id=p_order and category='rental_payment' and direction='income';
 update public.rentcam_orders set paid_amount=amount,payment_status=case when amount>=total then 'paid' when amount>0 then 'partial' when exists(select 1 from public.rentcam_payment_proofs where order_id=p_order and status='pending') then 'pending' when p_action='reject_proof' then 'rejected' else 'unpaid' end where id=p_order;
elsif p_action='record_payment' then
 if o.rental_status='cancelled' then raise exception 'Pesanan dibatalkan';end if;
 amount=(p_data->>'amount')::numeric;
 if amount is null or amount<=0 then raise exception 'Nominal pembayaran tidak valid';end if;
 insert into public.rentcam_finance_entries(order_id,direction,amount,category,description) values(p_order,'income',amount,'rental_payment','Pembayaran manual '||o.order_number||' · '||left(coalesce(p_data->>'note',''),500));
 select coalesce(sum(f.amount),0) into amount from public.rentcam_finance_entries f where order_id=p_order and category='rental_payment' and direction='income';
 update public.rentcam_orders set paid_amount=amount,payment_status=case when amount>=total then 'paid' else 'partial' end where id=p_order;
elsif p_action='approve' then
 if o.rental_status='approved' then return jsonb_build_object('ok',true);end if;
 if o.rental_status<>'requested' or o.payment_status<>'paid' or o.paid_amount<o.total then raise exception 'Rental hanya dapat disetujui setelah pembayaran lunas terverifikasi';end if;
 select config into c from public.rentcam_cms_config where id=1;
 for v in select jsonb_build_object('id',line->>'id','name',min(line->>'name'),'quantity',sum((line->>'quantity')::integer)) from jsonb_array_elements(o.items) line group by line->>'id' loop
  pid=v->>'id';qty=(v->>'quantity')::integer;
  select product into bank from public.rentcam_order_catalog where id=pid;
  bank=coalesce((select value from jsonb_array_elements(coalesce(c->'customProducts','[]')) where value->>'id'=pid limit 1),bank)||coalesce(c->'productOverrides'->pid,'{}');
  capacity=coalesce((bank->>'stock')::integer,1);
  if bank is null or bank->>'active'='false' or bank->>'deleted'='true' then raise exception 'Produk tidak tersedia';end if;
  select coalesce(sum((line->>'quantity')::integer),0) into reserved from public.rentcam_orders r,jsonb_array_elements(r.items) line where r.id<>p_order and r.rental_status in ('approved','rented') and r.start_date<=o.end_date and (case when r.rental_status='rented' then greatest(r.end_date,current_date) else r.end_date end)>=o.start_date and line->>'id'=pid;
  if reserved+qty>capacity then raise exception 'Stok % tidak cukup untuk tanggal tersebut',v->>'name';end if;
 end loop;
 update public.rentcam_orders set rental_status='approved',status='confirmed' where id=p_order;
elsif p_action='out' then
 if o.rental_status<>'approved' then raise exception 'Setujui rental sebelum alat keluar';end if;
 update public.rentcam_orders set rental_status='rented' where id=p_order;
elsif p_action='return' then
 if o.rental_status<>'rented' then raise exception 'Alat belum berstatus disewa';end if;
 update public.rentcam_orders set rental_status='returned',status='completed' where id=p_order;
elsif p_action='cancel' then
 if o.rental_status='rented' then raise exception 'Catat alat kembali sebelum membatalkan';end if;
 update public.rentcam_orders set rental_status='cancelled',status='cancelled' where id=p_order;
elsif p_action='delivery' then
 if length(coalesce(p_data->>'driver',''))>120 then raise exception 'Nama petugas terlalu panjang';end if;
 update public.rentcam_orders set delivery=delivery||jsonb_build_object('driver',coalesce(p_data->>'driver','')) where id=p_order;
elsif p_action='delivered' then
 if o.rental_status not in ('approved','rented') then raise exception 'Setujui rental sebelum mengantar alat';end if;
 update public.rentcam_orders set delivery=delivery||'{"deliver_status":"completed"}',rental_status='rented' where id=p_order;
elsif p_action='collected' then
 if o.rental_status<>'rented' then raise exception 'Alat belum disewa';end if;
 update public.rentcam_orders set delivery=delivery||'{"collect_status":"completed"}',rental_status='returned',status='completed' where id=p_order;
else raise exception 'Aksi tidak dikenal';
end if;
insert into public.rentcam_order_events(order_id,action,details) values(p_order,p_action,p_data);
return jsonb_build_object('ok',true);
end;$$;
create or replace function public.rentcam_admin_action(p_order uuid,p_action text,p_data jsonb) returns jsonb language sql security invoker set search_path=public as $$select rentcam_private.admin_action(p_order,p_action,p_data);$$;
revoke all on function rentcam_private.admin_action(uuid,text,jsonb),public.rentcam_admin_action(uuid,text,jsonb) from public;
grant execute on function rentcam_private.admin_action(uuid,text,jsonb),public.rentcam_admin_action(uuid,text,jsonb) to anon,authenticated;

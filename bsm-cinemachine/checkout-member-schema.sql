create or replace function public.rentcam_member_lookup(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_phone text;
  v_customer record;
begin
  v_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if left(v_phone, 1) = '0' then v_phone := '62' || substring(v_phone from 2);
  elsif left(v_phone, 1) = '8' then v_phone := '62' || v_phone;
  end if;
  if v_phone !~ '^62[0-9]{7,14}$' then return jsonb_build_object('found', false); end if;

  select c.name, c.email into v_customer
  from public.rentcam_contacts c
  where c.kind = 'customer' and
    case
      when left(regexp_replace(c.phone, '[^0-9]', '', 'g'), 1) = '0' then '62' || substring(regexp_replace(c.phone, '[^0-9]', '', 'g') from 2)
      when left(regexp_replace(c.phone, '[^0-9]', '', 'g'), 1) = '8' then '62' || regexp_replace(c.phone, '[^0-9]', '', 'g')
      else regexp_replace(c.phone, '[^0-9]', '', 'g')
    end = v_phone
  order by c.updated_at desc limit 1;

  if not found then
    select o.customer_name as name, o.email into v_customer
    from public.rentcam_orders o
    where case
      when left(regexp_replace(o.phone, '[^0-9]', '', 'g'), 1) = '0' then '62' || substring(regexp_replace(o.phone, '[^0-9]', '', 'g') from 2)
      when left(regexp_replace(o.phone, '[^0-9]', '', 'g'), 1) = '8' then '62' || regexp_replace(o.phone, '[^0-9]', '', 'g')
      else regexp_replace(o.phone, '[^0-9]', '', 'g')
    end = v_phone
    order by o.created_at desc limit 1;
  end if;

  if not found then return jsonb_build_object('found', false); end if;
  return jsonb_build_object('found', true, 'name', v_customer.name, 'phone', v_phone, 'email', coalesce(v_customer.email, ''));
end;
$$;

revoke all on function public.rentcam_member_lookup(text) from public, authenticated;
grant execute on function public.rentcam_member_lookup(text) to anon, authenticated;

create or replace function rentcam_private.checkout(p_id uuid,p_name text,p_phone text,p_email text,p_start date,p_end date,p_notes text,p_items jsonb,p_details jsonb)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  result jsonb;
  o public.rentcam_orders;
  v_delivery jsonb;
  mode text;
  collect text;
  v_phone text;
  v_name text;
  v_email text;
  v_member jsonb;
  v_type text;
begin
  perform pg_advisory_xact_lock(hashtext(p_id::text));
  if exists(select 1 from public.rentcam_orders where id=p_id) then
    select * into o from public.rentcam_orders where id=p_id;
    if o.customer_token::text is distinct from p_details->>'customer_token' then raise exception 'Pesanan tidak dapat diakses'; end if;
    return jsonb_build_object('order_number',o.order_number,'total',o.total,'customer_token',o.customer_token,'id',o.id);
  end if;

  v_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if left(v_phone, 1) = '0' then v_phone := '62' || substring(v_phone from 2);
  elsif left(v_phone, 1) = '8' then v_phone := '62' || v_phone;
  end if;
  if v_phone !~ '^62[0-9]{7,14}$' then raise exception 'Nomor WhatsApp tidak valid'; end if;

  v_type := coalesce(p_details->>'customer_type', 'guest');
  if v_type not in ('member','guest') then raise exception 'Tipe customer tidak valid'; end if;
  if v_type = 'member' then
    v_member := public.rentcam_member_lookup(v_phone);
    if coalesce((v_member->>'found')::boolean, false) is not true then raise exception 'Nomor member tidak ditemukan'; end if;
    v_name := v_member->>'name';
    v_email := coalesce(v_member->>'email','');
  else
    v_name := trim(coalesce(p_name,''));
    v_email := trim(coalesce(p_email,''));
    if length(v_name) not between 2 and 120 then raise exception 'Isi nama lengkap'; end if;
  end if;

  v_delivery=coalesce(p_details->'delivery','{}');
  mode=coalesce(v_delivery->>'mode','self_pickup');
  collect=coalesce(v_delivery->>'return_mode','self_return');
  if mode not in ('delivery','self_pickup') or collect not in ('collect','self_return') then raise exception 'Pilihan antar jemput tidak valid'; end if;
  if mode='delivery' or collect='collect' then
    if length(coalesce(v_delivery->>'address','')) not between 5 and 500 then raise exception 'Isi alamat antar jemput'; end if;
  end if;
  if mode='delivery' and (coalesce(v_delivery->>'deliver_at','')='' or ((v_delivery->>'deliver_at')::timestamptz at time zone 'Asia/Jakarta')::date not between p_start-1 and p_start) then raise exception 'Jadwal antar harus pada hari mulai sewa atau sehari sebelumnya'; end if;
  if collect='collect' and (coalesce(v_delivery->>'collect_at','')='' or ((v_delivery->>'collect_at')::timestamptz at time zone 'Asia/Jakarta')::date not between p_end and p_end+7) then raise exception 'Jadwal jemput harus pada hari selesai sewa atau setelahnya'; end if;
  if length(coalesce(v_delivery->>'address',''))>500 then raise exception 'Alamat terlalu panjang'; end if;

  result=rentcam_private.rentcam_submit_order(p_id,v_name,v_phone,v_email,p_start,p_end,p_notes,p_items);
  update public.rentcam_orders set customer_token=coalesce((p_details->>'customer_token')::uuid,customer_token),delivery=v_delivery||jsonb_build_object('deliver_status','pending','collect_status','pending') where id=p_id returning * into o;
  if coalesce(p_details->>'receipt_path','')<>'' then
    perform rentcam_private.submit_proof(p_id,o.customer_token,p_details->>'receipt_path',p_details->>'bank_id',(p_details->>'transfer_amount')::numeric);
  elsif coalesce(p_details->>'bank_id','')<>'' then
    update public.rentcam_orders set bank_account=coalesce((select value from public.rentcam_cms_config,jsonb_array_elements(coalesce(config->'payment'->'bankAccounts','[]')) where id=1 and value->>'id'=p_details->>'bank_id' and coalesce(value->>'active','true')<>'false' limit 1),'{}') where id=p_id;
  end if;

  if v_type='guest' and not exists(
    select 1 from public.rentcam_contacts c where c.kind='customer' and
      case
        when left(regexp_replace(c.phone, '[^0-9]', '', 'g'), 1) = '0' then '62' || substring(regexp_replace(c.phone, '[^0-9]', '', 'g') from 2)
        when left(regexp_replace(c.phone, '[^0-9]', '', 'g'), 1) = '8' then '62' || regexp_replace(c.phone, '[^0-9]', '', 'g')
        else regexp_replace(c.phone, '[^0-9]', '', 'g')
      end = v_phone
  ) then
    insert into public.rentcam_contacts(kind,name,phone,email,notes) values('customer',v_name,v_phone,v_email,'Terdaftar otomatis dari checkout website');
  end if;

  insert into public.rentcam_order_events(order_id,action,details) values(p_id,'order_created',jsonb_build_object('customer_type',v_type));
  return result||jsonb_build_object('customer_token',o.customer_token,'id',o.id);
end;
$$;

CREATE OR REPLACE FUNCTION rentcam_private.pro_action(p_action text, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$declare o rentcam_orders;r jsonb;oid uuid;doc rentcam_documents;j uuid;allocated numeric;existed boolean;mode text;free_days integer;percent numeric;xs jsonb;it jsonb;requested jsonb;subtotal numeric;tax_amount numeric;tax_enabled boolean;discount_value numeric;discount_amount numeric;original_total numeric;begin
if not rentcam_is_admin() then raise exception 'Akses admin diperlukan';end if;
if p_action in('direct_order','quotation') then
 oid=(p_data->>'id')::uuid;perform pg_advisory_xact_lock(hashtext(oid::text));existed=exists(select 1 from rentcam_orders where id=oid);
 r=rentcam_private.checkout(oid,p_data->>'name',p_data->>'phone',coalesce(p_data->>'email',''),(p_data->>'start')::date,(p_data->>'end')::date,coalesce(p_data->>'notes',''),p_data->'items',jsonb_build_object('customer_token',p_data->>'token','delivery',coalesce(p_data->'delivery','{}'),'bank_id',p_data->>'bank_id'));

 if not existed then
 mode=coalesce(p_data->>'discount_mode','none');if mode not in('none','product','days','overall_percent','fixed') then raise exception 'Jenis diskon tidak valid';end if;
 free_days=coalesce((p_data->>'free_days')::integer,0);
 select * into o from rentcam_orders where id=oid for update;
 if free_days<0 or free_days>(o.end_date-o.start_date+1) then raise exception 'Diskon hari melebihi durasi rental';end if;
 xs='[]'::jsonb;
 for it in select value from jsonb_array_elements(o.items) loop
 percent=0;
 select value into requested from jsonb_array_elements(p_data->'items') where value->>'id'=it->>'id' limit 1;
 if mode='product' then
 percent=coalesce((requested->>'discount_percent')::numeric,0);
 if percent<0 or percent>100 then raise exception 'Diskon produk harus 0 sampai 100 persen';end if;
 end if;
 it=it||jsonb_build_object('tentative',coalesce((requested->>'tentative')::boolean,false),'tentative_date',nullif(requested->>'tentative_date',''));
 it=it||jsonb_build_object('original_amount',(it->>'amount')::numeric,'discount_percent',percent,'charged_days',case when mode='days' then (it->>'days')::integer-free_days else (it->>'days')::integer end,'amount',round((it->>'price_per_day')::numeric*(it->>'quantity')::integer*(case when mode='days' then (it->>'days')::integer-free_days else (it->>'days')::integer end)*(1-percent/100)));
 xs=xs||jsonb_build_array(it);
 end loop;
 subtotal=(select coalesce(sum((value->>'amount')::numeric),0) from jsonb_array_elements(xs));original_total=(select coalesce(sum((value->>'original_amount')::numeric),0) from jsonb_array_elements(xs));discount_value=coalesce((p_data->>'discount_value')::numeric,0);if discount_value<0 then raise exception 'Nilai diskon tidak valid';end if;discount_amount=case when mode='overall_percent' then round(subtotal*least(discount_value,100)/100) when mode='fixed' then least(discount_value,subtotal) else 0 end;tax_enabled=coalesce((p_data->>'tax_enabled')::boolean,false);tax_amount=case when tax_enabled then round((subtotal-discount_amount)*.11) else 0 end;
 update rentcam_orders set items=xs,total=subtotal-discount_amount+tax_amount,discount=jsonb_build_object('mode',mode,'value',discount_value,'free_days',case when mode='days' then free_days else 0 end,'amount',original_total-subtotal+discount_amount),tax=jsonb_build_object('enabled',tax_enabled,'rate',case when tax_enabled then 11 else 0 end,'amount',tax_amount),quote_meta=coalesce(p_data->'quote_meta','{}') where id=oid;
 select total into o.total from rentcam_orders where id=oid;r=r||jsonb_build_object('total',o.total);
 end if;
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
insert into rentcam_documents(order_id,kind,number,valid_until,notes,signature_url)values(oid,case when p_action='invoice' then 'invoice' else 'quotation' end,(case when p_action='invoice' then 'INV/' else 'QUO/' end)||to_char(current_date,'YYYYMM')||'/'||lpad(nextval('rentcam_private.document_seq')::text,6,'0'),case when p_action='invoice' then null else coalesce((p_data->>'valid_until')::date,current_date+7) end,left(coalesce(p_data->>'document_notes',o.notes),2000),nullif(p_data->>'signature_url','')) returning * into doc;
if doc.kind='invoice' and o.total>0 then
 insert into rentcam_journal_entries(origin_key,document_id,entry_date,description)values('invoice:'||doc.id,doc.id,current_date,'Invoice '||doc.number) returning id into j;
 insert into rentcam_journal_lines(entry_id,account_code,account_name,debit,credit)values(j,'1200','Piutang rental',o.total,0),(j,'4000','Pendapatan rental',0,o.total);
 allocated=least(o.total,o.paid_amount);
 if allocated>0 then insert into rentcam_journal_lines(entry_id,account_code,account_name,debit,credit)values(j,'2100','Uang muka pelanggan',allocated,0),(j,'1200','Piutang rental',0,allocated);end if;
end if;return to_jsonb(doc);end;$function$


-- Rollback-only premium discount verification
DO $test$ declare v_id uuid;p jsonb;o rentcam_orders;begin begin
EXECUTE 'create or replace function public.rentcam_is_admin() returns boolean language sql stable security definer set search_path=public as $f$select true$f$';
v_id=gen_random_uuid();p=jsonb_build_object('id',v_id,'token',gen_random_uuid(),'name','TEST PREMIUM DISCOUNT ROLLBACK','phone','081234567899','start',current_date+20,'end',current_date+20,'discount_mode','overall_percent','discount_value',20,'tax_enabled',true,'items',jsonb_build_array(jsonb_build_object('id','arri-alexa-35','q',1)));
perform rentcam_private.pro_action('quotation',p);select * into o from rentcam_orders where id=v_id;if o.discount->>'mode'<>'overall_percent' or (o.discount->>'amount')::numeric<=0 or o.total<>round((o.items->0->>'amount')::numeric*.8*1.11) then raise exception 'Percentage discount failed';end if;
v_id=gen_random_uuid();p=p||jsonb_build_object('id',v_id,'token',gen_random_uuid(),'discount_mode','fixed','discount_value',100000,'tax_enabled',false);perform rentcam_private.pro_action('quotation',p);select * into o from rentcam_orders where id=v_id;if (o.discount->>'amount')::numeric<>100000 or o.total<>(o.items->0->>'amount')::numeric-100000 then raise exception 'Fixed discount failed';end if;
raise exception using errcode='P0002',message='rollback successful tests';exception when no_data_found then null;end;end $test$;
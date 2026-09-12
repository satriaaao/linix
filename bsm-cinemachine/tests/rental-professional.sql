do $test$ declare v_order uuid=gen_random_uuid();tok uuid=gen_random_uuid();doc jsonb;r jsonb;n numeric;stock jsonb;begin begin
 execute 'create or replace function public.rentcam_is_admin() returns boolean language sql stable security definer set search_path=public as $f$select true$f$';
 r=rentcam_private.pro_action('quotation',jsonb_build_object('id',v_order,'token',tok,'name','TEST Professional','phone','081234567890','start',current_date+60,'end',current_date+61,'items','[{"id":"arri-alexa-35","q":1}]'::jsonb));
 if r->>'kind'<>'quotation' or (select source from rentcam_orders where rentcam_orders.id=v_order)<>'quotation' then raise exception 'Quote failed';end if;
 if exists(select 1 from rentcam_journal_entries where document_id=(r->>'id')::uuid) then raise exception 'Quote posted accounting';end if;
 perform rentcam_private.pro_action('convert',jsonb_build_object('order_id',v_order));
 select total into n from rentcam_orders where rentcam_orders.id=v_order;
 perform rentcam_private.admin_action(v_order,'record_payment',jsonb_build_object('amount',n/2));
 doc=rentcam_private.pro_action('invoice',jsonb_build_object('order_id',v_order));
 perform rentcam_private.pro_action('invoice',jsonb_build_object('order_id',v_order));
 perform rentcam_private.admin_action(v_order,'record_payment',jsonb_build_object('amount',n/2));
 if (select count(*) from rentcam_documents where order_id=v_order and kind='invoice')<>1 then raise exception 'Duplicate invoice';end if;
 if exists(select 1 from rentcam_journal_lines group by entry_id having sum(debit-credit)<>0) then raise exception 'Unbalanced journal';end if;
 if (select sum(l.debit-l.credit) from rentcam_journal_lines l join rentcam_journal_entries e on e.id=l.entry_id where (e.finance_id in(select f.id from rentcam_finance_entries f where f.order_id=v_order) or e.document_id=(doc->>'id')::uuid) and account_code='1200')<>0 then raise exception 'Receivable not settled';end if;
 stock=rentcam_private.stock(current_date+60,current_date+61,null);if jsonb_array_length(stock)<20 then raise exception 'Catalog stock failed';end if;
 raise exception using errcode='P0002',message='rollback successful pro tests';exception when no_data_found then null;end;end $test$;
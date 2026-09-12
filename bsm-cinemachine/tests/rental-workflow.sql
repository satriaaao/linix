-- Transactional verification: all synthetic orders and temporary auth changes roll back.
do $test$ declare a uuid=gen_random_uuid();b uuid=gen_random_uuid();c uuid=gen_random_uuid();t uuid=gen_random_uuid();r jsonb; n numeric; rejected boolean=false; begin
 begin
 execute 'create or replace function public.rentcam_is_admin() returns boolean language sql stable security definer set search_path=public as $f$select true$f$';
 r=rentcam_private.checkout(a,'TEST Rental Flow','081234567890','',current_date+30,current_date+30,'TEST rollback','[{"id":"arri-alexa-35","q":1}]',jsonb_build_object('customer_token',t,'delivery',jsonb_build_object('mode','delivery','return_mode','collect','address','TEST address Jakarta','deliver_at',(current_date+30)::text||'T09:00:00+07:00','collect_at',(current_date+31)::text||'T10:00:00+07:00')));
 n=(r->>'total')::numeric;
 if rentcam_private.customer_order(a,gen_random_uuid()) is not null then raise exception 'Customer isolation failed';end if;
 begin perform rentcam_private.admin_action(a,'approve','{}');exception when others then rejected=true;end;
 if not rejected then raise exception 'Unpaid approved';end if;
 perform rentcam_private.admin_action(a,'record_payment',jsonb_build_object('amount',n/2));
 if (select payment_status from rentcam_orders where id=a)<>'partial' then raise exception 'Partial mismatch';end if;
 perform rentcam_private.admin_action(a,'record_payment',jsonb_build_object('amount',n/2));
 perform rentcam_private.admin_action(a,'approve','{}');
 perform rentcam_private.checkout(b,'TEST Stock Flow','081234567890','',current_date+30,current_date+30,'TEST rollback','[{"id":"arri-alexa-35","q":2}]',jsonb_build_object('customer_token',gen_random_uuid()));
 perform rentcam_private.admin_action(b,'record_payment',jsonb_build_object('amount',n*2));
 rejected=false;begin perform rentcam_private.admin_action(b,'approve','{}');exception when others then rejected=true;end;
 if not rejected then raise exception 'Stock overlap approved';end if;
 perform rentcam_private.admin_action(a,'delivered','{}');
 if (select rental_status from rentcam_orders where id=a)<>'rented' then raise exception 'Delivery mismatch';end if;
 perform rentcam_private.admin_action(a,'collected','{}');
 if (select rental_status from rentcam_orders where id=a)<>'returned' then raise exception 'Return mismatch';end if;
 if (select sum(amount) from rentcam_finance_entries where order_id=a)<>n then raise exception 'Finance mismatch';end if;
 perform rentcam_private.admin_action(b,'approve','{}');
 raise exception using errcode='P0002',message='rollback successful rental tests';
 exception when no_data_found then null;
 end;
end $test$;
do $test$ declare a uuid=gen_random_uuid();t uuid=gen_random_uuid();cap uuid=gen_random_uuid();pid uuid;pid2 uuid;r jsonb;n numeric;path text; begin begin
 execute 'create or replace function public.rentcam_is_admin() returns boolean language sql stable security definer set search_path=public as $f$select true$f$';
 perform rentcam_private.admin_action(null,'banks','{"accounts":[{"id":"TEST-bank","bank":"TEST Bank","number":"00000000","holder":"TEST Account","active":true}]}');
 insert into rentcam_private.checkout_tokens(token,ip_hash)values(cap,'TEST');path=cap::text||'/TEST.png';
 insert into storage.objects(bucket_id,name)values('rental-receipts',path);
 r=rentcam_private.checkout(a,'TEST Proof Flow','081234567890','',current_date+40,current_date+40,'TEST rollback','[{"id":"arri-alexa-35","q":1}]',jsonb_build_object('customer_token',t,'bank_id','TEST-bank','receipt_path',path,'transfer_amount',6500000));
 n=(r->>'total')::numeric;
 select id into pid from rentcam_payment_proofs where order_id=a;
 if pid is null or (select payment_status from rentcam_orders where id=a)<>'pending' then raise exception 'Proof pending failed';end if;
 pid2=rentcam_private.submit_proof(a,t,path,'TEST-bank',6500000);
 if pid<>pid2 then raise exception 'Duplicate proof';end if;
 perform rentcam_private.admin_action(a,'verify_proof',jsonb_build_object('proof_id',pid,'amount',n));
 perform rentcam_private.admin_action(a,'verify_proof',jsonb_build_object('proof_id',pid,'amount',n));
 if (select count(*) from rentcam_finance_entries where proof_id=pid)<>1 then raise exception 'Duplicate income';end if;
 if (select payment_status from rentcam_orders where id=a)<>'paid' then raise exception 'Proof paid failed';end if;
 perform rentcam_private.admin_action(a,'approve','{}');
 raise exception using errcode='P0002',message='rollback successful proof tests';exception when no_data_found then null;end;end $test$;
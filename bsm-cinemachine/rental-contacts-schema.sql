create table public.rentcam_contacts(id uuid primary key default gen_random_uuid(),kind text not null check(kind in('customer','vendor')),name text not null check(length(name) between 2 and 120),company text not null default '',phone text not null default '',email text not null default '',address text not null default '',notes text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.rentcam_contacts enable row level security;
grant select on public.rentcam_contacts to anon,authenticated;
create policy contacts_admin on public.rentcam_contacts for select to anon,authenticated using(public.rentcam_is_admin());
create function rentcam_private.contact_action(p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path=public as $$declare v_id uuid;begin
if not rentcam_is_admin() then raise exception 'Akses admin diperlukan';end if;
if p_action='delete' then delete from rentcam_contacts where id=(p_data->>'id')::uuid;return jsonb_build_object('ok',true);end if;
if p_action<>'save' or p_data->>'kind' not in('customer','vendor') or length(coalesce(p_data->>'name','')) not between 2 and 120 or length(coalesce(p_data->>'notes',''))>2000 or length(coalesce(p_data->>'address',''))>1000 or length(coalesce(p_data->>'company',''))>160 or length(coalesce(p_data->>'email',''))>160 or length(coalesce(p_data->>'phone',''))>30 then raise exception 'Periksa data kontak';end if;
v_id=coalesce((p_data->>'id')::uuid,gen_random_uuid());
insert into rentcam_contacts(id,kind,name,company,phone,email,address,notes)values(v_id,p_data->>'kind',p_data->>'name',coalesce(p_data->>'company',''),coalesce(p_data->>'phone',''),coalesce(p_data->>'email',''),coalesce(p_data->>'address',''),coalesce(p_data->>'notes',''))on conflict(id)do update set name=excluded.name,company=excluded.company,phone=excluded.phone,email=excluded.email,address=excluded.address,notes=excluded.notes,updated_at=now() where rentcam_contacts.kind=excluded.kind;return jsonb_build_object('id',v_id);end;$$;
create function public.rentcam_contact_action(p_action text,p_data jsonb) returns jsonb language sql security invoker set search_path=public as $$select rentcam_private.contact_action(p_action,p_data);$$;
revoke all on function rentcam_private.contact_action(text,jsonb),public.rentcam_contact_action(text,jsonb)from public;
grant execute on function rentcam_private.contact_action(text,jsonb),public.rentcam_contact_action(text,jsonb)to anon,authenticated;
-- Verification (rolls back synthetic records)
do $test$declare v_id uuid;begin begin execute 'create or replace function public.rentcam_is_admin() returns boolean language sql stable security definer set search_path=public as $f$select true$f$';
v_id=(rentcam_private.contact_action('save','{"kind":"customer","name":"TEST Master Customer","phone":"081234567890"}')->>'id')::uuid;
perform rentcam_private.contact_action('save',jsonb_build_object('id',v_id,'kind','customer','name','TEST Customer Edited','company','TEST Company'));
if (select name from rentcam_contacts where id=v_id)<>'TEST Customer Edited' then raise exception 'Edit failed';end if;
perform rentcam_private.contact_action('delete',jsonb_build_object('id',v_id));
if exists(select 1 from rentcam_contacts where id=v_id)then raise exception 'Delete failed';end if;
perform rentcam_private.contact_action('save','{"kind":"vendor","name":"TEST Vendor","phone":"081234567890"}');
raise exception using errcode='P0002',message='rollback successful contact tests';exception when no_data_found then null;end;end $test$;
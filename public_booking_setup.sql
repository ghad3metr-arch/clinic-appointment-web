-- راه‌اندازی رزرو عمومی تن‌آرا

alter table public.appointments add column if not exists booking_source text not null default 'admin';
-- این اسکریپت را یک بار در Supabase SQL Editor اجرا کنید.

create table if not exists public.public_booking_settings (
  id boolean primary key default true,
  owner_id uuid not null references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.public_booking_settings enable row level security;

create or replace function public.get_public_booking_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_owner uuid; v_services jsonb; v_availability jsonb; v_appointments jsonb;
begin
  select owner_id into v_owner from public.public_booking_settings where id=true and enabled=true limit 1;
  if v_owner is null then raise exception 'رزرو عمومی هنوز فعال نشده است'; end if;
  select coalesce(jsonb_agg(to_jsonb(s) - 'owner_id' order by s.name),'[]'::jsonb) into v_services from public.services s where s.owner_id=v_owner and s.active=true;
  select coalesce(jsonb_agg(jsonb_build_object('slot_date',a.slot_date,'start_time',a.start_time,'end_time',a.end_time,'min_booking_days',a.min_booking_days) order by a.slot_date,a.start_time),'[]'::jsonb) into v_availability from public.availability_slots a where a.owner_id=v_owner and a.active=true and a.slot_date >= current_date;
  select coalesce(jsonb_agg(jsonb_build_object('appointment_date',a.appointment_date,'start_time',a.start_time,'status',a.status,'duration_minutes',coalesce(s.duration_minutes,0)) order by a.appointment_date,a.start_time),'[]'::jsonb) into v_appointments from public.appointments a left join public.services s on s.id=a.service_id where a.owner_id=v_owner and a.status <> 'cancelled' and a.appointment_date >= current_date;
  return jsonb_build_object('owner_id',v_owner,'services',v_services,'availability',v_availability,'appointments',v_appointments);
end $$;

grant execute on function public.get_public_booking_data() to anon, authenticated;

create or replace function public.create_public_booking(
  p_owner_id uuid,
  p_full_name text,
  p_phone text,
  p_service_id uuid,
  p_appointment_date date,
  p_start_time time
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_owner uuid; v_client uuid; v_duration integer; v_price numeric; v_end time; v_id uuid;
begin
  select owner_id into v_owner from public.public_booking_settings where id=true and enabled=true limit 1;
  if v_owner is null or v_owner <> p_owner_id then return jsonb_build_object('ok',false,'message','رزرو عمومی فعال نیست'); end if;
  if nullif(trim(p_full_name),'') is null or nullif(trim(p_phone),'') is null then return jsonb_build_object('ok',false,'message','نام و موبایل الزامی است'); end if;
  select duration_minutes,price into v_duration,v_price from public.services where id=p_service_id and owner_id=v_owner and active=true;
  if v_duration is null then return jsonb_build_object('ok',false,'message','خدمت انتخاب‌شده معتبر نیست'); end if;
  if not exists(select 1 from public.availability_slots w where w.owner_id=v_owner and w.active=true and w.slot_date=p_appointment_date and p_start_time>=w.start_time and (p_start_time + make_interval(mins=>v_duration))<=w.end_time and (p_appointment_date-current_date)>=w.min_booking_days) then return jsonb_build_object('ok',false,'message','این زمان در بازه آزاد یا شرایط رزرو نیست'); end if;
  if exists(select 1 from public.appointments a left join public.services s on s.id=a.service_id where a.owner_id=v_owner and a.appointment_date=p_appointment_date and a.status<>'cancelled' and p_start_time < a.start_time + make_interval(mins=>coalesce(s.duration_minutes,0)) and (p_start_time + make_interval(mins=>v_duration)) > a.start_time) then return jsonb_build_object('ok',false,'message','این زمان همین الان رزرو شد؛ لطفاً زمان دیگری انتخاب کنید'); end if;
  select id into v_client from public.clients where owner_id=v_owner and phone=trim(p_phone) limit 1;
  if v_client is null then insert into public.clients(owner_id,full_name,phone) values(v_owner,trim(p_full_name),trim(p_phone)) returning id into v_client; else update public.clients set full_name=trim(p_full_name) where id=v_client; end if;
  insert into public.appointments(owner_id,client_id,service_id,appointment_date,start_time,status,price,paid_amount,notes,booking_source) values(v_owner,v_client,p_service_id,p_appointment_date,p_start_time,'scheduled',coalesce(v_price,0),0,'رزرو از صفحه عمومی','public') returning id into v_id;
  return jsonb_build_object('ok',true,'appointment_id',v_id);
end $$;

grant execute on function public.create_public_booking(uuid,text,text,uuid,date,time) to anon, authenticated;

-- فقط یک بار اجرا شود. چون این دستور از auth.uid() استفاده می‌کند، آن را با همان حساب مالک در SQL Editor اجرا کنید.
insert into public.public_booking_settings(id,owner_id,enabled)
select true,id,true from auth.users order by created_at limit 1
on conflict(id) do update set owner_id=excluded.owner_id,enabled=true;

-- Tan Ara: افزودن شغل و تاریخ تولد شمسی‌پذیر به پرونده مراجعین
-- در Supabase > SQL Editor اجرا شود. تاریخ تولد در دیتابیس به صورت DATE (میلادی استاندارد) ذخیره می‌شود؛ سایت آن را شمسی نمایش می‌دهد.
alter table public.clients add column if not exists job text;
alter table public.clients add column if not exists birth_date date;

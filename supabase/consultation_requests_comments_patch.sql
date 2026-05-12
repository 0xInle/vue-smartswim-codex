alter table public.consultation_requests
  add column if not exists callback_date date;

alter table public.consultation_requests
  add column if not exists callback_time time;

alter table public.consultation_requests
  add column if not exists comment text;

notify pgrst, 'reload schema';

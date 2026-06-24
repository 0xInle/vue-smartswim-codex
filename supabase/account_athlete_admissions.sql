create table if not exists public.account_athlete_applications (
  id text primary key,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  owner_email text,
  owner_name text,
  owner_phone text,
  scope text not null default 'athlete',
  scope_id text not null default 'profile',
  participant_name text,
  participant_birth_date date,
  participant_club text,
  participant_kind text not null default 'athlete',
  status text not null default 'new',
  note text,
  updated_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.account_admissions (
  id text primary key,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  owner_email text,
  owner_name text,
  scope text not null default 'profile',
  scope_id text not null default 'profile',
  participant_name text,
  participant_birth_date date,
  participant_club text,
  participant_kind text not null default 'owner',
  status text not null default 'admitted',
  note text,
  admitted_at timestamptz,
  admitted_by text,
  email_notification_status text not null default 'pending',
  email_notification_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.account_athlete_applications
  add column if not exists owner_phone text;

alter table public.account_athlete_applications
  drop constraint if exists account_athlete_applications_scope_check;

alter table public.account_athlete_applications
  add constraint account_athlete_applications_scope_check
  check (scope in ('profile', 'athlete', 'user'));

alter table public.account_athlete_applications
  drop constraint if exists account_athlete_applications_participant_kind_check;

alter table public.account_athlete_applications
  add constraint account_athlete_applications_participant_kind_check
  check (participant_kind in ('owner', 'athlete', 'user'));

alter table public.account_athlete_applications
  drop constraint if exists account_athlete_applications_status_check;

alter table public.account_athlete_applications
  add constraint account_athlete_applications_status_check
  check (
    status in (
      'new',
      'processed',
      'call_back',
      'busy',
      'unavailable',
      'scheduled',
      'closed',
      'reviewing',
      'needs_data',
      'ready',
      'admitted',
      'rejected'
    )
  );

alter table public.account_admissions
  drop constraint if exists account_admissions_scope_check;

alter table public.account_admissions
  add constraint account_admissions_scope_check
  check (scope in ('profile', 'athlete', 'user'));

alter table public.account_admissions
  drop constraint if exists account_admissions_participant_kind_check;

alter table public.account_admissions
  add constraint account_admissions_participant_kind_check
  check (participant_kind in ('owner', 'athlete', 'user'));

alter table public.account_admissions
  drop constraint if exists account_admissions_status_check;

alter table public.account_admissions
  add constraint account_admissions_status_check
  check (
    status in (
      'new',
      'processed',
      'call_back',
      'busy',
      'unavailable',
      'scheduled',
      'closed',
      'reviewing',
      'needs_data',
      'ready',
      'admitted',
      'rejected'
    )
  );

alter table public.account_admissions
  drop constraint if exists account_admissions_email_notification_status_check;

alter table public.account_admissions
  add constraint account_admissions_email_notification_status_check
  check (email_notification_status in ('pending', 'sent', 'failed', 'skipped'));

create or replace function public.touch_account_athlete_application_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists account_athlete_applications_touch_updated_at on public.account_athlete_applications;
create trigger account_athlete_applications_touch_updated_at
before update on public.account_athlete_applications
for each row execute procedure public.touch_account_athlete_application_updated_at();

create or replace function public.touch_account_admission_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists account_admissions_touch_updated_at on public.account_admissions;
create trigger account_admissions_touch_updated_at
before update on public.account_admissions
for each row execute procedure public.touch_account_admission_updated_at();

create index if not exists account_athlete_applications_owner_user_id_idx
  on public.account_athlete_applications (owner_user_id);

create index if not exists account_athlete_applications_scope_idx
  on public.account_athlete_applications (scope, scope_id);

create index if not exists account_athlete_applications_status_idx
  on public.account_athlete_applications (status);

create index if not exists account_athlete_applications_updated_at_idx
  on public.account_athlete_applications (updated_at desc);

create index if not exists account_admissions_owner_user_id_idx
  on public.account_admissions (owner_user_id);

create index if not exists account_admissions_scope_idx
  on public.account_admissions (scope, scope_id);

create index if not exists account_admissions_status_idx
  on public.account_admissions (status);

create index if not exists account_admissions_updated_at_idx
  on public.account_admissions (updated_at desc);

alter table public.account_athlete_applications enable row level security;
alter table public.account_admissions enable row level security;

drop policy if exists "Allow authenticated users to read own athlete applications" on public.account_athlete_applications;
drop policy if exists "Allow staff read athlete applications" on public.account_athlete_applications;
drop policy if exists "Allow staff upsert athlete applications" on public.account_athlete_applications;
drop policy if exists "Allow staff delete athlete applications" on public.account_athlete_applications;

create policy "Allow authenticated users to read own athlete applications"
on public.account_athlete_applications
for select
to authenticated
using (
  owner_user_id = auth.uid()
  or public.current_crm_role() in ('admin', 'trainer')
);

create policy "Allow staff read athlete applications"
on public.account_athlete_applications
for select
to authenticated
using (public.current_crm_role() in ('admin', 'trainer'));

create policy "Allow staff upsert athlete applications"
on public.account_athlete_applications
for all
to authenticated
using (public.current_crm_role() in ('admin', 'trainer'))
with check (public.current_crm_role() in ('admin', 'trainer'));

create policy "Allow staff delete athlete applications"
on public.account_athlete_applications
for delete
to authenticated
using (public.current_crm_role() in ('admin', 'trainer'));

drop policy if exists "Allow authenticated users to read own admissions" on public.account_admissions;
drop policy if exists "Allow staff read admissions" on public.account_admissions;
drop policy if exists "Allow staff upsert admissions" on public.account_admissions;
drop policy if exists "Allow staff delete admissions" on public.account_admissions;

create policy "Allow authenticated users to read own admissions"
on public.account_admissions
for select
to authenticated
using (
  owner_user_id = auth.uid()
  or public.current_crm_role() in ('admin', 'trainer')
);

create policy "Allow staff read admissions"
on public.account_admissions
for select
to authenticated
using (public.current_crm_role() in ('admin', 'trainer'));

create policy "Allow staff upsert admissions"
on public.account_admissions
for all
to authenticated
using (public.current_crm_role() in ('admin', 'trainer'))
with check (public.current_crm_role() in ('admin', 'trainer'));

create policy "Allow staff delete admissions"
on public.account_admissions
for delete
to authenticated
using (public.current_crm_role() in ('admin', 'trainer'));

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'account_athlete_applications'
  ) then
    alter publication supabase_realtime add table public.account_athlete_applications;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'account_admissions'
  ) then
    alter publication supabase_realtime add table public.account_admissions;
  end if;
end;
$$;

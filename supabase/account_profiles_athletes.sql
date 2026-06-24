create table if not exists public.account_profiles (
  owner_user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  birth_date date,
  club text not null default '',
  phone text not null default '',
  email text not null default '',
  experience text not null default '',
  main_profile text not null default '',
  available_seats text not null default '',
  education text not null default '',
  sport_achievements text not null default '',
  works_with text not null default '',
  min_age text not null default '',
  preparation_level text not null default '',
  metro text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint account_profiles_email_check
    check (email = '' or position('@' in email) > 1)
);

alter table public.account_profiles
  add column if not exists experience text not null default '',
  add column if not exists main_profile text not null default '',
  add column if not exists available_seats text not null default '',
  add column if not exists education text not null default '',
  add column if not exists sport_achievements text not null default '',
  add column if not exists works_with text not null default '',
  add column if not exists min_age text not null default '',
  add column if not exists preparation_level text not null default '',
  add column if not exists metro text not null default '';

create table if not exists public.account_athletes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null default '',
  birth_date date,
  gender text not null default '',
  club text not null default '',
  rank text not null default '',
  coach text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint account_athletes_gender_check
    check (gender in ('', 'male', 'female')),
  constraint account_athletes_full_name_check
    check (nullif(trim(full_name), '') is not null)
);

create index if not exists account_athletes_owner_user_id_idx
  on public.account_athletes (owner_user_id);

create index if not exists account_athletes_updated_at_idx
  on public.account_athletes (updated_at desc);

create index if not exists account_profiles_updated_at_idx
  on public.account_profiles (updated_at desc);

create or replace function public.touch_account_profiles_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists account_profiles_touch_updated_at on public.account_profiles;
create trigger account_profiles_touch_updated_at
before update on public.account_profiles
for each row execute procedure public.touch_account_profiles_updated_at();

create or replace function public.touch_account_athletes_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists account_athletes_touch_updated_at on public.account_athletes;
create trigger account_athletes_touch_updated_at
before update on public.account_athletes
for each row execute procedure public.touch_account_athletes_updated_at();

alter table public.account_profiles enable row level security;
alter table public.account_athletes enable row level security;

drop policy if exists "Allow authenticated users to read own account profile" on public.account_profiles;
drop policy if exists "Allow authenticated users to insert own account profile" on public.account_profiles;
drop policy if exists "Allow authenticated users to update own account profile" on public.account_profiles;
drop policy if exists "Allow admin read account profiles" on public.account_profiles;

create policy "Allow authenticated users to read own account profile"
on public.account_profiles
for select
to authenticated
using (auth.uid() = owner_user_id);

create policy "Allow authenticated users to insert own account profile"
on public.account_profiles
for insert
to authenticated
with check (auth.uid() = owner_user_id);

create policy "Allow authenticated users to update own account profile"
on public.account_profiles
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy "Allow admin read account profiles"
on public.account_profiles
for select
to authenticated
using (public.current_crm_role() = 'admin');

drop policy if exists "Allow authenticated users to read own account athletes" on public.account_athletes;
drop policy if exists "Allow authenticated users to insert own account athletes" on public.account_athletes;
drop policy if exists "Allow authenticated users to update own account athletes" on public.account_athletes;
drop policy if exists "Allow authenticated users to delete own account athletes" on public.account_athletes;
drop policy if exists "Allow admin read account athletes" on public.account_athletes;

create policy "Allow authenticated users to read own account athletes"
on public.account_athletes
for select
to authenticated
using (auth.uid() = owner_user_id);

create policy "Allow authenticated users to insert own account athletes"
on public.account_athletes
for insert
to authenticated
with check (auth.uid() = owner_user_id);

create policy "Allow authenticated users to update own account athletes"
on public.account_athletes
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy "Allow authenticated users to delete own account athletes"
on public.account_athletes
for delete
to authenticated
using (auth.uid() = owner_user_id);

create policy "Allow admin read account athletes"
on public.account_athletes
for select
to authenticated
using (public.current_crm_role() = 'admin');

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'account_profiles'
  ) then
    alter publication supabase_realtime add table public.account_profiles;
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'account_athletes'
  ) then
    alter publication supabase_realtime add table public.account_athletes;
  end if;
end;
$$;

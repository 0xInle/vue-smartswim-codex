create table if not exists public.crm_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text,
  role text not null default 'user',
  account_status text not null default 'paid',
  registered_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.allowed_admin_emails (
  email text primary key,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint allowed_admin_emails_email_check
    check (nullif(trim(email), '') is not null)
);

create table if not exists public.trainers (
  email text primary key,
  name text,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint trainers_email_check
    check (nullif(trim(email), '') is not null)
);

insert into public.allowed_admin_emails (email, note)
values ('smartswim@inbox.ru', 'Первый администратор Smart Swim')
on conflict (email) do update
set note = excluded.note;

insert into public.trainers (email, name, note)
values ('ss-biryukoff@yandex.ru', '', 'Тренер Smart Swim')
on conflict (email) do update
set
  name = excluded.name,
  note = excluded.note;

alter table public.crm_users
  add column if not exists role text;

alter table public.crm_users
  add column if not exists account_status text not null default 'paid';

update public.crm_users
set role = case
  when exists (
    select 1
    from public.allowed_admin_emails as allowed_admin_emails
    where lower(allowed_admin_emails.email) = lower(public.crm_users.email)
  ) then 'admin'
  when exists (
    select 1
    from public.trainers as trainers
    where lower(trainers.email) = lower(public.crm_users.email)
  ) then 'trainer'
  else 'user'
end
where role is null
   or role not in ('admin', 'trainer', 'user', 'athlete');

alter table public.crm_users
  alter column role set default 'user';

alter table public.crm_users
  alter column role set not null;

update public.crm_users
set account_status = 'paid'
where account_status is null
   or account_status not in ('paid', 'unpaid');

alter table public.crm_users
  alter column account_status set default 'paid';

alter table public.crm_users
  alter column account_status set not null;

do $$
begin
  alter table public.crm_users
    drop constraint if exists crm_users_role_check;

  alter table public.crm_users
    add constraint crm_users_role_check
    check (role in ('admin', 'trainer', 'user', 'athlete'));
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'crm_users_account_status_check'
      and conrelid = 'public.crm_users'::regclass
  ) then
    alter table public.crm_users
      add constraint crm_users_account_status_check
      check (account_status in ('paid', 'unpaid'));
  end if;
end;
$$;

create index if not exists crm_users_role_idx
  on public.crm_users (role);

create index if not exists crm_users_account_status_idx
  on public.crm_users (account_status);

create index if not exists crm_users_registered_at_idx
  on public.crm_users (registered_at desc);

create or replace function public.search_account_users_for_admin(
  search_query text default '',
  role_filter text default 'all',
  page_number integer default 1,
  page_size integer default 20
)
returns table (
  row_kind text,
  row_id text,
  owner_user_id uuid,
  athlete_id uuid,
  email text,
  name text,
  phone text,
  role text,
  account_status text,
  registered_at timestamptz,
  birth_date date,
  club text,
  gender text,
  rank text,
  coach text,
  experience text,
  main_profile text,
  available_seats text,
  education text,
  sport_achievements text,
  works_with text,
  min_age text,
  preparation_level text,
  metro text,
  owner_name text,
  owner_email text,
  owner_phone text,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with normalized_params as (
    select
      nullif(trim(coalesce(search_query, '')), '') as query,
      case
        when role_filter in ('admin', 'trainer', 'user', 'athlete') then role_filter
        else 'all'
      end as role,
      greatest(coalesce(page_number, 1), 1) as page,
      least(greatest(coalesce(page_size, 20), 1), 100) as size
  ),
  owner_rows as (
    select
      'owner'::text as row_kind,
      crm_users.id::text as row_id,
      crm_users.id as owner_user_id,
      null::uuid as athlete_id,
      coalesce(account_profiles.email, crm_users.email, '')::text as email,
      coalesce(nullif(account_profiles.full_name, ''), nullif(crm_users.name, ''), crm_users.email, '')::text as name,
      coalesce(account_profiles.phone, '')::text as phone,
      crm_users.role::text as role,
      crm_users.account_status::text as account_status,
      crm_users.registered_at as registered_at,
      account_profiles.birth_date as birth_date,
      coalesce(account_profiles.club, '')::text as club,
      ''::text as gender,
      ''::text as rank,
      ''::text as coach,
      coalesce(account_profiles.experience, '')::text as experience,
      coalesce(account_profiles.main_profile, '')::text as main_profile,
      coalesce(account_profiles.available_seats, '')::text as available_seats,
      coalesce(account_profiles.education, '')::text as education,
      coalesce(account_profiles.sport_achievements, '')::text as sport_achievements,
      coalesce(account_profiles.works_with, '')::text as works_with,
      coalesce(account_profiles.min_age, '')::text as min_age,
      coalesce(account_profiles.preparation_level, '')::text as preparation_level,
      coalesce(account_profiles.metro, '')::text as metro,
      ''::text as owner_name,
      ''::text as owner_email,
      ''::text as owner_phone,
      crm_users.registered_at as sort_at,
      0 as row_order
    from public.crm_users as crm_users
    left join public.account_profiles as account_profiles
      on account_profiles.owner_user_id = crm_users.id
    cross join normalized_params
    where public.current_crm_role() = 'admin'
      and normalized_params.role <> 'athlete'
      and (
        normalized_params.role = 'all'
        or crm_users.role = normalized_params.role
      )
      and (
        normalized_params.query is null
        or concat_ws(
          ' ',
          crm_users.id::text,
          crm_users.email,
          crm_users.name,
          crm_users.role,
          crm_users.account_status,
          account_profiles.full_name,
          account_profiles.phone,
          account_profiles.email,
          account_profiles.club,
          account_profiles.experience,
          account_profiles.main_profile,
          account_profiles.metro
        ) ilike '%' || normalized_params.query || '%'
      )
  ),
  athlete_rows as (
    select
      'athlete'::text as row_kind,
      ('athlete:' || account_athletes.id::text)::text as row_id,
      crm_users.id as owner_user_id,
      account_athletes.id as athlete_id,
      coalesce(account_profiles.email, crm_users.email, '')::text as email,
      coalesce(account_athletes.full_name, '')::text as name,
      coalesce(account_profiles.phone, '')::text as phone,
      'athlete'::text as role,
      crm_users.account_status::text as account_status,
      coalesce(account_athletes.created_at, crm_users.registered_at) as registered_at,
      account_athletes.birth_date as birth_date,
      coalesce(account_athletes.club, '')::text as club,
      coalesce(account_athletes.gender, '')::text as gender,
      coalesce(account_athletes.rank, '')::text as rank,
      coalesce(account_athletes.coach, '')::text as coach,
      ''::text as experience,
      ''::text as main_profile,
      ''::text as available_seats,
      ''::text as education,
      ''::text as sport_achievements,
      ''::text as works_with,
      ''::text as min_age,
      ''::text as preparation_level,
      ''::text as metro,
      coalesce(nullif(account_profiles.full_name, ''), nullif(crm_users.name, ''), crm_users.email, '')::text as owner_name,
      coalesce(account_profiles.email, crm_users.email, '')::text as owner_email,
      coalesce(account_profiles.phone, '')::text as owner_phone,
      coalesce(account_athletes.created_at, crm_users.registered_at) as sort_at,
      1 as row_order
    from public.account_athletes as account_athletes
    join public.crm_users as crm_users
      on crm_users.id = account_athletes.owner_user_id
    left join public.account_profiles as account_profiles
      on account_profiles.owner_user_id = crm_users.id
    cross join normalized_params
    where public.current_crm_role() = 'admin'
      and normalized_params.role in ('all', 'athlete')
      and (
        normalized_params.query is null
        or concat_ws(
          ' ',
          account_athletes.id::text,
          account_athletes.full_name,
          account_athletes.birth_date::text,
          account_athletes.gender,
          account_athletes.club,
          account_athletes.rank,
          account_athletes.coach,
          crm_users.email,
          crm_users.name,
          account_profiles.full_name,
          account_profiles.phone,
          account_profiles.email,
          account_profiles.club
        ) ilike '%' || normalized_params.query || '%'
      )
  ),
  combined_rows as (
    select * from owner_rows
    union all
    select * from athlete_rows
  ),
  counted_rows as (
    select
      combined_rows.*,
      count(*) over() as total_count
    from combined_rows
  )
  select
    counted_rows.row_kind,
    counted_rows.row_id,
    counted_rows.owner_user_id,
    counted_rows.athlete_id,
    counted_rows.email,
    counted_rows.name,
    counted_rows.phone,
    counted_rows.role,
    counted_rows.account_status,
    counted_rows.registered_at,
    counted_rows.birth_date,
    counted_rows.club,
    counted_rows.gender,
    counted_rows.rank,
    counted_rows.coach,
    counted_rows.experience,
    counted_rows.main_profile,
    counted_rows.available_seats,
    counted_rows.education,
    counted_rows.sport_achievements,
    counted_rows.works_with,
    counted_rows.min_age,
    counted_rows.preparation_level,
    counted_rows.metro,
    counted_rows.owner_name,
    counted_rows.owner_email,
    counted_rows.owner_phone,
    counted_rows.total_count
  from counted_rows
  cross join normalized_params
  order by counted_rows.sort_at desc nulls last, counted_rows.row_order, counted_rows.name
  limit (select size from normalized_params)
  offset (select (page - 1) * size from normalized_params);
$$;

grant execute on function public.search_account_users_for_admin(text, text, integer, integer) to authenticated;

alter table public.crm_users enable row level security;
alter table public.allowed_admin_emails enable row level security;
alter table public.trainers enable row level security;

drop policy if exists "Allow public read crm users" on public.crm_users;
drop policy if exists "Allow authenticated users to read own crm profile" on public.crm_users;
drop policy if exists "Allow admin read crm users" on public.crm_users;
drop policy if exists "Allow admin update crm users" on public.crm_users;
drop policy if exists "Allow admin delete crm users" on public.crm_users;

create policy "Allow authenticated users to read own crm profile"
on public.crm_users
for select
to authenticated
using (auth.uid() = id);

create policy "Allow admin read crm users"
on public.crm_users
for select
to authenticated
using (public.current_crm_role() = 'admin');

create policy "Allow admin update crm users"
on public.crm_users
for update
to authenticated
using (public.current_crm_role() = 'admin')
with check (public.current_crm_role() = 'admin');

create policy "Allow admin delete crm users"
on public.crm_users
for delete
to authenticated
using (public.current_crm_role() = 'admin');

create or replace function public.resolve_crm_role(user_email text)
returns text
language plpgsql
stable
as $$
begin
  if exists (
    select 1
    from public.allowed_admin_emails as allowed_admin_emails
    where lower(allowed_admin_emails.email) = lower(coalesce(user_email, ''))
  ) then
    return 'admin';
  end if;

  if exists (
    select 1
    from public.trainers as trainers
    where lower(trainers.email) = lower(coalesce(user_email, ''))
  ) then
    return 'trainer';
  end if;

  return 'user';
end;
$$;

create or replace function public.current_crm_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select crm_users.role
  from public.crm_users
  where crm_users.id = auth.uid();
$$;

grant execute on function public.resolve_crm_role(text) to anon, authenticated;
grant execute on function public.current_crm_role() to authenticated;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.crm_users (id, email, name, role, account_status, registered_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    public.resolve_crm_role(new.email),
    'paid',
    coalesce(new.created_at, timezone('utc', now()))
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = excluded.name,
    role = public.resolve_crm_role(excluded.email),
    registered_at = excluded.registered_at;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_auth_user_created();

insert into public.crm_users (id, email, name, role, account_status, registered_at)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data ->> 'name', ''),
  public.resolve_crm_role(users.email),
  'paid',
  coalesce(users.created_at, timezone('utc', now()))
from auth.users as users
on conflict (id) do update
set
  email = excluded.email,
  name = excluded.name,
  role = public.resolve_crm_role(excluded.email),
  registered_at = excluded.registered_at;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'crm_users'
  ) then
    alter publication supabase_realtime add table public.crm_users;
  end if;
end;
$$;

create table if not exists public.crm_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text,
  role text not null default 'user',
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
   or role not in ('admin', 'trainer', 'user')
   or role in ('admin', 'trainer', 'user');

alter table public.crm_users
  alter column role set default 'user';

alter table public.crm_users
  alter column role set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'crm_users_role_check'
      and conrelid = 'public.crm_users'::regclass
  ) then
    alter table public.crm_users
      add constraint crm_users_role_check
      check (role in ('admin', 'trainer', 'user'));
  end if;
end;
$$;

alter table public.crm_users enable row level security;
alter table public.allowed_admin_emails enable row level security;
alter table public.trainers enable row level security;

drop policy if exists "Allow public read crm users" on public.crm_users;
drop policy if exists "Allow authenticated users to read own crm profile" on public.crm_users;

create policy "Allow authenticated users to read own crm profile"
on public.crm_users
for select
to authenticated
using (auth.uid() = id);

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
  insert into public.crm_users (id, email, name, role, registered_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    public.resolve_crm_role(new.email),
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

insert into public.crm_users (id, email, name, role, registered_at)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data ->> 'name', ''),
  public.resolve_crm_role(users.email),
  coalesce(users.created_at, timezone('utc', now()))
from auth.users as users
on conflict (id) do update
set
  email = excluded.email,
  name = excluded.name,
  role = public.resolve_crm_role(excluded.email),
  registered_at = excluded.registered_at;

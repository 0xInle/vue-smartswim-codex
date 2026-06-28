create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table if not exists private.allowed_admin_emails (
  email text primary key,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint allowed_admin_emails_email_check
    check (nullif(trim(email), '') is not null)
);

create table if not exists private.trainers (
  email text primary key,
  name text,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint trainers_email_check
    check (nullif(trim(email), '') is not null)
);

do $$
begin
  if to_regclass('public.allowed_admin_emails') is not null then
    insert into private.allowed_admin_emails (email, note, created_at)
    select email, note, created_at
    from public.allowed_admin_emails
    on conflict (email) do update
    set
      note = excluded.note,
      created_at = excluded.created_at;
  end if;

  if to_regclass('public.trainers') is not null then
    insert into private.trainers (email, name, note, created_at)
    select email, name, note, created_at
    from public.trainers
    on conflict (email) do update
    set
      name = excluded.name,
      note = excluded.note,
      created_at = excluded.created_at;
  end if;
end;
$$;

insert into private.allowed_admin_emails (email, note)
values ('smartswim@inbox.ru', 'Первый администратор Smart Swim')
on conflict (email) do update
set note = excluded.note;

insert into private.trainers (email, name, note)
values ('ss-biryukoff@yandex.ru', '', 'Тренер Smart Swim')
on conflict (email) do update
set
  name = excluded.name,
  note = excluded.note;

alter table private.allowed_admin_emails enable row level security;
alter table private.trainers enable row level security;

drop policy if exists "Allow admin read allowed admin emails" on private.allowed_admin_emails;
drop policy if exists "Allow admin manage allowed admin emails" on private.allowed_admin_emails;
drop policy if exists "Allow admin read trainer allowlist" on private.trainers;
drop policy if exists "Allow admin manage trainer allowlist" on private.trainers;

create policy "Allow admin read allowed admin emails"
on private.allowed_admin_emails
for select
to authenticated
using (public.current_crm_role() = 'admin');

create policy "Allow admin manage allowed admin emails"
on private.allowed_admin_emails
for all
to authenticated
using (public.current_crm_role() = 'admin')
with check (public.current_crm_role() = 'admin');

create policy "Allow admin read trainer allowlist"
on private.trainers
for select
to authenticated
using (public.current_crm_role() = 'admin');

create policy "Allow admin manage trainer allowlist"
on private.trainers
for all
to authenticated
using (public.current_crm_role() = 'admin')
with check (public.current_crm_role() = 'admin');

create or replace function public.resolve_crm_role(user_email text)
returns text
language plpgsql
set search_path = public, private
stable
as $$
begin
  if exists (
    select 1
    from private.allowed_admin_emails as allowed_admin_emails
    where lower(allowed_admin_emails.email) = lower(coalesce(user_email, ''))
  ) then
    return 'admin';
  end if;

  if exists (
    select 1
    from private.trainers as trainers
    where lower(trainers.email) = lower(coalesce(user_email, ''))
  ) then
    return 'trainer';
  end if;

  return 'user';
end;
$$;

revoke execute on function public.resolve_crm_role(text) from public, anon, authenticated;

update public.crm_users
set role = case
  when exists (
    select 1
    from private.allowed_admin_emails as allowed_admin_emails
    where lower(allowed_admin_emails.email) = lower(public.crm_users.email)
  ) then 'admin'
  when exists (
    select 1
    from private.trainers as trainers
    where lower(trainers.email) = lower(public.crm_users.email)
  ) then 'trainer'
  when role in ('admin', 'trainer') then 'user'
  else role
end;

drop table if exists public.allowed_admin_emails;
drop table if exists public.trainers;

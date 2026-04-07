create table if not exists public.crm_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text,
  registered_at timestamptz not null default timezone('utc', now())
);

alter table public.crm_users enable row level security;

drop policy if exists "Allow public read crm users" on public.crm_users;
drop policy if exists "Allow authenticated users to read own crm profile" on public.crm_users;
create policy "Allow authenticated users to read own crm profile"
on public.crm_users
for select
to authenticated
using (auth.uid() = id);

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.crm_users (id, email, name, registered_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.created_at, timezone('utc', now()))
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = excluded.name,
    registered_at = excluded.registered_at;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_auth_user_created();

insert into public.crm_users (id, email, name, registered_at)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data ->> 'name', ''),
  coalesce(users.created_at, timezone('utc', now()))
from auth.users as users
on conflict (id) do update
set
  email = excluded.email,
  name = excluded.name,
  registered_at = excluded.registered_at;

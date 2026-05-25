create table if not exists public.competition_catalog (
  id text primary key,
  state jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.competition_catalog
  drop constraint if exists competition_catalog_state_is_array_check;

alter table public.competition_catalog
  add constraint competition_catalog_state_is_array_check
  check (jsonb_typeof(state) = 'array');

create or replace function public.touch_competition_catalog_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists competition_catalog_touch_updated_at on public.competition_catalog;
create trigger competition_catalog_touch_updated_at
before update on public.competition_catalog
for each row execute procedure public.touch_competition_catalog_updated_at();

create index if not exists competition_catalog_updated_at_idx
  on public.competition_catalog (updated_at desc);

alter table public.competition_catalog enable row level security;

drop policy if exists "Allow public read competition catalog" on public.competition_catalog;
drop policy if exists "Allow admin insert competition catalog" on public.competition_catalog;
drop policy if exists "Allow admin update competition catalog" on public.competition_catalog;
drop policy if exists "Allow admin delete competition catalog" on public.competition_catalog;

create policy "Allow public read competition catalog"
on public.competition_catalog
for select
to anon, authenticated
using (true);

create policy "Allow admin insert competition catalog"
on public.competition_catalog
for insert
to authenticated
with check (public.current_crm_role() = 'admin');

create policy "Allow admin update competition catalog"
on public.competition_catalog
for update
to authenticated
using (public.current_crm_role() = 'admin')
with check (public.current_crm_role() = 'admin');

create policy "Allow admin delete competition catalog"
on public.competition_catalog
for delete
to authenticated
using (public.current_crm_role() = 'admin');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'competition_catalog'
  ) then
    alter publication supabase_realtime add table public.competition_catalog;
  end if;
end;
$$;

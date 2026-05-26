create table if not exists public.competition_payments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.competition_applications (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'yookassa',
  provider_payment_id text,
  provider_status text,
  status text not null default 'pending',
  amount_value numeric(10, 2) not null default 0,
  amount_currency text not null default 'RUB',
  description text,
  confirmation_url text,
  idempotence_key text not null default gen_random_uuid()::text,
  metadata jsonb not null default '{}'::jsonb,
  created_by_role text not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.competition_payments
  add column if not exists provider text not null default 'yookassa';

alter table public.competition_payments
  add column if not exists provider_payment_id text;

alter table public.competition_payments
  add column if not exists provider_status text;

alter table public.competition_payments
  add column if not exists confirmation_url text;

alter table public.competition_payments
  add column if not exists idempotence_key text not null default gen_random_uuid()::text;

alter table public.competition_payments
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.competition_payments
  add column if not exists created_by_role text not null default 'user';

alter table public.competition_payments
  drop constraint if exists competition_payments_provider_check;

alter table public.competition_payments
  add constraint competition_payments_provider_check
  check (provider in ('yookassa'));

alter table public.competition_payments
  drop constraint if exists competition_payments_status_check;

alter table public.competition_payments
  add constraint competition_payments_status_check
  check (status in ('pending', 'provider_unavailable', 'succeeded', 'failed', 'canceled', 'refunded'));

alter table public.competition_payments
  drop constraint if exists competition_payments_amount_currency_check;

alter table public.competition_payments
  add constraint competition_payments_amount_currency_check
  check (amount_currency = 'RUB');

alter table public.competition_payments
  drop constraint if exists competition_payments_amount_value_check;

alter table public.competition_payments
  add constraint competition_payments_amount_value_check
  check (amount_value >= 0);

alter table public.competition_payments
  drop constraint if exists competition_payments_created_by_role_check;

alter table public.competition_payments
  add constraint competition_payments_created_by_role_check
  check (created_by_role in ('user', 'admin', 'system'));

create table if not exists public.competition_refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.competition_payments (id) on delete cascade,
  application_id uuid not null references public.competition_applications (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'yookassa',
  provider_refund_id text,
  provider_status text,
  status text not null default 'requested',
  amount_value numeric(10, 2) not null default 0,
  amount_currency text not null default 'RUB',
  reason text,
  admin_note text,
  requested_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.competition_refunds
  add column if not exists provider text not null default 'yookassa';

alter table public.competition_refunds
  add column if not exists provider_refund_id text;

alter table public.competition_refunds
  add column if not exists provider_status text;

alter table public.competition_refunds
  add column if not exists admin_note text;

alter table public.competition_refunds
  add column if not exists resolved_at timestamptz;

alter table public.competition_refunds
  add column if not exists resolved_by uuid references auth.users (id) on delete set null;

alter table public.competition_refunds
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.competition_refunds
  drop constraint if exists competition_refunds_provider_check;

alter table public.competition_refunds
  add constraint competition_refunds_provider_check
  check (provider in ('yookassa'));

alter table public.competition_refunds
  drop constraint if exists competition_refunds_status_check;

alter table public.competition_refunds
  add constraint competition_refunds_status_check
  check (status in ('requested', 'processing', 'succeeded', 'rejected', 'failed'));

alter table public.competition_refunds
  drop constraint if exists competition_refunds_amount_currency_check;

alter table public.competition_refunds
  add constraint competition_refunds_amount_currency_check
  check (amount_currency = 'RUB');

alter table public.competition_refunds
  drop constraint if exists competition_refunds_amount_value_check;

alter table public.competition_refunds
  add constraint competition_refunds_amount_value_check
  check (amount_value >= 0);

create table if not exists public.payment_events (
  id bigint generated by default as identity primary key,
  payment_id uuid references public.competition_payments (id) on delete cascade,
  refund_id uuid references public.competition_refunds (id) on delete cascade,
  application_id uuid references public.competition_applications (id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  actor_id uuid references auth.users (id) on delete set null,
  actor_role text,
  actor_name text,
  provider_event_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.payment_events
  add column if not exists provider_event_id text;

alter table public.payment_events
  add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.payment_events
  drop constraint if exists payment_events_event_type_check;

alter table public.payment_events
  add constraint payment_events_event_type_check
  check (event_type in ('payment_status_changed', 'refund_status_changed'));

create or replace function public.touch_competition_payment_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists competition_payments_touch_updated_at on public.competition_payments;
create trigger competition_payments_touch_updated_at
before update on public.competition_payments
for each row execute procedure public.touch_competition_payment_updated_at();

create or replace function public.touch_competition_refund_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());

  if new.status in ('succeeded', 'rejected', 'failed') and old.status is distinct from new.status then
    new.resolved_at := coalesce(new.resolved_at, timezone('utc', now()));
    new.resolved_by := coalesce(new.resolved_by, auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists competition_refunds_touch_updated_at on public.competition_refunds;
create trigger competition_refunds_touch_updated_at
before update on public.competition_refunds
for each row execute procedure public.touch_competition_refund_updated_at();

create or replace function public.sync_competition_application_payment_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_application_id uuid;
  next_payment_status text;
  next_application_status text;
begin
  target_application_id := coalesce(new.application_id, old.application_id);

  if target_application_id is null then
    return coalesce(new, old);
  end if;

  select
    case
      when exists (
        select 1
        from public.competition_refunds as refunds
        where refunds.application_id = target_application_id
          and refunds.status = 'succeeded'
      ) then 'refunded'
      when exists (
        select 1
        from public.competition_payments as payments
        where payments.application_id = target_application_id
          and payments.status = 'succeeded'
      ) then 'paid'
      when exists (
        select 1
        from public.competition_payments as payments
        where payments.application_id = target_application_id
          and payments.status in ('pending', 'provider_unavailable')
      ) then 'pending'
      when exists (
        select 1
        from public.competition_payments as payments
        where payments.application_id = target_application_id
          and payments.status = 'failed'
      ) then 'failed'
      else 'not_required'
    end
  into next_payment_status;

  select
    case
      when next_payment_status = 'pending' and competition_applications.status = 'approved'
        then 'payment_pending'
      when next_payment_status = 'paid' and competition_applications.status in ('approved', 'payment_pending')
        then 'paid'
      else competition_applications.status
    end
  into next_application_status
  from public.competition_applications as competition_applications
  where competition_applications.id = target_application_id;

  update public.competition_applications
  set
    payment_status = next_payment_status,
    status = coalesce(next_application_status, status),
    status_changed_by = case
      when status is distinct from coalesce(next_application_status, status) then 'payment'
      else status_changed_by
    end
  where id = target_application_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists competition_payments_sync_application_payment_status on public.competition_payments;
create trigger competition_payments_sync_application_payment_status
after insert or update on public.competition_payments
for each row execute procedure public.sync_competition_application_payment_status();

drop trigger if exists competition_refunds_sync_application_payment_status on public.competition_refunds;
create trigger competition_refunds_sync_application_payment_status
after insert or update on public.competition_refunds
for each row execute procedure public.sync_competition_application_payment_status();

create or replace function public.log_competition_payment_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.payment_events (
      payment_id,
      application_id,
      event_type,
      from_status,
      to_status,
      actor_id,
      actor_role,
      actor_name,
      payload
    )
    values (
      new.id,
      new.application_id,
      'payment_status_changed',
      case when tg_op = 'INSERT' then null else old.status end,
      new.status,
      auth.uid(),
      coalesce(public.current_crm_role(), new.created_by_role),
      new.created_by_role,
      jsonb_build_object(
        'provider', new.provider,
        'provider_status', new.provider_status,
        'amount_value', new.amount_value,
        'amount_currency', new.amount_currency
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists competition_payments_log_status_event on public.competition_payments;
create trigger competition_payments_log_status_event
after insert or update on public.competition_payments
for each row execute procedure public.log_competition_payment_event();

create or replace function public.log_competition_refund_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.payment_events (
      payment_id,
      refund_id,
      application_id,
      event_type,
      from_status,
      to_status,
      actor_id,
      actor_role,
      actor_name,
      payload
    )
    values (
      new.payment_id,
      new.id,
      new.application_id,
      'refund_status_changed',
      case when tg_op = 'INSERT' then null else old.status end,
      new.status,
      auth.uid(),
      public.current_crm_role(),
      coalesce(new.admin_note, new.reason, ''),
      jsonb_build_object(
        'provider', new.provider,
        'provider_status', new.provider_status,
        'amount_value', new.amount_value,
        'amount_currency', new.amount_currency
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists competition_refunds_log_status_event on public.competition_refunds;
create trigger competition_refunds_log_status_event
after insert or update on public.competition_refunds
for each row execute procedure public.log_competition_refund_event();

create index if not exists competition_payments_application_id_idx
  on public.competition_payments (application_id);

create index if not exists competition_payments_owner_user_id_idx
  on public.competition_payments (owner_user_id);

create index if not exists competition_payments_status_idx
  on public.competition_payments (status);

create index if not exists competition_payments_updated_at_idx
  on public.competition_payments (updated_at desc);

create unique index if not exists competition_payments_active_application_unique_idx
  on public.competition_payments (application_id)
  where status in ('pending', 'provider_unavailable', 'succeeded');

create index if not exists competition_refunds_payment_id_idx
  on public.competition_refunds (payment_id);

create index if not exists competition_refunds_application_id_idx
  on public.competition_refunds (application_id);

create index if not exists competition_refunds_owner_user_id_idx
  on public.competition_refunds (owner_user_id);

create index if not exists competition_refunds_status_idx
  on public.competition_refunds (status);

create index if not exists competition_refunds_updated_at_idx
  on public.competition_refunds (updated_at desc);

create unique index if not exists competition_refunds_active_payment_unique_idx
  on public.competition_refunds (payment_id)
  where status in ('requested', 'processing');

create index if not exists payment_events_payment_id_idx
  on public.payment_events (payment_id, created_at desc);

create index if not exists payment_events_refund_id_idx
  on public.payment_events (refund_id, created_at desc);

create index if not exists payment_events_application_id_idx
  on public.payment_events (application_id, created_at desc);

alter table public.competition_payments enable row level security;
alter table public.competition_refunds enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists "Allow authenticated users to read own competition payments" on public.competition_payments;
drop policy if exists "Allow authenticated users to insert own competition payments" on public.competition_payments;
drop policy if exists "Allow admin read competition payments" on public.competition_payments;
drop policy if exists "Allow admin update competition payments" on public.competition_payments;
drop policy if exists "Allow admin delete competition payments" on public.competition_payments;

create policy "Allow authenticated users to read own competition payments"
on public.competition_payments
for select
to authenticated
using (
  owner_user_id = auth.uid()
  or public.current_crm_role() = 'admin'
);

create policy "Allow authenticated users to insert own competition payments"
on public.competition_payments
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and status in ('pending', 'provider_unavailable')
  and created_by_role = 'user'
  and exists (
    select 1
    from public.competition_applications as competition_applications
    where competition_applications.id = competition_payments.application_id
      and competition_applications.owner_user_id = auth.uid()
      and competition_applications.status in ('approved', 'payment_pending')
  )
);

create policy "Allow admin read competition payments"
on public.competition_payments
for select
to authenticated
using (public.current_crm_role() = 'admin');

create policy "Allow admin update competition payments"
on public.competition_payments
for update
to authenticated
using (public.current_crm_role() = 'admin')
with check (public.current_crm_role() = 'admin');

create policy "Allow admin delete competition payments"
on public.competition_payments
for delete
to authenticated
using (public.current_crm_role() = 'admin');

drop policy if exists "Allow authenticated users to read own competition refunds" on public.competition_refunds;
drop policy if exists "Allow authenticated users to insert own competition refunds" on public.competition_refunds;
drop policy if exists "Allow admin read competition refunds" on public.competition_refunds;
drop policy if exists "Allow admin update competition refunds" on public.competition_refunds;
drop policy if exists "Allow admin delete competition refunds" on public.competition_refunds;

create policy "Allow authenticated users to read own competition refunds"
on public.competition_refunds
for select
to authenticated
using (
  owner_user_id = auth.uid()
  or public.current_crm_role() = 'admin'
);

create policy "Allow authenticated users to insert own competition refunds"
on public.competition_refunds
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and status = 'requested'
  and exists (
    select 1
    from public.competition_payments as competition_payments
    where competition_payments.id = competition_refunds.payment_id
      and competition_payments.application_id = competition_refunds.application_id
      and competition_payments.owner_user_id = auth.uid()
      and competition_payments.status = 'succeeded'
  )
);

create policy "Allow admin read competition refunds"
on public.competition_refunds
for select
to authenticated
using (public.current_crm_role() = 'admin');

create policy "Allow admin update competition refunds"
on public.competition_refunds
for update
to authenticated
using (public.current_crm_role() = 'admin')
with check (public.current_crm_role() = 'admin');

create policy "Allow admin delete competition refunds"
on public.competition_refunds
for delete
to authenticated
using (public.current_crm_role() = 'admin');

drop policy if exists "Allow authenticated users to read own payment events" on public.payment_events;
drop policy if exists "Allow admin read payment events" on public.payment_events;

create policy "Allow authenticated users to read own payment events"
on public.payment_events
for select
to authenticated
using (
  exists (
    select 1
    from public.competition_payments as competition_payments
    where competition_payments.id = payment_events.payment_id
      and competition_payments.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.competition_refunds as competition_refunds
    where competition_refunds.id = payment_events.refund_id
      and competition_refunds.owner_user_id = auth.uid()
  )
  or public.current_crm_role() = 'admin'
);

create policy "Allow admin read payment events"
on public.payment_events
for select
to authenticated
using (public.current_crm_role() = 'admin');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'competition_payments'
  ) then
    alter publication supabase_realtime add table public.competition_payments;
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
      and tablename = 'competition_refunds'
  ) then
    alter publication supabase_realtime add table public.competition_refunds;
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
      and tablename = 'payment_events'
  ) then
    alter publication supabase_realtime add table public.payment_events;
  end if;
end;
$$;

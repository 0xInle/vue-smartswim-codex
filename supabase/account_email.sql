create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  category text not null default 'manual',
  subject text not null,
  body text not null,
  is_active boolean not null default true,
  created_by_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.email_templates (id) on delete set null,
  created_by_user_id uuid references auth.users (id) on delete set null,
  created_by_email text,
  created_by_name text,
  audience_type text not null default 'selected_users',
  context_type text not null default 'manual',
  context_id text,
  subject text not null,
  body text not null,
  status text not null default 'queued',
  delivery_note text,
  scheduled_at timestamptz,
  queued_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  failed_at timestamptz,
  canceled_at timestamptz,
  provider text,
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.email_recipients (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.email_messages (id) on delete cascade,
  owner_user_id uuid references auth.users (id) on delete set null,
  email text not null,
  name text,
  recipient_type text not null default 'user',
  status text not null default 'queued',
  provider_recipient_id text,
  sent_at timestamptz,
  failed_at timestamptz,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.email_messages (id) on delete cascade,
  recipient_id uuid references public.email_recipients (id) on delete cascade,
  event_type text not null,
  event_source text not null default 'admin_mvp',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.email_templates
  drop constraint if exists email_templates_key_check;

alter table public.email_templates
  add constraint email_templates_key_check
  check (length(trim(key)) > 0);

alter table public.email_templates
  drop constraint if exists email_templates_category_check;

alter table public.email_templates
  add constraint email_templates_category_check
  check (category in ('manual', 'admission', 'payment', 'refund', 'system'));

alter table public.email_messages
  drop constraint if exists email_messages_audience_type_check;

alter table public.email_messages
  add constraint email_messages_audience_type_check
  check (audience_type in ('single_user', 'selected_users', 'stage_participants', 'manual'));

alter table public.email_messages
  drop constraint if exists email_messages_context_type_check;

alter table public.email_messages
  add constraint email_messages_context_type_check
  check (context_type in ('manual', 'admission', 'payment', 'refund', 'competition', 'stage'));

alter table public.email_messages
  drop constraint if exists email_messages_status_check;

alter table public.email_messages
  add constraint email_messages_status_check
  check (status in ('draft', 'queued', 'sending', 'sent', 'failed', 'canceled'));

alter table public.email_messages
  drop constraint if exists email_messages_subject_check;

alter table public.email_messages
  add constraint email_messages_subject_check
  check (length(trim(subject)) > 0);

alter table public.email_messages
  drop constraint if exists email_messages_body_check;

alter table public.email_messages
  add constraint email_messages_body_check
  check (length(trim(body)) > 0);

alter table public.email_recipients
  drop constraint if exists email_recipients_recipient_type_check;

alter table public.email_recipients
  add constraint email_recipients_recipient_type_check
  check (recipient_type in ('user', 'participant', 'manual'));

alter table public.email_recipients
  drop constraint if exists email_recipients_status_check;

alter table public.email_recipients
  add constraint email_recipients_status_check
  check (status in ('queued', 'sending', 'sent', 'failed', 'canceled'));

alter table public.email_recipients
  drop constraint if exists email_recipients_email_check;

alter table public.email_recipients
  add constraint email_recipients_email_check
  check (length(trim(email)) > 0);

alter table public.email_recipients
  drop constraint if exists email_recipients_message_email_unique;

alter table public.email_recipients
  add constraint email_recipients_message_email_unique
  unique (message_id, email);

alter table public.email_events
  drop constraint if exists email_events_event_type_check;

alter table public.email_events
  add constraint email_events_event_type_check
  check (event_type in ('created', 'queued', 'sending', 'sent', 'failed', 'canceled', 'provider_event'));

create or replace function public.touch_email_template_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists email_templates_touch_updated_at on public.email_templates;
create trigger email_templates_touch_updated_at
before update on public.email_templates
for each row execute procedure public.touch_email_template_updated_at();

create or replace function public.touch_email_message_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists email_messages_touch_updated_at on public.email_messages;
create trigger email_messages_touch_updated_at
before update on public.email_messages
for each row execute procedure public.touch_email_message_updated_at();

create or replace function public.touch_email_recipient_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists email_recipients_touch_updated_at on public.email_recipients;
create trigger email_recipients_touch_updated_at
before update on public.email_recipients
for each row execute procedure public.touch_email_recipient_updated_at();

create index if not exists email_templates_key_idx
  on public.email_templates (key);

create index if not exists email_templates_category_idx
  on public.email_templates (category);

create index if not exists email_templates_created_by_user_id_idx
  on public.email_templates (created_by_user_id);

create index if not exists email_messages_template_id_idx
  on public.email_messages (template_id);

create index if not exists email_messages_created_by_user_id_idx
  on public.email_messages (created_by_user_id);

create index if not exists email_messages_status_idx
  on public.email_messages (status);

create index if not exists email_messages_context_idx
  on public.email_messages (context_type, context_id);

create index if not exists email_messages_created_at_idx
  on public.email_messages (created_at desc);

create index if not exists email_recipients_message_id_idx
  on public.email_recipients (message_id);

create index if not exists email_recipients_owner_user_id_idx
  on public.email_recipients (owner_user_id);

create index if not exists email_recipients_status_idx
  on public.email_recipients (status);

create index if not exists email_events_message_id_idx
  on public.email_events (message_id);

create index if not exists email_events_recipient_id_idx
  on public.email_events (recipient_id);

alter table public.email_templates enable row level security;
alter table public.email_messages enable row level security;
alter table public.email_recipients enable row level security;
alter table public.email_events enable row level security;

drop policy if exists "Allow admin read email templates" on public.email_templates;
drop policy if exists "Allow admin manage email templates" on public.email_templates;

create policy "Allow admin read email templates"
on public.email_templates
for select
to authenticated
using (public.current_crm_role() = 'admin');

create policy "Allow admin manage email templates"
on public.email_templates
for all
to authenticated
using (public.current_crm_role() = 'admin')
with check (public.current_crm_role() = 'admin');

drop policy if exists "Allow admin read email messages" on public.email_messages;
drop policy if exists "Allow authenticated users to read own email messages" on public.email_messages;
drop policy if exists "Allow admin insert email messages" on public.email_messages;
drop policy if exists "Allow admin update email messages" on public.email_messages;
drop policy if exists "Allow admin delete email messages" on public.email_messages;

create policy "Allow admin read email messages"
on public.email_messages
for select
to authenticated
using (public.current_crm_role() = 'admin');

create policy "Allow authenticated users to read own email messages"
on public.email_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.email_recipients as recipient
    where recipient.message_id = email_messages.id
      and recipient.owner_user_id = auth.uid()
  )
);

create policy "Allow admin insert email messages"
on public.email_messages
for insert
to authenticated
with check (public.current_crm_role() = 'admin');

create policy "Allow admin update email messages"
on public.email_messages
for update
to authenticated
using (public.current_crm_role() = 'admin')
with check (public.current_crm_role() = 'admin');

create policy "Allow admin delete email messages"
on public.email_messages
for delete
to authenticated
using (public.current_crm_role() = 'admin');

drop policy if exists "Allow admin read email recipients" on public.email_recipients;
drop policy if exists "Allow authenticated users to read own email recipients" on public.email_recipients;
drop policy if exists "Allow admin insert email recipients" on public.email_recipients;
drop policy if exists "Allow admin update email recipients" on public.email_recipients;
drop policy if exists "Allow admin delete email recipients" on public.email_recipients;

create policy "Allow admin read email recipients"
on public.email_recipients
for select
to authenticated
using (public.current_crm_role() = 'admin');

create policy "Allow authenticated users to read own email recipients"
on public.email_recipients
for select
to authenticated
using (owner_user_id = auth.uid());

create policy "Allow admin insert email recipients"
on public.email_recipients
for insert
to authenticated
with check (public.current_crm_role() = 'admin');

create policy "Allow admin update email recipients"
on public.email_recipients
for update
to authenticated
using (public.current_crm_role() = 'admin')
with check (public.current_crm_role() = 'admin');

create policy "Allow admin delete email recipients"
on public.email_recipients
for delete
to authenticated
using (public.current_crm_role() = 'admin');

drop policy if exists "Allow admin read email events" on public.email_events;
drop policy if exists "Allow admin insert email events" on public.email_events;

create policy "Allow admin read email events"
on public.email_events
for select
to authenticated
using (public.current_crm_role() = 'admin');

create policy "Allow admin insert email events"
on public.email_events
for insert
to authenticated
with check (public.current_crm_role() = 'admin');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'email_templates'
  ) then
    alter publication supabase_realtime add table public.email_templates;
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
      and tablename = 'email_messages'
  ) then
    alter publication supabase_realtime add table public.email_messages;
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
      and tablename = 'email_recipients'
  ) then
    alter publication supabase_realtime add table public.email_recipients;
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
      and tablename = 'email_events'
  ) then
    alter publication supabase_realtime add table public.email_events;
  end if;
end;
$$;

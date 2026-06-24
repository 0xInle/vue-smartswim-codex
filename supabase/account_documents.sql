create table if not exists public.account_documents (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  owner_email text not null,
  owner_name text,
  owner_phone text,
  participant_kind text not null default 'owner',
  participant_id text not null default 'profile',
  participant_snapshot jsonb not null default '{}'::jsonb,
  scope text not null default 'profile',
  scope_id text not null default 'profile',
  document_type text not null,
  document_label text not null,
  document_hint text,
  status text not null default 'missing',
  file_name text,
  file_size bigint not null default 0,
  file_type text,
  file_url text,
  storage_path text,
  uploaded_at timestamptz,
  expires_at date,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_by_name text,
  rejection_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.account_documents
  add column if not exists owner_email text;

alter table public.account_documents
  add column if not exists owner_name text;

alter table public.account_documents
  add column if not exists owner_phone text;

alter table public.account_documents
  add column if not exists participant_snapshot jsonb not null default '{}'::jsonb;

alter table public.account_documents
  add column if not exists file_url text;

alter table public.account_documents
  add column if not exists storage_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'account-documents',
  'account-documents',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Allow users read own account document files" on storage.objects;
drop policy if exists "Allow users insert own account document files" on storage.objects;
drop policy if exists "Allow users update own account document files" on storage.objects;
drop policy if exists "Allow users delete own account document files" on storage.objects;
drop policy if exists "Allow admins read account document files" on storage.objects;
drop policy if exists "Allow admins delete account document files" on storage.objects;

create policy "Allow users read own account document files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'account-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Allow users insert own account document files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'account-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Allow users update own account document files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'account-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (
    not exists (
      select 1
      from public.account_documents as account_documents
      where account_documents.storage_path = storage.objects.name
        and account_documents.owner_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.account_documents as account_documents
      where account_documents.storage_path = storage.objects.name
        and account_documents.owner_user_id = auth.uid()
        and account_documents.status <> 'verified'
    )
  )
)
with check (
  bucket_id = 'account-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (
    not exists (
      select 1
      from public.account_documents as account_documents
      where account_documents.storage_path = storage.objects.name
        and account_documents.owner_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.account_documents as account_documents
      where account_documents.storage_path = storage.objects.name
        and account_documents.owner_user_id = auth.uid()
        and account_documents.status <> 'verified'
    )
  )
);

create policy "Allow users delete own account document files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'account-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (
    not exists (
      select 1
      from public.account_documents as account_documents
      where account_documents.storage_path = storage.objects.name
        and account_documents.owner_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.account_documents as account_documents
      where account_documents.storage_path = storage.objects.name
        and account_documents.owner_user_id = auth.uid()
        and account_documents.status <> 'verified'
    )
  )
);

create policy "Allow admins read account document files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'account-documents'
  and public.current_crm_role() = 'admin'
);

create policy "Allow admins delete account document files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'account-documents'
  and public.current_crm_role() = 'admin'
);

alter table public.account_documents
  drop constraint if exists account_documents_owner_email_check;

alter table public.account_documents
  add constraint account_documents_owner_email_check
  check (nullif(trim(owner_email), '') is not null);

alter table public.account_documents
  drop constraint if exists account_documents_participant_kind_check;

alter table public.account_documents
  add constraint account_documents_participant_kind_check
  check (participant_kind in ('owner', 'athlete', 'user'));

alter table public.account_documents
  drop constraint if exists account_documents_scope_check;

alter table public.account_documents
  add constraint account_documents_scope_check
  check (scope in ('profile', 'athlete', 'user'));

alter table public.account_documents
  drop constraint if exists account_documents_document_type_check;

alter table public.account_documents
  add constraint account_documents_document_type_check
  check (
    document_type in (
      'passport_front',
      'passport_back',
      'medical_certificate',
      'personal_data_consent',
      'accident_insurance'
    )
  );

alter table public.account_documents
  drop constraint if exists account_documents_status_check;

alter table public.account_documents
  add constraint account_documents_status_check
  check (
    status in (
      'missing',
      'uploaded',
      'verified',
      'rejected',
      'needs_reupload'
    )
  );

alter table public.account_documents
  drop constraint if exists account_documents_file_size_check;

alter table public.account_documents
  add constraint account_documents_file_size_check
  check (file_size >= 0);

create unique index if not exists account_documents_owner_scope_type_unique_idx
  on public.account_documents (owner_user_id, scope, scope_id, document_type);

create table if not exists public.account_document_events (
  id bigint generated by default as identity primary key,
  document_id uuid not null references public.account_documents (id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_id uuid references auth.users (id) on delete set null,
  actor_role text,
  actor_name text,
  public_comment text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.account_document_events
  drop constraint if exists account_document_events_to_status_check;

alter table public.account_document_events
  add constraint account_document_events_to_status_check
  check (
    to_status in (
      'missing',
      'uploaded',
      'verified',
      'rejected',
      'needs_reupload'
    )
  );

alter table public.account_document_events
  drop constraint if exists account_document_events_from_status_check;

alter table public.account_document_events
  add constraint account_document_events_from_status_check
  check (
    from_status is null
    or from_status in (
      'missing',
      'uploaded',
      'verified',
      'rejected',
      'needs_reupload'
    )
  );

create or replace function public.touch_account_document_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists account_documents_touch_updated_at on public.account_documents;
create trigger account_documents_touch_updated_at
before update on public.account_documents
for each row execute procedure public.touch_account_document_updated_at();

create or replace function public.log_account_document_status_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.account_document_events (
      document_id,
      from_status,
      to_status,
      actor_id,
      actor_role,
      actor_name,
      public_comment,
      created_at
    )
    values (
      new.id,
      case when tg_op = 'INSERT' then null else old.status end,
      new.status,
      auth.uid(),
      public.current_crm_role(),
      coalesce(new.reviewed_by_name, new.owner_name, ''),
      nullif(trim(coalesce(new.rejection_reason, '')), ''),
      timezone('utc', now())
    );
  end if;

  return new;
end;
$$;

drop trigger if exists account_documents_log_status_event on public.account_documents;
create trigger account_documents_log_status_event
after insert or update on public.account_documents
for each row execute procedure public.log_account_document_status_event();

revoke execute on function public.log_account_document_status_event() from public, anon, authenticated;

create index if not exists account_documents_owner_user_id_idx
  on public.account_documents (owner_user_id);

create index if not exists account_documents_reviewed_by_idx
  on public.account_documents (reviewed_by);

create index if not exists account_documents_scope_idx
  on public.account_documents (scope, scope_id);

create index if not exists account_documents_status_idx
  on public.account_documents (status);

create index if not exists account_documents_document_type_idx
  on public.account_documents (document_type);

create index if not exists account_documents_updated_at_idx
  on public.account_documents (updated_at desc);

create index if not exists account_documents_storage_path_idx
  on public.account_documents (storage_path)
  where storage_path is not null;

create index if not exists account_documents_created_at_idx
  on public.account_documents (created_at desc);

create index if not exists account_document_events_document_id_idx
  on public.account_document_events (document_id, created_at desc);

create index if not exists account_document_events_actor_id_idx
  on public.account_document_events (actor_id);

alter table public.account_documents enable row level security;
alter table public.account_document_events enable row level security;

drop policy if exists "Allow authenticated users to insert own account documents" on public.account_documents;
drop policy if exists "Allow authenticated users to read own account documents" on public.account_documents;
drop policy if exists "Allow authenticated users to update own account documents" on public.account_documents;
drop policy if exists "Allow admin read account documents" on public.account_documents;
drop policy if exists "Allow admin update account documents" on public.account_documents;
drop policy if exists "Allow admin delete account documents" on public.account_documents;

create policy "Allow authenticated users to insert own account documents"
on public.account_documents
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and nullif(trim(owner_email), '') is not null
  and participant_kind in ('owner', 'athlete', 'user')
  and scope in ('profile', 'athlete', 'user')
  and status in ('missing', 'uploaded')
  and reviewed_at is null
  and reviewed_by is null
  and nullif(trim(coalesce(reviewed_by_name, '')), '') is null
  and nullif(trim(coalesce(rejection_reason, '')), '') is null
);

create policy "Allow authenticated users to read own account documents"
on public.account_documents
for select
to authenticated
using (
  owner_user_id = auth.uid()
  or public.current_crm_role() = 'admin'
);

create policy "Allow authenticated users to update own account documents"
on public.account_documents
for update
to authenticated
using (owner_user_id = auth.uid())
with check (
  owner_user_id = auth.uid()
  and status in ('missing', 'uploaded')
  and reviewed_at is null
  and reviewed_by is null
  and nullif(trim(coalesce(reviewed_by_name, '')), '') is null
  and nullif(trim(coalesce(rejection_reason, '')), '') is null
);

create policy "Allow admin read account documents"
on public.account_documents
for select
to authenticated
using (public.current_crm_role() = 'admin');

create policy "Allow admin update account documents"
on public.account_documents
for update
to authenticated
using (public.current_crm_role() = 'admin')
with check (public.current_crm_role() = 'admin');

create policy "Allow admin delete account documents"
on public.account_documents
for delete
to authenticated
using (public.current_crm_role() = 'admin');

drop policy if exists "Allow authenticated users to read own account document events" on public.account_document_events;
drop policy if exists "Allow admin read account document events" on public.account_document_events;

create policy "Allow authenticated users to read own account document events"
on public.account_document_events
for select
to authenticated
using (
  exists (
    select 1
    from public.account_documents as account_documents
    where account_documents.id = account_document_events.document_id
      and account_documents.owner_user_id = auth.uid()
  )
  or public.current_crm_role() = 'admin'
);

create policy "Allow admin read account document events"
on public.account_document_events
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
      and tablename = 'account_documents'
  ) then
    alter publication supabase_realtime add table public.account_documents;
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
      and tablename = 'account_document_events'
  ) then
    alter publication supabase_realtime add table public.account_document_events;
  end if;
end;
$$;

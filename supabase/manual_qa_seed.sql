-- Manual QA seed for Smart Swim account/admin/trainer flows.
-- Safe to re-run: records use stable identifiers or dedupe keys.

update public.competition_stages
set
  registration_status = 'open',
  registration_open_at = timezone('Europe/Moscow', now()) - interval '1 day',
  registration_close_at = timezone('Europe/Moscow', now()) + interval '14 days',
  registration_open_date_label = to_char((timezone('Europe/Moscow', now()) - interval '1 day')::date, 'DD.MM.YYYY'),
  registration_close_date_label = to_char((timezone('Europe/Moscow', now()) + interval '14 days')::date, 'DD.MM.YYYY'),
  registration_close_note = 'QA: регистрация открыта для ручной проверки.',
  registration_closed_title = '',
  registration_closed_text = '',
  registration_limit = 50
where id in ('smartswimcup-stage-6', 'smartiki-stage-6');

insert into private.trainers (email, name, note)
values (
  'ss-biryukoff@yandex.ru',
  'Тестовый тренер',
  'QA trainer account for manual trainer booking checks'
)
on conflict (email) do update
set
  name = excluded.name,
  note = excluded.note;

update public.crm_users
set
  role = 'trainer',
  name = 'Тестовый тренер'
where lower(email) = 'ss-biryukoff@yandex.ru';

with trainer_account as (
  select id, email, coalesce(nullif(trim(name), ''), 'Тестовый тренер') as name
  from public.crm_users
  where lower(email) = 'ss-biryukoff@yandex.ru'
  limit 1
), seed_bookings as (
  select *
  from (
    values
      (
        'qa-smartswim-trainer-booking-1',
        'QA Клиент',
        'Первый',
        '+7 (961) 471-33-80',
        'qa-client-1@example.com',
        current_date + interval '3 days',
        '10:00'::time,
        'QA: новая заявка для проверки кабинета тренера.',
        'new'
      ),
      (
        'qa-smartswim-trainer-booking-2',
        'QA Клиент',
        'Второй',
        '+49 151 234 567 89',
        'qa-client-2@example.com',
        current_date + interval '5 days',
        '12:30'::time,
        'QA: заявка в работе для проверки статусов тренера.',
        'in_work'
      )
  ) as booking(
    marker,
    first_name,
    last_name,
    phone,
    email,
    preferred_date,
    preferred_time,
    comment,
    status
  )
)
insert into public.trainer_bookings (
  trainer_id,
  trainer_name,
  client_user_id,
  client_first_name,
  client_last_name,
  client_phone,
  client_email,
  preferred_date,
  preferred_time,
  training_format,
  comment,
  status
)
select
  'sergey-biryukov',
  trainer_account.name,
  null,
  seed_bookings.first_name,
  seed_bookings.last_name,
  seed_bookings.phone,
  seed_bookings.email,
  seed_bookings.preferred_date::date,
  seed_bookings.preferred_time,
  'individual',
  seed_bookings.comment,
  seed_bookings.status
from trainer_account
cross join seed_bookings
where not exists (
  select 1
  from public.trainer_bookings as existing
  where existing.trainer_id = 'sergey-biryukov'
    and existing.client_email = seed_bookings.email
    and existing.comment = seed_bookings.comment
);

update public.trainer_bookings
set
  trainer_name = 'Тестовый тренер',
  status = case
    when client_email = 'qa-client-1@example.com' then 'new'
    when client_email = 'qa-client-2@example.com' then 'in_work'
    else status
  end
where trainer_id = 'sergey-biryukov'
  and client_email in ('qa-client-1@example.com', 'qa-client-2@example.com')
  and comment like 'QA:%';

with qa_owner as (
  select id, email, coalesce(nullif(trim(name), ''), 'QA пользователь') as name
  from public.crm_users
  where lower(email) = 'ss-biryukoff@yandex.ru'
  limit 1
), seed_athletes as (
  select *
  from (
    values
      (
        'qa-athlete-application-1',
        'Александра',
        'Киселева',
        'qa-athlete-1@example.com',
        '+7 (901) 100-01-01',
        '2011-02-14'::date,
        'QA Swim Club',
        'qa-athlete-1',
        'new',
        'QA: новая заявка спортсмена для проверки таблицы.'
      ),
      (
        'qa-athlete-application-2',
        'Игорь',
        'Лебедев',
        'qa-athlete-2@example.com',
        '+7 (901) 100-01-02',
        '2010-06-03'::date,
        'QA Swim Club',
        'qa-athlete-2',
        'processed',
        'QA: заявка в работе для проверки таблицы.'
      ),
      (
        'qa-athlete-application-3',
        'Мария',
        'Громова',
        'qa-athlete-3@example.com',
        '+7 (901) 100-01-03',
        '2012-11-19'::date,
        'QA Swim Club',
        'qa-athlete-3',
        'call_back',
        'QA: нужно перезвонить по спортсмену.'
      ),
      (
        'qa-athlete-application-4',
        'Денис',
        'Мартынов',
        'qa-athlete-4@example.com',
        '+7 (901) 100-01-04',
        '2009-08-27'::date,
        'QA Swim Club',
        'qa-athlete-4',
        'scheduled',
        'QA: заявка запланирована для дальнейшей обработки.'
      ),
      (
        'qa-athlete-application-5',
        'Екатерина',
        'Павлова',
        'qa-athlete-5@example.com',
        '+7 (901) 100-01-05',
        '2011-04-08'::date,
        'QA Swim Club',
        'qa-athlete-5',
        'ready',
        'QA: спортсмен готов к финальному решению.'
      ),
      (
        'qa-athlete-application-6',
        'Никита',
        'Соколов',
        'qa-athlete-6@example.com',
        '+7 (901) 100-01-06',
        '2010-01-25'::date,
        'QA Swim Club',
        'qa-athlete-6',
        'admitted',
        'QA: спортсмен допущен для проверки завершенного статуса.'
      )
  ) as athlete(
    application_id,
    first_name,
    last_name,
    email,
    phone,
    birth_date,
    club,
    scope_id,
    status,
    note
  )
)
insert into public.account_athlete_applications (
  id,
  owner_user_id,
  owner_email,
  owner_name,
  owner_phone,
  scope,
  scope_id,
  participant_name,
  participant_birth_date,
  participant_club,
  participant_kind,
  status,
  note,
  updated_by
)
select
  seed_athletes.application_id,
  qa_owner.id,
  seed_athletes.email,
  concat(seed_athletes.last_name, ' ', seed_athletes.first_name),
  seed_athletes.phone,
  'athlete',
  seed_athletes.scope_id,
  concat(seed_athletes.last_name, ' ', seed_athletes.first_name),
  seed_athletes.birth_date,
  seed_athletes.club,
  'athlete',
  seed_athletes.status,
  seed_athletes.note,
  'QA seed'
from qa_owner
cross join seed_athletes
on conflict (id) do update
set
  owner_user_id = excluded.owner_user_id,
  owner_email = excluded.owner_email,
  owner_name = excluded.owner_name,
  owner_phone = excluded.owner_phone,
  scope = excluded.scope,
  scope_id = excluded.scope_id,
  participant_name = excluded.participant_name,
  participant_birth_date = excluded.participant_birth_date,
  participant_club = excluded.participant_club,
  participant_kind = excluded.participant_kind,
  status = excluded.status,
  note = excluded.note,
  updated_by = excluded.updated_by;

with qa_owner as (
  select id, email, coalesce(nullif(trim(name), ''), 'QA пользователь') as name
  from public.crm_users
  where lower(email) = 'ss-biryukoff@yandex.ru'
  limit 1
), seed_athletes as (
  select *
  from (
    values
      (
        '30000000-0000-4000-8000-000000000101'::uuid,
        'Александра',
        'Киселева',
        'qa-athlete-1@example.com',
        '+7 (901) 100-01-01',
        '2011-02-14'::date,
        'QA Swim Club',
        'qa-athlete-1',
        'uploaded'
      ),
      (
        '30000000-0000-4000-8000-000000000102'::uuid,
        'Игорь',
        'Лебедев',
        'qa-athlete-2@example.com',
        '+7 (901) 100-01-02',
        '2010-06-03'::date,
        'QA Swim Club',
        'qa-athlete-2',
        'uploaded'
      ),
      (
        '30000000-0000-4000-8000-000000000103'::uuid,
        'Мария',
        'Громова',
        'qa-athlete-3@example.com',
        '+7 (901) 100-01-03',
        '2012-11-19'::date,
        'QA Swim Club',
        'qa-athlete-3',
        'uploaded'
      ),
      (
        '30000000-0000-4000-8000-000000000104'::uuid,
        'Денис',
        'Мартынов',
        'qa-athlete-4@example.com',
        '+7 (901) 100-01-04',
        '2009-08-27'::date,
        'QA Swim Club',
        'qa-athlete-4',
        'uploaded'
      ),
      (
        '30000000-0000-4000-8000-000000000105'::uuid,
        'Екатерина',
        'Павлова',
        'qa-athlete-5@example.com',
        '+7 (901) 100-01-05',
        '2011-04-08'::date,
        'QA Swim Club',
        'qa-athlete-5',
        'uploaded'
      ),
      (
        '30000000-0000-4000-8000-000000000106'::uuid,
        'Никита',
        'Соколов',
        'qa-athlete-6@example.com',
        '+7 (901) 100-01-06',
        '2010-01-25'::date,
        'QA Swim Club',
        'qa-athlete-6',
        'uploaded'
      )
  ) as athlete(
    document_id,
    first_name,
    last_name,
    email,
    phone,
    birth_date,
    club,
    scope_id,
    status
  )
)
insert into public.account_documents (
  id,
  owner_user_id,
  owner_email,
  owner_name,
  owner_phone,
  participant_kind,
  participant_id,
  participant_snapshot,
  scope,
  scope_id,
  document_type,
  document_label,
  document_hint,
  status,
  file_name,
  file_size,
  file_type,
  file_url,
  storage_path,
  uploaded_at,
  reviewed_at,
  reviewed_by,
  reviewed_by_name,
  rejection_reason
)
select
  seed_athletes.document_id,
  qa_owner.id,
  seed_athletes.email,
  concat(seed_athletes.last_name, ' ', seed_athletes.first_name),
  seed_athletes.phone,
  'athlete',
  seed_athletes.scope_id,
  jsonb_build_object(
    'name', concat(seed_athletes.last_name, ' ', seed_athletes.first_name),
    'birthDate', to_char(seed_athletes.birth_date, 'DD.MM.YYYY'),
    'club', seed_athletes.club,
    'kind', 'athlete'
  ),
  'athlete',
  seed_athletes.scope_id,
  'medical_certificate',
  'Медицинская справка',
  'QA: тестовый документ спортсмена.',
  seed_athletes.status,
  'qa-medical-certificate.pdf',
  18432,
  'application/pdf',
  null,
  null,
  case when seed_athletes.status = 'uploaded' then timezone('utc', now()) - interval '1 day' else timezone('utc', now()) end,
  null,
  null,
  null,
  null
from qa_owner
cross join seed_athletes
on conflict (id) do update
set
  owner_user_id = excluded.owner_user_id,
  owner_email = excluded.owner_email,
  owner_name = excluded.owner_name,
  owner_phone = excluded.owner_phone,
  participant_kind = excluded.participant_kind,
  participant_id = excluded.participant_id,
  participant_snapshot = excluded.participant_snapshot,
  scope = excluded.scope,
  scope_id = excluded.scope_id,
  document_type = excluded.document_type,
  document_label = excluded.document_label,
  document_hint = excluded.document_hint,
  status = excluded.status,
  file_name = excluded.file_name,
  file_size = excluded.file_size,
  file_type = excluded.file_type,
  file_url = excluded.file_url,
  storage_path = excluded.storage_path,
  uploaded_at = excluded.uploaded_at,
  reviewed_at = excluded.reviewed_at,
  reviewed_by = excluded.reviewed_by,
  reviewed_by_name = excluded.reviewed_by_name,
  rejection_reason = excluded.rejection_reason;

delete from public.competition_refunds
where application_id in (
  '10000000-0000-4000-8000-000000000101'::uuid,
  '10000000-0000-4000-8000-000000000102'::uuid
);

delete from public.competition_payments
where application_id in (
  '10000000-0000-4000-8000-000000000101'::uuid,
  '10000000-0000-4000-8000-000000000102'::uuid
);

delete from public.competition_applications
where id in (
  '10000000-0000-4000-8000-000000000101'::uuid,
  '10000000-0000-4000-8000-000000000102'::uuid
);

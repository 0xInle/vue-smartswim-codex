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

insert into public.trainers (email, name, note)
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
), applications as (
  select *
  from (
    values
      (
        '10000000-0000-4000-8000-000000000101'::uuid,
        'approved',
        'pending',
        'QA pending YooKassa MVP payment'
      ),
      (
        '10000000-0000-4000-8000-000000000102'::uuid,
        'paid',
        'paid',
        'QA paid YooKassa MVP payment with refund request'
      )
  ) as application(id, status, payment_status, comment)
)
insert into public.competition_applications (
  id,
  owner_user_id,
  owner_email,
  owner_name,
  owner_phone,
  participant_kind,
  participant_id,
  participant_snapshot,
  competition_slug,
  competition_name,
  stage_id,
  stage_label,
  competition_date_label,
  competition_window_label,
  registration_kind,
  payment_option_id,
  payment_option_title,
  comment,
  status,
  admission_status,
  payment_status,
  status_changed_by
)
select
  applications.id,
  qa_owner.id,
  qa_owner.email,
  qa_owner.name,
  '+7 (961) 471-33-80',
  'owner',
  'profile',
  jsonb_build_object(
    'name', qa_owner.name,
    'birthDate', '01.01.2010',
    'club', 'QA Smart Swim',
    'phone', '+7 (961) 471-33-80',
    'email', qa_owner.email
  ),
  'smartswimcup',
  'SmartSwimCup',
  'smartswimcup-stage-6',
  'Этап VI',
  '27 сентября 2026',
  'QA: регистрация открыта',
  'individual',
  'distances-1-2',
  'Регистрация участника на 1-2 дистанции',
  applications.comment,
  applications.status,
  'ready',
  applications.payment_status,
  'QA seed'
from qa_owner
cross join applications
on conflict (id) do update
set
  owner_email = excluded.owner_email,
  owner_name = excluded.owner_name,
  owner_phone = excluded.owner_phone,
  participant_snapshot = excluded.participant_snapshot,
  stage_id = excluded.stage_id,
  stage_label = excluded.stage_label,
  competition_window_label = excluded.competition_window_label,
  comment = excluded.comment,
  status = excluded.status,
  admission_status = excluded.admission_status,
  payment_status = excluded.payment_status,
  status_changed_by = excluded.status_changed_by;

with qa_owner as (
  select id
  from public.crm_users
  where lower(email) = 'ss-biryukoff@yandex.ru'
  limit 1
)
insert into public.competition_payments (
  id,
  application_id,
  owner_user_id,
  provider,
  provider_status,
  status,
  amount_value,
  amount_currency,
  description,
  confirmation_url,
  idempotence_key,
  metadata,
  created_by_role
)
select
  payment.id,
  payment.application_id,
  qa_owner.id,
  'yookassa',
  payment.provider_status,
  payment.status,
  2000,
  'RUB',
  payment.description,
  '',
  payment.idempotence_key,
  jsonb_build_object('qaSeed', true, 'providerConnected', false),
  'system'
from qa_owner
cross join (
  values
    (
      '20000000-0000-4000-8000-000000000101'::uuid,
      '10000000-0000-4000-8000-000000000101'::uuid,
      'pending',
      'provider_unavailable',
      'QA: pending payment, YooKassa provider is not connected',
      'qa-yookassa-pending-101'
    ),
    (
      '20000000-0000-4000-8000-000000000102'::uuid,
      '10000000-0000-4000-8000-000000000102'::uuid,
      'succeeded',
      'succeeded',
      'QA: paid payment for refund flow',
      'qa-yookassa-paid-102'
    )
) as payment(id, application_id, provider_status, status, description, idempotence_key)
where exists (
  select 1
  from public.competition_applications as application
  where application.id = payment.application_id
)
on conflict (id) do update
set
  owner_user_id = excluded.owner_user_id,
  provider_status = excluded.provider_status,
  status = excluded.status,
  amount_value = excluded.amount_value,
  description = excluded.description,
  metadata = excluded.metadata,
  created_by_role = excluded.created_by_role;

with qa_owner as (
  select id
  from public.crm_users
  where lower(email) = 'ss-biryukoff@yandex.ru'
  limit 1
)
insert into public.competition_refunds (
  id,
  payment_id,
  application_id,
  owner_user_id,
  provider,
  provider_status,
  status,
  amount_value,
  amount_currency,
  reason,
  metadata
)
select
  '30000000-0000-4000-8000-000000000102'::uuid,
  '20000000-0000-4000-8000-000000000102'::uuid,
  '10000000-0000-4000-8000-000000000102'::uuid,
  qa_owner.id,
  'yookassa',
  'provider_not_connected',
  'requested',
  2000,
  'RUB',
  'QA: запрос возврата для ручной проверки админки.',
  jsonb_build_object('qaSeed', true, 'providerConnected', false)
from qa_owner
where exists (
  select 1
  from public.competition_payments as payment
  where payment.id = '20000000-0000-4000-8000-000000000102'::uuid
)
on conflict (id) do update
set
  owner_user_id = excluded.owner_user_id,
  provider_status = excluded.provider_status,
  status = excluded.status,
  reason = excluded.reason,
  metadata = excluded.metadata;

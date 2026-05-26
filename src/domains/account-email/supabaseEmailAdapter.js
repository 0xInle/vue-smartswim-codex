import {
  dedupeEmailRecipients,
  mapEmailMessageInsertPayload,
  mapEmailRecipientInsertPayload,
  mapSupabaseEmailMessageRow,
} from './emailMappers'
import { getCurrentSession } from '@/utils/supabaseAuth'
import { getSupabaseClient } from '@/utils/supabaseClient'
import { getUserFacingErrorMessage } from '@/utils/userFacingErrors'

const EMAIL_MESSAGES_TABLE = 'email_messages'
const EMAIL_RECIPIENTS_TABLE = 'email_recipients'
const EMAIL_EVENTS_TABLE = 'email_events'
const ACCOUNT_EMAIL_SQL_PATH = 'supabase/account_email.sql'
let accountEmailSubscriptionId = 0

const EMAIL_MESSAGE_SELECT = [
  'id',
  'template_id',
  'created_by_user_id',
  'created_by_email',
  'created_by_name',
  'audience_type',
  'context_type',
  'context_id',
  'subject',
  'body',
  'status',
  'delivery_note',
  'scheduled_at',
  'queued_at',
  'sent_at',
  'failed_at',
  'canceled_at',
  'provider',
  'provider_message_id',
  'error_message',
  'created_at',
  'updated_at',
  'email_recipients(' +
    [
      'id',
      'message_id',
      'owner_user_id',
      'email',
      'name',
      'recipient_type',
      'status',
      'sent_at',
      'failed_at',
      'error_message',
      'created_at',
      'updated_at',
    ].join(',') +
    ')',
].join(',')

function toMissingAccountEmailTableError(tableName) {
  return `Email-инфраструктура недоступна: таблица ${tableName} не найдена. Выполните SQL из файла ${ACCOUNT_EMAIL_SQL_PATH} в Supabase SQL Editor.`
}

function isMissingAccountEmailTableError(error, tableName) {
  if (!error) {
    return false
  }

  return (
    error.code === '42P01' ||
    new RegExp(`relation .*${tableName}.* does not exist`, 'i').test(error.message || '') ||
    new RegExp(`table .*${tableName}.* not found`, 'i').test(error.message || '')
  )
}

function throwAccountEmailError(error, tableName, fallback) {
  if (isMissingAccountEmailTableError(error, tableName)) {
    throw new Error(toMissingAccountEmailTableError(tableName))
  }

  throw new Error(getUserFacingErrorMessage(error, fallback))
}

async function requireCurrentSession(message) {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error(message)
  }

  return session
}

export async function fetchEmailMessagesForAdmin() {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { data, error } = await getSupabaseClient()
    .from(EMAIL_MESSAGES_TABLE)
    .select(EMAIL_MESSAGE_SELECT)
    .order('created_at', { ascending: false })
    .limit(80)

  if (error) {
    throwAccountEmailError(error, EMAIL_MESSAGES_TABLE, 'Не удалось загрузить журнал писем.')
  }

  return (data ?? []).map(mapSupabaseEmailMessageRow)
}

export async function insertQueuedEmailMessageForAdmin(message = {}) {
  const session = await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')
  const recipients = dedupeEmailRecipients(message.recipients || [])

  if (!recipients.length) {
    throw new Error('Выберите хотя бы одного получателя с корректной почтой.')
  }

  const client = getSupabaseClient()
  const messagePayload = mapEmailMessageInsertPayload(message, session.user)
  const { data: insertedMessage, error: messageError } = await client
    .from(EMAIL_MESSAGES_TABLE)
    .insert(messagePayload)
    .select('id')
    .single()

  if (messageError) {
    throwAccountEmailError(messageError, EMAIL_MESSAGES_TABLE, 'Не удалось создать письмо.')
  }

  const recipientPayload = recipients.map((recipient) =>
    mapEmailRecipientInsertPayload(recipient, insertedMessage.id),
  )
  const { error: recipientsError } = await client
    .from(EMAIL_RECIPIENTS_TABLE)
    .insert(recipientPayload)

  if (recipientsError) {
    throwAccountEmailError(recipientsError, EMAIL_RECIPIENTS_TABLE, 'Не удалось сохранить получателей.')
  }

  const { error: eventError } = await client
    .from(EMAIL_EVENTS_TABLE)
    .insert({
      message_id: insertedMessage.id,
      event_type: 'queued',
      event_source: 'admin_mvp',
      payload: {
        audienceType: message.audienceType || 'selected_users',
        recipientCount: recipients.length,
      },
    })

  if (eventError) {
    throwAccountEmailError(eventError, EMAIL_EVENTS_TABLE, 'Не удалось записать событие письма.')
  }

  const { data: fullMessage, error: fullMessageError } = await client
    .from(EMAIL_MESSAGES_TABLE)
    .select(EMAIL_MESSAGE_SELECT)
    .eq('id', insertedMessage.id)
    .single()

  if (fullMessageError) {
    throwAccountEmailError(fullMessageError, EMAIL_MESSAGES_TABLE, 'Не удалось загрузить созданное письмо.')
  }

  return mapSupabaseEmailMessageRow(fullMessage)
}

export function subscribeToEmailChanges(callback) {
  const client = getSupabaseClient()
  accountEmailSubscriptionId += 1

  const channel = client
    .channel(`account-email-feed-${accountEmailSubscriptionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: EMAIL_MESSAGES_TABLE,
      },
      callback,
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: EMAIL_RECIPIENTS_TABLE,
      },
      callback,
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

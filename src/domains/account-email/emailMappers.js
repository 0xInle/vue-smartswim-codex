import {
  EMAIL_AUDIENCE_TYPE,
  EMAIL_MESSAGE_STATUS,
  EMAIL_RECIPIENT_STATUS,
} from './emailLifecycle'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmailRecipient(recipient = {}) {
  return {
    id: recipient.id || '',
    messageId: recipient.messageId || '',
    ownerUserId: recipient.ownerUserId || '',
    email: String(recipient.email || '').trim().toLowerCase(),
    name: String(recipient.name || '').trim(),
    recipientType: recipient.recipientType || 'user',
    status: recipient.status || EMAIL_RECIPIENT_STATUS.QUEUED,
    sentAt: recipient.sentAt || '',
    failedAt: recipient.failedAt || '',
    errorMessage: recipient.errorMessage || '',
    createdAt: recipient.createdAt || '',
    updatedAt: recipient.updatedAt || '',
  }
}

export function dedupeEmailRecipients(recipients = []) {
  const seen = new Set()

  return recipients
    .map(normalizeEmailRecipient)
    .filter((recipient) => {
      if (!recipient.email || !EMAIL_RE.test(recipient.email) || seen.has(recipient.email)) {
        return false
      }

      seen.add(recipient.email)
      return true
    })
}

export function mapSupabaseEmailRecipientRow(row = {}) {
  return normalizeEmailRecipient({
    id: row.id,
    messageId: row.message_id,
    ownerUserId: row.owner_user_id,
    email: row.email,
    name: row.name,
    recipientType: row.recipient_type,
    status: row.status,
    sentAt: row.sent_at,
    failedAt: row.failed_at,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

export function mapEmailRecipientInsertPayload(recipient = {}, messageId = '') {
  const normalizedRecipient = normalizeEmailRecipient(recipient)

  return {
    message_id: messageId,
    owner_user_id: normalizedRecipient.ownerUserId || null,
    email: normalizedRecipient.email,
    name: normalizedRecipient.name || null,
    recipient_type: normalizedRecipient.recipientType || 'user',
    status: EMAIL_RECIPIENT_STATUS.QUEUED,
  }
}

export function mapSupabaseEmailMessageRow(row = {}) {
  const recipients = Array.isArray(row.email_recipients)
    ? row.email_recipients.map(mapSupabaseEmailRecipientRow)
    : []

  return {
    id: row.id || '',
    templateId: row.template_id || '',
    createdByUserId: row.created_by_user_id || '',
    createdByEmail: row.created_by_email || '',
    createdByName: row.created_by_name || '',
    audienceType: row.audience_type || EMAIL_AUDIENCE_TYPE.SELECTED_USERS,
    contextType: row.context_type || 'manual',
    contextId: row.context_id || '',
    subject: row.subject || '',
    body: row.body || '',
    status: row.status || EMAIL_MESSAGE_STATUS.QUEUED,
    deliveryNote: row.delivery_note || '',
    scheduledAt: row.scheduled_at || '',
    queuedAt: row.queued_at || '',
    sentAt: row.sent_at || '',
    failedAt: row.failed_at || '',
    canceledAt: row.canceled_at || '',
    provider: row.provider || '',
    providerMessageId: row.provider_message_id || '',
    errorMessage: row.error_message || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    recipients,
    recipientCount: recipients.length,
  }
}

export function mapEmailMessageInsertPayload(message = {}, sessionUser = {}) {
  return {
    template_id: message.templateId || null,
    created_by_user_id: sessionUser.id || null,
    created_by_email: sessionUser.email || null,
    created_by_name: message.createdByName || null,
    audience_type: message.audienceType || EMAIL_AUDIENCE_TYPE.SELECTED_USERS,
    context_type: message.contextType || 'manual',
    context_id: message.contextId || null,
    subject: String(message.subject || '').trim(),
    body: String(message.body || '').trim(),
    status: EMAIL_MESSAGE_STATUS.QUEUED,
    delivery_note:
      message.deliveryNote ||
      'MVP: письмо поставлено в очередь. Production-отправка будет доступна после подключения email-провайдера.',
    queued_at: new Date().toISOString(),
  }
}

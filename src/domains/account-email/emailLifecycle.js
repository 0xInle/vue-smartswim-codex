export const EMAIL_MESSAGE_STATUS = Object.freeze({
  DRAFT: 'draft',
  QUEUED: 'queued',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
  CANCELED: 'canceled',
})

export const EMAIL_RECIPIENT_STATUS = Object.freeze({
  QUEUED: 'queued',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
  CANCELED: 'canceled',
})

export const EMAIL_AUDIENCE_TYPE = Object.freeze({
  SINGLE_USER: 'single_user',
  SELECTED_USERS: 'selected_users',
  STAGE_PARTICIPANTS: 'stage_participants',
  MANUAL: 'manual',
})

const EMAIL_STATUS_LABELS = {
  [EMAIL_MESSAGE_STATUS.DRAFT]: 'Черновик',
  [EMAIL_MESSAGE_STATUS.QUEUED]: 'В очереди',
  [EMAIL_MESSAGE_STATUS.SENDING]: 'Отправляется',
  [EMAIL_MESSAGE_STATUS.SENT]: 'Отправлено',
  [EMAIL_MESSAGE_STATUS.FAILED]: 'Ошибка',
  [EMAIL_MESSAGE_STATUS.CANCELED]: 'Отменено',
}

const EMAIL_STATUS_TAG_TYPES = {
  [EMAIL_MESSAGE_STATUS.DRAFT]: 'info',
  [EMAIL_MESSAGE_STATUS.QUEUED]: 'warning',
  [EMAIL_MESSAGE_STATUS.SENDING]: 'primary',
  [EMAIL_MESSAGE_STATUS.SENT]: 'success',
  [EMAIL_MESSAGE_STATUS.FAILED]: 'danger',
  [EMAIL_MESSAGE_STATUS.CANCELED]: 'info',
}

const EMAIL_AUDIENCE_LABELS = {
  [EMAIL_AUDIENCE_TYPE.SINGLE_USER]: 'Один пользователь',
  [EMAIL_AUDIENCE_TYPE.SELECTED_USERS]: 'Выбранные пользователи',
  [EMAIL_AUDIENCE_TYPE.STAGE_PARTICIPANTS]: 'Участники этапа',
  [EMAIL_AUDIENCE_TYPE.MANUAL]: 'Ручной список',
}

export function formatEmailStatus(status) {
  return EMAIL_STATUS_LABELS[status] || EMAIL_STATUS_LABELS[EMAIL_MESSAGE_STATUS.QUEUED]
}

export function getEmailStatusTagType(status) {
  return EMAIL_STATUS_TAG_TYPES[status] || EMAIL_STATUS_TAG_TYPES[EMAIL_MESSAGE_STATUS.QUEUED]
}

export function formatEmailAudienceType(audienceType) {
  return EMAIL_AUDIENCE_LABELS[audienceType] || EMAIL_AUDIENCE_LABELS[EMAIL_AUDIENCE_TYPE.SELECTED_USERS]
}

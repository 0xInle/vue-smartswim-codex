import { getCrmRoleLabel } from '@/utils/crmRoles'
import {
  ACCOUNT_DOCUMENT_STATUS,
  getAccountDocumentStatusMeta,
} from '@/pages/account/utils/accountDocumentTypes'
import {
  formatCompetitionDateInputValue,
  formatCompetitionDateLabel,
  formatCompetitionDateShortLabel,
  resolveCompetitionRegistrationState,
} from '@/utils/competitionRegistration'
import { CONSULTATION_STATUS, TRAINER_BOOKING_STATUS } from '@/pages/account/utils/accountConstants'
import { COMPETITION_REGISTRATION_RECORD_STATUS } from '@/pages/account/utils/accountConstants'

export function getErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback
}

export function userRoleTagType(role) {
  if (role === 'admin') {
    return 'danger'
  }

  if (role === 'trainer') {
    return 'success'
  }

  return 'info'
}

export function userStatusTagType(status) {
  if (status === 'paid') {
    return 'success'
  }

  if (status === 'unpaid') {
    return 'warning'
  }

  return 'info'
}

export function formatUserRole(role) {
  return getCrmRoleLabel(role)
}

export function formatUserStatus(status) {
  if (status === 'paid') {
    return 'Оплачено'
  }

  if (status === 'unpaid') {
    return 'Не оплачено'
  }

  return 'Неизвестно'
}

export function consultationStatusType(status) {
  if (status === CONSULTATION_STATUS.PROCESSED) {
    return 'success'
  }

  if (status === CONSULTATION_STATUS.NEW) {
    return 'danger'
  }

  if (status === CONSULTATION_STATUS.CALL_BACK || status === CONSULTATION_STATUS.BUSY) {
    return 'primary'
  }

  if (status === CONSULTATION_STATUS.SCHEDULED) {
    return 'warning'
  }

  if (status === CONSULTATION_STATUS.UNAVAILABLE || status === CONSULTATION_STATUS.CLOSED) {
    return 'info'
  }

  return 'warning'
}

export function formatConsultationStatus(status) {
  if (status === CONSULTATION_STATUS.PROCESSED) {
    return 'Обработана'
  }

  if (status === CONSULTATION_STATUS.CALL_BACK) {
    return 'Перезвонить'
  }

  if (status === CONSULTATION_STATUS.BUSY) {
    return 'Занят номер'
  }

  if (status === CONSULTATION_STATUS.UNAVAILABLE) {
    return 'Недоступен'
  }

  if (status === CONSULTATION_STATUS.SCHEDULED) {
    return 'Запланирована'
  }

  if (status === CONSULTATION_STATUS.CLOSED) {
    return 'Закрыта'
  }

  return 'Новая'
}

export function formatDateTime(value) {
  if (!value) {
    return 'Неизвестно'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatCompactDateTime(value) {
  if (!value) {
    return 'Неизвестно'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatConsultationDate(value) {
  if (!value) {
    return 'Не указана'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

export function formatConsultationSlot(request) {
  if (!request?.consultationDate || !request?.consultationTime) {
    return 'Не указано'
  }

  return `${formatConsultationDate(request.consultationDate)}, ${request.consultationTime}`
}

export function formatConsultationFullName(request) {
  return [request?.firstName, request?.lastName].filter(Boolean).join(' ') || 'Не указано'
}

export function trainerBookingStatusType(status) {
  if (status === TRAINER_BOOKING_STATUS.NEW) {
    return 'danger'
  }

  if (status === TRAINER_BOOKING_STATUS.CONTACTED) {
    return 'primary'
  }

  if (status === TRAINER_BOOKING_STATUS.CONFIRMED) {
    return 'warning'
  }

  if (status === TRAINER_BOOKING_STATUS.COMPLETED) {
    return 'success'
  }

  return 'info'
}

export function formatTrainerBookingStatus(status) {
  if (status === TRAINER_BOOKING_STATUS.CONTACTED) {
    return 'Связались'
  }

  if (status === TRAINER_BOOKING_STATUS.CONFIRMED) {
    return 'Подтверждена'
  }

  if (status === TRAINER_BOOKING_STATUS.CANCELLED) {
    return 'Отменена'
  }

  if (status === TRAINER_BOOKING_STATUS.COMPLETED) {
    return 'Завершена'
  }

  return 'Новая'
}

export function formatTrainerBookingClientName(booking) {
  return [booking?.lastName, booking?.firstName].filter(Boolean).join(' ') || 'Не указано'
}

export function formatTrainerBookingSlot(booking) {
  if (!booking?.preferredDate || !booking?.preferredTime) {
    return 'Не указано'
  }

  return `${formatConsultationDate(booking.preferredDate)}, ${booking.preferredTime}`
}

export function competitionNameTagType(name) {
  if (name === 'SmartSwimCup') {
    return 'primary'
  }

  if (name === 'smartiki') {
    return 'success'
  }

  return 'info'
}

export function formatCompetitionName(name) {
  if (!name) {
    return 'Не указано'
  }

  const normalizedName = String(name).trim()

  if (!normalizedName) {
    return 'Не указано'
  }

  return normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1)
}

export function formatCompetitionPaymentAmount(value) {
  if (!Number.isFinite(Number(value))) {
    return 'Не указано'
  }

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

export function formatCompetitionPaymentDate(value) {
  if (!value) {
    return 'Не указана'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

export function formatCompetitionStageLabel(stage) {
  if (!Number.isFinite(Number(stage))) {
    return 'Этап'
  }

  return `Этап ${Number(stage)}`
}

function parseAccountDocumentDate(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue) {
    return null
  }

  const isoMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (isoMatch) {
    return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T23:59:59`)
  }

  const ruMatch = normalizedValue.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)

  if (ruMatch) {
    return new Date(`${ruMatch[3]}-${ruMatch[2]}-${ruMatch[1]}T23:59:59`)
  }

  const parsed = new Date(normalizedValue)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatAccountDocumentDate(value) {
  if (!value) {
    return 'Не указана'
  }

  return String(value)
}

export function isAccountDocumentExpired(document, now = Date.now()) {
  const deadline = parseAccountDocumentDate(document?.expiresAt)

  if (!deadline) {
    return false
  }

  return deadline.getTime() < now
}

export function getAccountDocumentDisplayStatus(document, now = Date.now()) {
  if (!document) {
    return {
      status: ACCOUNT_DOCUMENT_STATUS.MISSING,
      label: 'Документ не загружен',
      tagType: 'info',
    }
  }

  if (document.status === ACCOUNT_DOCUMENT_STATUS.VERIFIED && isAccountDocumentExpired(document, now)) {
    return {
      status: 'expired',
      label: 'Просрочен',
      tagType: 'danger',
    }
  }

  const meta = getAccountDocumentStatusMeta(document.status)

  return {
    status: document.status,
    label: meta.label,
    tagType: meta.tagType,
  }
}

export function getAccountDocumentsAdmissionStatus(documents = [], now = Date.now()) {
  const normalizedDocuments = Array.isArray(documents) ? documents : []
  const isMissing = normalizedDocuments.some(
    (document) => document.status === ACCOUNT_DOCUMENT_STATUS.MISSING,
  )
  const hasPending = normalizedDocuments.some(
    (document) => document.status === ACCOUNT_DOCUMENT_STATUS.UPLOADED,
  )
  const hasRejected = normalizedDocuments.some(
    (document) =>
      document.status === ACCOUNT_DOCUMENT_STATUS.REJECTED ||
      document.status === ACCOUNT_DOCUMENT_STATUS.NEEDS_REUPLOAD,
  )
  const hasExpired = normalizedDocuments.some((document) => isAccountDocumentExpired(document, now))

  if (hasRejected) {
    return {
      status: 'attention',
      label: 'Требует внимания',
      description: 'Есть отклоненные документы или запрос на повторную загрузку.',
      tagType: 'danger',
    }
  }

  if (hasExpired) {
    return {
      status: 'attention',
      label: 'Есть просроченные документы',
      description: 'Нужно обновить срок действия одного или нескольких документов.',
      tagType: 'danger',
    }
  }

  if (hasPending) {
    return {
      status: 'pending',
      label: 'На проверке',
      description: 'Документы загружены и ожидают подтверждения администратора.',
      tagType: 'warning',
    }
  }

  if (isMissing) {
    return {
      status: 'missing',
      label: 'Документ не загружен',
      description: 'Нужно загрузить обязательные документы для допуска.',
      tagType: 'info',
    }
  }

  return {
    status: 'admitted',
    label: 'Одобрен',
    description: 'Все обязательные документы подтверждены и действительны.',
    tagType: 'success',
  }
}

export function formatCompetitionCalendarDate(value) {
  if (!value) {
    return 'Не указана'
  }

  return formatCompetitionDateLabel(value)
}

export function formatCompetitionCalendarDateShort(value) {
  if (!value) {
    return 'Не указана'
  }

  return formatCompetitionDateShortLabel(value)
}

export function formatCompetitionDateForInput(value) {
  if (!value) {
    return ''
  }

  return formatCompetitionDateInputValue(value)
}

export function competitionRegistrationStatusType(registration) {
  const state =
    typeof registration === 'string'
      ? registration
      : resolveCompetitionRegistrationState(registration).mode

  if (state === 'open') {
    return 'success'
  }

  return 'danger'
}

export function formatCompetitionRegistrationStatus(registration) {
  const state =
    typeof registration === 'string'
      ? registration
      : resolveCompetitionRegistrationState(registration).mode

  if (state === 'open') {
    return 'Открыта'
  }

  return 'Закрыта'
}

export function formatCompetitionRegistrationWindow(registration) {
  if (!registration) {
    return ''
  }

  const openDate = normalizeEmptyDateLabel(formatCompetitionDateShortLabel(registration.openAt))
  const closeDate = normalizeEmptyDateLabel(formatCompetitionDateShortLabel(registration.closeAt))

  if (!openDate && !closeDate) {
    return ''
  }

  if (!openDate) {
    return `До ${closeDate}`
  }

  if (!closeDate) {
    return `С ${openDate}`
  }

  return `${openDate} - ${closeDate}`
}

export function competitionRegistrationRecordStatusType(status) {
  const normalizedStatus = String(status || '')

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.REVIEWING) {
    return 'warning'
  }

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.NEEDS_FIX) {
    return 'danger'
  }

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.APPROVED) {
    return 'success'
  }

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.PAYMENT_PENDING) {
    return 'warning'
  }

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.PAID) {
    return 'success'
  }

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.WITHDRAWN) {
    return 'danger'
  }

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.SUBMITTED) {
    return 'primary'
  }

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.REJECTED) {
    return 'danger'
  }

  return 'info'
}

export function formatCompetitionRegistrationRecordStatus(status) {
  const normalizedStatus = String(status || '')

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.WITHDRAWN) {
    return 'Снята'
  }

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.REVIEWING) {
    return 'На проверке'
  }

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.NEEDS_FIX) {
    return 'Нужно исправить'
  }

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.APPROVED) {
    return 'Одобрена'
  }

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.PAYMENT_PENDING) {
    return 'Ожидает оплаты'
  }

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.PAID) {
    return 'Оплачена'
  }

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.REJECTED) {
    return 'Отклонена'
  }

  if (normalizedStatus === COMPETITION_REGISTRATION_RECORD_STATUS.SUBMITTED) {
    return 'Подана'
  }

  return 'Неизвестно'
}

function normalizeEmptyDateLabel(value) {
  return value === '—' ? '' : value
}

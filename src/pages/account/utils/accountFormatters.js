import { getCrmRoleLabel } from '@/utils/crmRoles'
import { CONSULTATION_STATUS } from '@/pages/account/utils/accountConstants'

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
  if (status === 'active') {
    return 'success'
  }

  if (status === 'pending') {
    return 'warning'
  }

  if (status === 'blocked') {
    return 'danger'
  }

  return 'info'
}

export function formatUserRole(role) {
  return getCrmRoleLabel(role)
}

export function formatUserStatus(status) {
  if (status === 'active') {
    return 'Активен'
  }

  if (status === 'pending') {
    return 'Ожидает'
  }

  if (status === 'blocked') {
    return 'Заблокирован'
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

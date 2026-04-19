import { getCrmRoleLabel } from '@/utils/crmRoles'
import {
  CONSULTATION_STATUS,
  TRAINER_BOOKING_STATUS,
} from '@/pages/account/utils/accountConstants'

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
  return name || 'Не указано'
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

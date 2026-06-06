import { CRM_ROLE } from '@/utils/crmRoles'
import { SUPABASE_MIN_PASSWORD_LENGTH } from '@/utils/supabaseAuth'
import { createAccountDocumentsState } from '@/pages/account/utils/accountDocumentTypes'
import {
  APPLICATION_STATUS,
  getApplicationStatusOptions,
  isApplicationStatusActive,
} from '@/domains/competition-applications/applicationLifecycle'

export const ACCOUNT_SYNC_COOLDOWN_MS = 1200
export const USERS_PAGE_SIZE = 10
export const MIN_PASSWORD_LENGTH = SUPABASE_MIN_PASSWORD_LENGTH

export const CONSULTATION_STATUS = Object.freeze({
  NEW: 'new',
  PROCESSED: 'processed',
  CALL_BACK: 'call_back',
  BUSY: 'busy',
  UNAVAILABLE: 'unavailable',
  SCHEDULED: 'scheduled',
  CLOSED: 'closed',
})

export const CONSULTATION_STATUS_OPTIONS = [
  { value: CONSULTATION_STATUS.NEW, label: 'Новая' },
  { value: CONSULTATION_STATUS.PROCESSED, label: 'Обработана' },
  { value: CONSULTATION_STATUS.CALL_BACK, label: 'Перезвонить' },
  { value: CONSULTATION_STATUS.BUSY, label: 'Занят номер' },
  { value: CONSULTATION_STATUS.UNAVAILABLE, label: 'Недоступен' },
  { value: CONSULTATION_STATUS.SCHEDULED, label: 'Запланирована' },
  { value: CONSULTATION_STATUS.CLOSED, label: 'Закрыта' },
]

export const TRAINER_BOOKING_STATUS = Object.freeze({
  NEW: 'new',
  IN_WORK: 'in_work',
  PROCESSED: 'processed',
  CONTACTED: 'contacted',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
})

export const TRAINER_BOOKING_STATUS_OPTIONS = [
  { value: TRAINER_BOOKING_STATUS.NEW, label: 'Новая' },
  { value: TRAINER_BOOKING_STATUS.IN_WORK, label: 'В работе' },
  { value: TRAINER_BOOKING_STATUS.PROCESSED, label: 'Обработана' },
]

export const COMPETITION_REGISTRATION_RECORD_STATUS = Object.freeze({
  SUBMITTED: APPLICATION_STATUS.SUBMITTED,
  REVIEWING: APPLICATION_STATUS.REVIEWING,
  NEEDS_FIX: APPLICATION_STATUS.NEEDS_FIX,
  APPROVED: APPLICATION_STATUS.APPROVED,
  PAYMENT_PENDING: APPLICATION_STATUS.PAYMENT_PENDING,
  PAID: APPLICATION_STATUS.PAID,
  ADMITTED: APPLICATION_STATUS.ADMITTED,
  WITHDRAWN: APPLICATION_STATUS.WITHDRAWN,
  REJECTED: APPLICATION_STATUS.REJECTED,
})

export const COMPETITION_REGISTRATION_RECORD_STATUS_OPTIONS =
  getApplicationStatusOptions({ audience: 'admin' })

export const COMPETITION_REGISTRATION_ACTIVE_STATUSES = [
  COMPETITION_REGISTRATION_RECORD_STATUS.SUBMITTED,
  COMPETITION_REGISTRATION_RECORD_STATUS.REVIEWING,
  COMPETITION_REGISTRATION_RECORD_STATUS.NEEDS_FIX,
  COMPETITION_REGISTRATION_RECORD_STATUS.APPROVED,
  COMPETITION_REGISTRATION_RECORD_STATUS.PAYMENT_PENDING,
  COMPETITION_REGISTRATION_RECORD_STATUS.PAID,
]

export function isCompetitionRegistrationActiveStatus(status) {
  return isApplicationStatusActive(status)
}

export const USER_STATUS_OPTIONS = [
  { value: 'paid', label: 'Оплачено' },
  { value: 'unpaid', label: 'Не оплачено' },
]

export const USER_ROLE_OPTIONS = [
  { value: CRM_ROLE.USER, label: 'Пользователь' },
  { value: CRM_ROLE.ATHLETE, label: 'Спортсмен' },
  { value: CRM_ROLE.TRAINER, label: 'Тренер' },
  { value: CRM_ROLE.ADMIN, label: 'Администратор' },
]

export const COMPETITION_NAME_OPTIONS = [
  { value: 'all', label: 'Все соревнования' },
  { value: 'SmartSwimCup', label: 'SmartSwimCup' },
  { value: 'smartiki', label: 'smartiki' },
]

export const DOCUMENT_REVIEW_STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'uploaded', label: 'На проверке' },
  { value: 'verified', label: 'Одобрен' },
  { value: 'rejected', label: 'Отклонен' },
  { value: 'needs_reupload', label: 'Нужно обновить' },
  { value: 'missing', label: 'Документ не загружен' },
]

export const ATHLETE_APPLICATION_STATUS = Object.freeze({
  NEW: 'new',
  REVIEWING: 'reviewing',
  NEEDS_DATA: 'needs_data',
  READY: 'ready',
  ADMITTED: 'admitted',
  REJECTED: 'rejected',
})

export const ATHLETE_APPLICATION_STATUS_OPTIONS = [
  { value: ATHLETE_APPLICATION_STATUS.NEW, label: 'Новая' },
  { value: ATHLETE_APPLICATION_STATUS.REVIEWING, label: 'В работе' },
  { value: ATHLETE_APPLICATION_STATUS.NEEDS_DATA, label: 'Нужны данные' },
  { value: ATHLETE_APPLICATION_STATUS.READY, label: 'Готово' },
  { value: ATHLETE_APPLICATION_STATUS.ADMITTED, label: 'Допущена' },
  { value: ATHLETE_APPLICATION_STATUS.REJECTED, label: 'Отклонена' },
]

export const DOCUMENT_SCOPE_OPTIONS = [
  { value: 'all', label: 'Все разделы' },
  { value: 'profile', label: 'Профиль' },
  { value: 'athlete', label: 'Спортсмены' },
]

export function createDefaultPasswordChangeForm() {
  return {
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}

export function createDefaultPasswordChangeErrors() {
  return {
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}

export function createDefaultPasswordVisibility() {
  return {
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  }
}

export function createDefaultUserEditForm() {
  return {
    id: '',
    name: '',
    email: '',
    phone: '',
    isAthleteRecord: false,
    athleteId: '',
    ownerUserId: '',
    ownerName: '',
    ownerEmail: '',
    gender: '',
    rank: '',
    coach: '',
    birthDate: '',
    club: '',
    role: CRM_ROLE.USER,
    status: 'paid',
    registeredAt: null,
    experience: '',
    mainProfile: '',
    availableSeats: '',
    education: '',
    sportAchievements: '',
    worksWith: '',
    minAge: '',
    preparationLevel: '',
    metro: '',
    documents: createAccountDocumentsState(),
    athletes: [],
  }
}

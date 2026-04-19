import { CRM_ROLE } from '@/utils/crmRoles'
import { SUPABASE_MIN_PASSWORD_LENGTH } from '@/utils/supabaseAuth'

export const ACCOUNT_SYNC_COOLDOWN_MS = 1200
export const USERS_PAGE_SIZE = 20
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
  CONTACTED: 'contacted',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
})

export const TRAINER_BOOKING_STATUS_OPTIONS = [
  { value: TRAINER_BOOKING_STATUS.NEW, label: 'Новая' },
  { value: TRAINER_BOOKING_STATUS.CONTACTED, label: 'Связались' },
  { value: TRAINER_BOOKING_STATUS.CONFIRMED, label: 'Подтверждена' },
  { value: TRAINER_BOOKING_STATUS.CANCELLED, label: 'Отменена' },
  { value: TRAINER_BOOKING_STATUS.COMPLETED, label: 'Завершена' },
]

export const USER_STATUS_OPTIONS = [
  { value: 'paid', label: 'Оплачено' },
  { value: 'unpaid', label: 'Не оплачено' },
]

export const USER_ROLE_OPTIONS = [
  { value: CRM_ROLE.USER, label: 'Пользователь' },
  { value: CRM_ROLE.TRAINER, label: 'Тренер' },
  { value: CRM_ROLE.ADMIN, label: 'Администратор' },
]

export const COMPETITION_NAME_OPTIONS = [
  { value: 'all', label: 'Все соревнования' },
  { value: 'SmartSwimCup', label: 'SmartSwimCup' },
  { value: 'smartiki', label: 'smartiki' },
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
    role: CRM_ROLE.USER,
    status: 'paid',
  }
}

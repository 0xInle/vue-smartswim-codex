import { formatDateInput } from '@/utils/dateInput'

export function sanitizePersonNameInput(value) {
  return String(value ?? '')
    .replace(/[^\p{L}\s'-]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trimStart()
}

export function sanitizeDateFieldInput(value) {
  return formatDateInput(value)
}

export function sanitizeIntegerInput(value, { maxLength = 3 } = {}) {
  return String(value ?? '').replace(/\D/g, '').slice(0, maxLength)
}

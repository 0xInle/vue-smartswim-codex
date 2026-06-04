function normalizeDateDigits(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 8)
}

export function formatDateInput(value) {
  const digits = normalizeDateDigits(value)

  if (!digits) {
    return ''
  }

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`
}


const RUSSIAN_PHONE_DIGITS = 10
const MIN_INTERNATIONAL_PHONE_DIGITS = 7
const MAX_INTERNATIONAL_PHONE_DIGITS = 15

function normalizePhoneDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function getRussianPhoneNationalDigits(value) {
  const digits = normalizePhoneDigits(value)

  if (!digits) {
    return ''
  }

  if (digits.length === RUSSIAN_PHONE_DIGITS) {
    return digits
  }

  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return digits.slice(1)
  }

  return ''
}

function formatRussianPhoneDraft(digits) {
  if (!digits) {
    return ''
  }

  const areaCode = digits.slice(0, 3)

  if (digits.length <= 3) {
    return `+7 (${areaCode}`
  }

  let result = `+7 (${areaCode})`
  const firstBlock = digits.slice(3, 6)

  if (!firstBlock) {
    return result
  }

  result += ` ${firstBlock}`

  const secondBlock = digits.slice(6, 8)

  if (!secondBlock) {
    return result
  }

  result += `-${secondBlock}`

  const thirdBlock = digits.slice(8, 10)

  if (!thirdBlock) {
    return result
  }

  return `${result}-${thirdBlock}`
}

function normalizeInternationalPhoneDigits(value) {
  const digits = normalizePhoneDigits(value).slice(0, MAX_INTERNATIONAL_PHONE_DIGITS)

  if (digits.length === RUSSIAN_PHONE_DIGITS) {
    return `7${digits}`
  }

  if (digits.length === 11 && digits.startsWith('8')) {
    return `7${digits.slice(1)}`
  }

  return digits
}

function getInternationalPhoneDigits(value) {
  const digits = normalizeInternationalPhoneDigits(value)

  if (digits.length >= MIN_INTERNATIONAL_PHONE_DIGITS && digits.length <= MAX_INTERNATIONAL_PHONE_DIGITS) {
    return digits
  }

  return ''
}

function formatInternationalPhoneDraft(digits) {
  if (!digits) {
    return ''
  }

  if (digits.startsWith('7') && digits.length <= 11) {
    return formatRussianPhoneDraft(digits.slice(1))
  }

  return `+${digits}`
}

export function formatRussianPhone(value) {
  const digits = getRussianPhoneNationalDigits(value)

  if (!digits) {
    return String(value ?? '').trim()
  }

  return formatRussianPhoneDraft(digits)
}

export function formatRussianPhoneInput(value) {
  const digits = normalizePhoneDigits(value).slice(0, 11)

  if (!digits) {
    return ''
  }

  if ((digits.startsWith('7') || digits.startsWith('8')) && digits.length === 1) {
    return '+7 ('
  }

  const nationalDigits =
    digits.startsWith('7') || digits.startsWith('8') ? digits.slice(1) : digits.slice(0, 10)

  return formatRussianPhoneDraft(nationalDigits)
}

export function isRussianPhone(value) {
  return getRussianPhoneNationalDigits(value).length === RUSSIAN_PHONE_DIGITS
}

export function formatPhone(value) {
  const digits = getInternationalPhoneDigits(value)

  if (!digits) {
    return String(value ?? '').trim()
  }

  if (digits.startsWith('7') && digits.length === 11) {
    return formatRussianPhoneDraft(digits.slice(1))
  }

  return formatInternationalPhoneDraft(digits)
}

export function formatPhoneInput(value) {
  const rawValue = String(value ?? '').trim()
  const digits = normalizeInternationalPhoneDigits(value)

  if (!digits) {
    return ''
  }

  if (!rawValue.startsWith('+') && normalizePhoneDigits(rawValue).length <= RUSSIAN_PHONE_DIGITS) {
    return formatRussianPhoneDraft(normalizePhoneDigits(rawValue).slice(0, RUSSIAN_PHONE_DIGITS))
  }

  if (digits.startsWith('7') || (digits.startsWith('8') && digits.length <= 11)) {
    if (digits.length === 1) {
      return '+7 ('
    }

    const normalizedRussianDigits = digits.startsWith('8') ? `7${digits.slice(1)}` : digits
    return formatRussianPhoneDraft(normalizedRussianDigits.slice(1, 11))
  }

  return formatInternationalPhoneDraft(digits)
}

export function isValidPhone(value) {
  return Boolean(getInternationalPhoneDigits(value))
}

export function toRussianPhoneHref(value) {
  const digits = getRussianPhoneNationalDigits(value)

  return digits ? `tel:+7${digits}` : ''
}

export function toPhoneHref(value) {
  const digits = getInternationalPhoneDigits(value)

  return digits ? `tel:+${digits}` : ''
}

export function getRussianPhoneSearchValue(value) {
  const digits = getRussianPhoneNationalDigits(value)

  if (!digits) {
    return formatRussianPhone(value)
  }

  return `${formatRussianPhoneDraft(digits)} ${digits}`
}

export function getPhoneSearchValue(value) {
  const digits = getInternationalPhoneDigits(value)
  const formattedPhone = formatPhone(value)

  return digits ? `${formattedPhone} ${digits}` : formattedPhone
}

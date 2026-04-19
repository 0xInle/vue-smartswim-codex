const RUSSIAN_PHONE_DIGITS = 10

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

export function toRussianPhoneHref(value) {
  const digits = getRussianPhoneNationalDigits(value)

  return digits ? `tel:+7${digits}` : ''
}

export function getRussianPhoneSearchValue(value) {
  const digits = getRussianPhoneNationalDigits(value)

  if (!digits) {
    return formatRussianPhone(value)
  }

  return `${formatRussianPhoneDraft(digits)} ${digits}`
}

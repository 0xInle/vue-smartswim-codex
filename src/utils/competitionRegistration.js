const MOSCOW_TIME_ZONE = 'Europe/Moscow'
const COMPETITION_TIME_ZONE_SUFFIX = '+03:00'
const RUSSIAN_MONTH_INDEX = {
  января: 0,
  февраля: 1,
  марта: 2,
  апреля: 3,
  мая: 4,
  июня: 5,
  июля: 6,
  августа: 7,
  сентября: 8,
  октября: 9,
  ноября: 10,
  декабря: 11,
}

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: MOSCOW_TIME_ZONE,
})

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: MOSCOW_TIME_ZONE,
})

const INPUT_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: MOSCOW_TIME_ZONE,
})

function normalizeCompetitionTimestamp(value) {
  if (value instanceof Date) {
    const timestamp = value.getTime()
    return Number.isNaN(timestamp) ? null : timestamp
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value
  }

  if (typeof value !== 'string' || !value) {
    return null
  }

  const timestamp = Date.parse(value)

  if (!Number.isNaN(timestamp)) {
    return timestamp
  }

  const match = value
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})\s+([а-яё]+)\s+(\d{4})$/i)

  if (!match) {
    return null
  }

  const [, day, monthName, year] = match
  const monthIndex = RUSSIAN_MONTH_INDEX[monthName]

  if (monthIndex === undefined) {
    return null
  }

  const normalizedDay = String(day).padStart(2, '0')
  const normalizedMonth = String(monthIndex + 1).padStart(2, '0')
  const normalizedTimestamp = Date.parse(
    `${year}-${normalizedMonth}-${normalizedDay}T12:00:00${COMPETITION_TIME_ZONE_SUFFIX}`,
  )

  return Number.isNaN(normalizedTimestamp) ? null : normalizedTimestamp
}

function isRussianLongDateString(value) {
  return (
    typeof value === 'string' &&
    /^(\d{1,2})\s+([а-яё]+)\s+(\d{4})$/i.test(value.trim().toLowerCase())
  )
}

function formatDateParts(formatter, value) {
  const timestamp = normalizeCompetitionTimestamp(value)

  if (timestamp === null) {
    return ''
  }

  const parts = formatter.formatToParts(new Date(timestamp))
  const day = parts.find((item) => item.type === 'day')?.value || ''
  const month = parts.find((item) => item.type === 'month')?.value || ''
  const year = parts.find((item) => item.type === 'year')?.value || ''

  if (!day || !month || !year) {
    return ''
  }

  if (formatter === INPUT_DATE_FORMATTER) {
    return `${year}-${month}-${day}`
  }

  return formatter.format(new Date(timestamp))
}

export function formatCompetitionDateLabel(value) {
  if (isRussianLongDateString(value)) {
    return value.trim()
  }

  const formattedDate = formatDateParts(LONG_DATE_FORMATTER, value)

  return formattedDate || '—'
}

export function formatCompetitionDateShortLabel(value) {
  const formattedDate = formatDateParts(SHORT_DATE_FORMATTER, value)

  return formattedDate || '—'
}

export function formatCompetitionDateInputValue(value) {
  return formatDateParts(INPUT_DATE_FORMATTER, value)
}

export function shiftCompetitionDateValue(value, offsetDays) {
  const baseValue = formatCompetitionDateInputValue(value)

  if (!baseValue) {
    return ''
  }

  const timestamp = Date.parse(`${baseValue}T12:00:00${COMPETITION_TIME_ZONE_SUFFIX}`)

  if (Number.isNaN(timestamp)) {
    return ''
  }

  return formatCompetitionDateInputValue(new Date(timestamp + offsetDays * 24 * 60 * 60 * 1000))
}

export function toCompetitionDateTime(value, { endOfDay = false } = {}) {
  const dateValue = formatCompetitionDateInputValue(value)

  if (!dateValue) {
    return ''
  }

  return `${dateValue}T${endOfDay ? '23:59:59' : '00:00:00'}${COMPETITION_TIME_ZONE_SUFFIX}`
}

export function buildCompetitionRegistrationWindow(stageDate) {
  const openDate = shiftCompetitionDateValue(stageDate, -21)
  const closeDate = shiftCompetitionDateValue(stageDate, -3)

  return {
    openAt: toCompetitionDateTime(openDate),
    closeAt: toCompetitionDateTime(closeDate, { endOfDay: true }),
    openDateLabel: formatCompetitionDateShortLabel(openDate),
    closeDateLabel: formatCompetitionDateShortLabel(closeDate),
  }
}

export function resolveCompetitionRegistrationState(registration = {}, now = Date.now()) {
  const explicitStatus = registration.status
  const openAt = normalizeCompetitionTimestamp(registration.openAt)
  const closeAt = normalizeCompetitionTimestamp(registration.closeAt)
  const openDateLabel = registration.openDateLabel || formatCompetitionDateShortLabel(openAt)

  if (explicitStatus === 'closed') {
    return {
      mode: 'closed',
      openAt: registration.openAt || '',
      closeAt: registration.closeAt || '',
      openDateLabel,
      closeDateLabel: registration.closeDateLabel || formatCompetitionDateShortLabel(closeAt),
      closedTitle: registration.closedTitle || 'Регистрация закрыта',
      closedText: registration.closedText || '',
      closeNote: registration.closeNote || '',
      competitionDateLabel:
        registration.competitionDateLabel || formatCompetitionDateLabel(registration.openAt),
    }
  }

  if (explicitStatus === 'open') {
    return {
      mode: 'open',
      openAt: registration.openAt || '',
      closeAt: registration.closeAt || '',
      openDateLabel,
      closeDateLabel: registration.closeDateLabel || formatCompetitionDateShortLabel(closeAt),
      closedTitle: registration.closedTitle || 'Регистрация закрыта',
      closedText: registration.closedText || '',
      closeNote: registration.closeNote || '',
      competitionDateLabel:
        registration.competitionDateLabel || formatCompetitionDateLabel(registration.openAt),
    }
  }

  if (!openAt || now < openAt) {
    return {
      mode: 'upcoming',
      openAt: registration.openAt || '',
      closeAt: registration.closeAt || '',
      openDateLabel,
      closeDateLabel: registration.closeDateLabel || formatCompetitionDateShortLabel(closeAt),
      closedTitle: registration.closedTitle || 'Регистрация закрыта',
      closedText: registration.closedText || '',
      closeNote: registration.closeNote || '',
      competitionDateLabel:
        registration.competitionDateLabel || formatCompetitionDateLabel(registration.openAt),
    }
  }

  if (closeAt && now >= closeAt) {
    return {
      mode: 'closed',
      openAt: registration.openAt || '',
      closeAt: registration.closeAt || '',
      openDateLabel,
      closeDateLabel: registration.closeDateLabel || formatCompetitionDateShortLabel(closeAt),
      closedTitle: registration.closedTitle || 'Регистрация закрыта',
      closedText: registration.closedText || 'Регистрация завершена.',
      closeNote: registration.closeNote || '',
      competitionDateLabel:
        registration.competitionDateLabel || formatCompetitionDateLabel(registration.openAt),
    }
  }

  return {
    mode: 'open',
    openAt: registration.openAt || '',
    closeAt: registration.closeAt || '',
    openDateLabel,
    closeDateLabel: registration.closeDateLabel || formatCompetitionDateShortLabel(closeAt),
    closedTitle: registration.closedTitle || 'Регистрация закрыта',
    closedText: registration.closedText || '',
    closeNote: registration.closeNote || '',
    competitionDateLabel:
      registration.competitionDateLabel || formatCompetitionDateLabel(registration.openAt),
  }
}

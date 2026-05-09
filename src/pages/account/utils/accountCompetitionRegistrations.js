import { COMPETITION_REGISTRATION_RECORD_STATUS } from '@/pages/account/utils/accountConstants'

const ACCOUNT_COMPETITION_REGISTRATIONS_STORAGE_PREFIX = 'smartswim:account-competition-registrations:v1'

const ROMAN_STAGE_VALUES = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
}

function resolveCurrentUser(currentUser) {
  return currentUser?.value || currentUser || null
}

function getCurrentUserKey(currentUser) {
  const resolvedUser = resolveCurrentUser(currentUser)

  return resolvedUser?.id || resolvedUser?.email || 'anonymous'
}

function buildStorageKey(currentUser) {
  return `${ACCOUNT_COMPETITION_REGISTRATIONS_STORAGE_PREFIX}:${getCurrentUserKey(currentUser)}`
}

function buildStorageKeyFromUserKey(userKey) {
  return `${ACCOUNT_COMPETITION_REGISTRATIONS_STORAGE_PREFIX}:${userKey || 'anonymous'}`
}

function normalizeRegistrationStatus(status) {
  if (status === COMPETITION_REGISTRATION_RECORD_STATUS.WITHDRAWN) {
    return COMPETITION_REGISTRATION_RECORD_STATUS.WITHDRAWN
  }

  return COMPETITION_REGISTRATION_RECORD_STATUS.SUBMITTED
}

function normalizeCompetitionRegistrationRecord(item, sourceUserKey = '') {
  const createdAt = item.createdAt || new Date().toISOString()
  const status = normalizeRegistrationStatus(item.status)
  const statusChangedAt = item.statusChangedAt || createdAt
  const updatedAt = item.updatedAt || statusChangedAt

  return {
    id: item.id || createCompetitionRegistrationId(),
    competitionSlug: item.competitionSlug || '',
    competitionName: item.competitionName || '',
    stageId: item.stageId || '',
    stageLabel: item.stageLabel || '',
    competitionDateLabel: item.competitionDateLabel || '',
    competitionWindowLabel: item.competitionWindowLabel || '',
    participantKind: item.participantKind || 'owner',
    participantId: item.participantId || 'owner',
    participantName: item.participantName || '',
    participantBirthDate: item.participantBirthDate || '',
    participantClub: item.participantClub || '',
    participantPhone: item.participantPhone || '',
    participantEmail: item.participantEmail || '',
    ownerName: item.ownerName || '',
    ownerEmail: item.ownerEmail || '',
    ownerPhone: item.ownerPhone || '',
    registrationKind: item.registrationKind || 'individual',
    paymentOptionId: item.paymentOptionId || '',
    paymentOptionTitle: item.paymentOptionTitle || '',
    teamName: item.teamName || '',
    seedTime: item.seedTime || '',
    comment: item.comment || '',
    status,
    createdAt,
    statusChangedAt,
    updatedAt,
    statusChangedBy: item.statusChangedBy || '',
    sourceUserKey,
  }
}

function readJsonStorage(storageKey, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const serializedValue = window.localStorage.getItem(storageKey)

    if (!serializedValue) {
      return fallback
    }

    return JSON.parse(serializedValue)
  } catch {
    return fallback
  }
}

function writeRegistrationsByStorageKey(storageKey, registrations) {
  writeJsonStorage(storageKey, registrations)
}

function writeJsonStorage(storageKey, value) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value))
  } catch {
    // Ignore storage quota and serialization failures for the mock flow.
  }
}

export function createCompetitionRegistrationId() {
  return `registration-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getCompetitionCardStageNumber(card) {
  const title = String(card?.title || '')
    .trim()
    .toUpperCase()
  const numericTitle = Number(title)

  if (Number.isFinite(numericTitle)) {
    return numericTitle
  }

  return ROMAN_STAGE_VALUES[title] || null
}

export function resolveCompetitionStageId(competitionSlug, card) {
  const stageNumber = getCompetitionCardStageNumber(card)

  if (!competitionSlug || !Number.isFinite(stageNumber)) {
    return ''
  }

  return `${competitionSlug}-stage-${stageNumber}`
}

export function buildCompetitionAccountRoute({ competitionSlug = '', stageId = '' } = {}) {
  const url = new URL(import.meta.env.BASE_URL || '/', window.location.origin)
  url.pathname = `${url.pathname.replace(/\/$/, '')}/account`.replace(/\/+/g, '/')
  url.searchParams.set('section', 'competitions')

  if (competitionSlug) {
    url.searchParams.set('competitionSlug', competitionSlug)
  }

  if (stageId) {
    url.searchParams.set('stageId', stageId)
  }

  return `${url.pathname}${url.search}`
}

export function readCompetitionRegistrations(currentUser) {
  const storageKey = buildStorageKey(currentUser)
  const parsedRegistrations = readJsonStorage(storageKey, [])

  if (!Array.isArray(parsedRegistrations)) {
    return []
  }

  return parsedRegistrations
    .filter((item) => item && typeof item === 'object')
    .map((item) => normalizeCompetitionRegistrationRecord(item, getCurrentUserKey(currentUser)))
}

export function readAllCompetitionRegistrations() {
  if (typeof window === 'undefined') {
    return []
  }

  const storagePrefix = `${ACCOUNT_COMPETITION_REGISTRATIONS_STORAGE_PREFIX}:`
  const storageKeys = []

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index)

    if (storageKey && storageKey.startsWith(storagePrefix)) {
      storageKeys.push(storageKey)
    }
  }

  return storageKeys.flatMap((storageKey) => {
    const sourceUserKey = storageKey.slice(storagePrefix.length)
    const parsedRegistrations = readJsonStorage(storageKey, [])

    if (!Array.isArray(parsedRegistrations)) {
      return []
    }

    return parsedRegistrations
      .filter((item) => item && typeof item === 'object')
      .map((item) => normalizeCompetitionRegistrationRecord(item, sourceUserKey))
  })
}

export function persistCompetitionRegistrations(currentUser, registrations) {
  writeRegistrationsByStorageKey(buildStorageKey(currentUser), registrations)
}

export function persistCompetitionRegistrationsByUserKey(userKey, registrations) {
  writeRegistrationsByStorageKey(buildStorageKeyFromUserKey(userKey), registrations)
}

export function createCompetitionRegistrationRecord(payload) {
  const createdAt = payload.createdAt || new Date().toISOString()

  return {
    id: createCompetitionRegistrationId(),
    competitionSlug: payload.competitionSlug || '',
    competitionName: payload.competitionName || '',
    stageId: payload.stageId || '',
    stageLabel: payload.stageLabel || '',
    competitionDateLabel: payload.competitionDateLabel || '',
    competitionWindowLabel: payload.competitionWindowLabel || '',
    participantKind: payload.participantKind || 'owner',
    participantId: payload.participantId || 'owner',
    participantName: payload.participantName || '',
    participantBirthDate: payload.participantBirthDate || '',
    participantClub: payload.participantClub || '',
    participantPhone: payload.participantPhone || '',
    participantEmail: payload.participantEmail || '',
    ownerName: payload.ownerName || '',
    ownerEmail: payload.ownerEmail || '',
    ownerPhone: payload.ownerPhone || '',
    registrationKind: payload.registrationKind || 'individual',
    paymentOptionId: payload.paymentOptionId || '',
    paymentOptionTitle: payload.paymentOptionTitle || '',
    teamName: payload.teamName || '',
    seedTime: payload.seedTime || '',
    comment: payload.comment || '',
    status: payload.status || 'submitted',
    createdAt,
    statusChangedAt: payload.statusChangedAt || createdAt,
    updatedAt: payload.updatedAt || payload.statusChangedAt || createdAt,
    statusChangedBy: payload.statusChangedBy || 'user',
  }
}

export function updateCompetitionRegistration(
  currentUser,
  registrationId,
  patch = {},
  { statusChangedBy = 'user' } = {},
) {
  if (!registrationId) {
    return null
  }

  const registrations = readCompetitionRegistrations(currentUser)
  const targetRegistration = registrations.find((item) => item.id === registrationId)

  if (!targetRegistration) {
    return null
  }

  const hasStatusPatch = Object.prototype.hasOwnProperty.call(patch, 'status')
  const nextStatus = hasStatusPatch
    ? normalizeRegistrationStatus(patch.status)
    : targetRegistration.status
  const nextCreatedAt = patch.createdAt || targetRegistration.createdAt || new Date().toISOString()
  const now = new Date().toISOString()
  const nextStatusChangedAt = hasStatusPatch ? patch.statusChangedAt || now : targetRegistration.statusChangedAt
  const nextUpdatedAt = patch.updatedAt || now

  const updatedRegistration = {
    ...targetRegistration,
    ...patch,
    status: nextStatus,
    createdAt: nextCreatedAt,
    statusChangedAt: nextStatusChangedAt,
    updatedAt: nextUpdatedAt,
    statusChangedBy: patch.statusChangedBy || statusChangedBy,
  }

  persistCompetitionRegistrations(
    currentUser,
    registrations.map((item) => (item.id === registrationId ? updatedRegistration : item)),
  )

  return updatedRegistration
}

export function updateCompetitionRegistrationStatus(
  currentUser,
  registrationId,
  status,
  { statusChangedBy = 'user' } = {},
) {
  return updateCompetitionRegistration(currentUser, registrationId, { status }, { statusChangedBy })
}

export function updateCompetitionRegistrationByUserKey(
  userKey,
  registrationId,
  patch = {},
  { statusChangedBy = 'admin' } = {},
) {
  if (!userKey || !registrationId) {
    return null
  }

  const storageKey = buildStorageKeyFromUserKey(userKey)
  const registrations = readJsonStorage(storageKey, [])

  if (!Array.isArray(registrations)) {
    return null
  }

  const normalizedRegistrations = registrations
    .filter((item) => item && typeof item === 'object')
    .map((item) => normalizeCompetitionRegistrationRecord(item, userKey))
  const targetRegistration = normalizedRegistrations.find((item) => item.id === registrationId)

  if (!targetRegistration) {
    return null
  }

  const hasStatusPatch = Object.prototype.hasOwnProperty.call(patch, 'status')
  const nextStatus = hasStatusPatch
    ? normalizeRegistrationStatus(patch.status)
    : targetRegistration.status
  const nextCreatedAt = patch.createdAt || targetRegistration.createdAt || new Date().toISOString()
  const now = new Date().toISOString()
  const nextStatusChangedAt = hasStatusPatch ? patch.statusChangedAt || now : targetRegistration.statusChangedAt
  const nextUpdatedAt = patch.updatedAt || now

  const updatedRegistration = {
    ...targetRegistration,
    ...patch,
    status: nextStatus,
    createdAt: nextCreatedAt,
    statusChangedAt: nextStatusChangedAt,
    updatedAt: nextUpdatedAt,
    statusChangedBy: patch.statusChangedBy || statusChangedBy,
    sourceUserKey: userKey,
  }

  persistCompetitionRegistrationsByUserKey(
    userKey,
    normalizedRegistrations.map((item) => (item.id === registrationId ? updatedRegistration : item)),
  )

  return updatedRegistration
}

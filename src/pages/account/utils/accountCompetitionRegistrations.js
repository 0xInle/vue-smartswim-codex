import {
  COMPETITION_REGISTRATION_RECORD_STATUS,
  isCompetitionRegistrationActiveStatus,
} from '@/pages/account/utils/accountConstants'
import { normalizeApplicationStatus } from '@/domains/competition-applications/applicationLifecycle'

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

function getCompetitionRegistrationStorageKeys() {
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

  return storageKeys
}

function normalizeRegistrationStatus(status) {
  return normalizeApplicationStatus(status)
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
  const storagePrefix = `${ACCOUNT_COMPETITION_REGISTRATIONS_STORAGE_PREFIX}:`

  return getCompetitionRegistrationStorageKeys().flatMap((storageKey) => {
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

export function countCompetitionRegistrationsByStageId(
  stageId,
  { status = 'active' } = {},
) {
  if (!stageId) {
    return 0
  }

  return readAllCompetitionRegistrations().filter((registration) => {
    if (registration.stageId !== stageId) {
      return false
    }

    if (status === 'all') {
      return true
    }

    if (status === 'active') {
      return isCompetitionRegistrationActiveStatus(registration.status)
    }

    return registration.status === status
  }).length
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
    status: normalizeRegistrationStatus(payload.status || COMPETITION_REGISTRATION_RECORD_STATUS.SUBMITTED),
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
  const nextStatusChangedAt =
    hasStatusPatch && nextStatus !== targetRegistration.status
      ? patch.statusChangedAt || now
      : targetRegistration.statusChangedAt
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

export function countCompetitionRegistrationsForParticipant(
  currentUser,
  { participantKind = '', participantId = '', status = 'active' } = {},
) {
  if (!participantKind || !participantId) {
    return 0
  }

  return readCompetitionRegistrations(currentUser).filter((registration) => {
    if (
      registration.participantKind !== participantKind ||
      registration.participantId !== participantId
    ) {
      return false
    }

    if (status === 'all') {
      return true
    }

    if (status === 'active') {
      return isCompetitionRegistrationActiveStatus(registration.status)
    }

    return registration.status === status
  }).length
}

export function syncCompetitionRegistrationOwnerSnapshot(currentUser, profile = {}) {
  const registrations = readCompetitionRegistrations(currentUser)

  if (!registrations.length) {
    return 0
  }

  let updatedCount = 0
  const now = new Date().toISOString()
  const nextRegistrations = registrations.map((registration) => {
    const ownerPatch = {
      ownerName: profile.fullName || registration.ownerName,
      ownerEmail: profile.email || registration.ownerEmail,
      ownerPhone: profile.phone || registration.ownerPhone,
      updatedAt: now,
    }

    if (registration.participantKind !== 'owner') {
      updatedCount += 1
      return {
        ...registration,
        ...ownerPatch,
      }
    }

    updatedCount += 1
    return {
      ...registration,
      ...ownerPatch,
      participantName: profile.fullName || registration.participantName,
      participantBirthDate: profile.birthDate || registration.participantBirthDate,
      participantClub: profile.club || registration.participantClub,
      participantPhone: profile.phone || registration.participantPhone,
      participantEmail: profile.email || registration.participantEmail,
    }
  })

  persistCompetitionRegistrations(currentUser, nextRegistrations)

  return updatedCount
}

export function syncCompetitionRegistrationAthleteSnapshot(currentUser, athlete = {}) {
  if (!athlete?.id) {
    return 0
  }

  const registrations = readCompetitionRegistrations(currentUser)
  let updatedCount = 0
  const now = new Date().toISOString()
  const nextRegistrations = registrations.map((registration) => {
    if (registration.participantKind !== 'athlete' || registration.participantId !== athlete.id) {
      return registration
    }

    updatedCount += 1

    return {
      ...registration,
      participantName: athlete.fullName || registration.participantName,
      participantBirthDate: athlete.birthDate || registration.participantBirthDate,
      participantClub: athlete.club || registration.participantClub,
      updatedAt: now,
    }
  })

  if (updatedCount > 0) {
    persistCompetitionRegistrations(currentUser, nextRegistrations)
  }

  return updatedCount
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
  const nextStatusChangedAt =
    hasStatusPatch && nextStatus !== targetRegistration.status
      ? patch.statusChangedAt || now
      : targetRegistration.statusChangedAt
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

export function updateCompetitionRegistrationsByStageId(
  stageId,
  patch = {},
  { statusChangedBy = 'admin' } = {},
) {
  if (!stageId) {
    return 0
  }

  const storagePrefix = `${ACCOUNT_COMPETITION_REGISTRATIONS_STORAGE_PREFIX}:`
  let updatedCount = 0

  getCompetitionRegistrationStorageKeys().forEach((storageKey) => {
    const sourceUserKey = storageKey.slice(storagePrefix.length)
    const parsedRegistrations = readJsonStorage(storageKey, [])

    if (!Array.isArray(parsedRegistrations)) {
      return
    }

    let hasUpdates = false
    const now = new Date().toISOString()
    const hasStatusPatch = Object.prototype.hasOwnProperty.call(patch, 'status')
    const nextStatus = hasStatusPatch ? normalizeRegistrationStatus(patch.status) : ''
    const nextRegistrations = parsedRegistrations
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const registration = normalizeCompetitionRegistrationRecord(item, sourceUserKey)

        if (registration.stageId !== stageId) {
          return registration
        }

        hasUpdates = true
        updatedCount += 1

        const shouldUpdateStatus =
          hasStatusPatch && nextStatus !== registration.status

        return {
          ...registration,
          ...patch,
          stageId,
          status: hasStatusPatch ? nextStatus : registration.status,
          statusChangedAt: shouldUpdateStatus ? patch.statusChangedAt || now : registration.statusChangedAt,
          updatedAt: patch.updatedAt || now,
          statusChangedBy: patch.statusChangedBy || statusChangedBy,
        }
      })

    if (hasUpdates) {
      writeRegistrationsByStorageKey(storageKey, nextRegistrations)
    }
  })

  return updatedCount
}

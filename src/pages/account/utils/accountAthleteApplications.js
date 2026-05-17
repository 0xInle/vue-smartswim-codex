import {
  ATHLETE_APPLICATION_STATUS,
  CONSULTATION_STATUS,
} from '@/pages/account/utils/accountConstants'
import { readAccountAthleteSnapshots } from '@/pages/account/utils/accountLocalStorage'

const ACCOUNT_ATHLETE_APPLICATIONS_STORAGE_KEY = 'smartswim:account-athlete-applications:v1'

function resolveCurrentUser(currentUser) {
  return currentUser?.value || currentUser || null
}

function getCurrentUserKey(currentUser) {
  const resolvedUser = resolveCurrentUser(currentUser)

  if (typeof resolvedUser === 'string') {
    return resolvedUser || 'anonymous'
  }

  return resolvedUser?.id || resolvedUser?.email || 'anonymous'
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

function writeJsonStorage(storageKey, value) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value))
  } catch {
    // Ignore temporary storage failures in the local workflow.
  }
}

function getApplicationId({ ownerUserKey, scope, scopeId }) {
  return [ownerUserKey || 'anonymous', scope || 'athlete', scopeId || 'profile'].join(':')
}

function normalizeApplicationStatus(status) {
  const allowedStatuses = new Set([
    ...Object.values(ATHLETE_APPLICATION_STATUS),
    ...Object.values(CONSULTATION_STATUS),
  ])

  if (allowedStatuses.has(status)) {
    return status
  }

  return CONSULTATION_STATUS.NEW
}

function normalizeApplication(record) {
  if (!record || typeof record !== 'object') {
    return null
  }

  const createdAt = record.createdAt || record.updatedAt || new Date().toISOString()

  return {
    id: record.id || getApplicationId(record),
    ownerUserKey: record.ownerUserKey || 'anonymous',
    ownerName: record.ownerName || '',
    ownerEmail: record.ownerEmail || '',
    ownerPhone: record.ownerPhone || '',
    scope: record.scope || 'athlete',
    scopeId: record.scopeId || 'profile',
    participantName: record.participantName || '',
    participantBirthDate: record.participantBirthDate || '',
    participantClub: record.participantClub || '',
    participantKind: record.participantKind || 'athlete',
    status: normalizeApplicationStatus(record.status),
    note: record.note || '',
    updatedAt: record.updatedAt || createdAt,
    updatedBy: record.updatedBy || '',
    createdAt,
  }
}

function getApplicationCreatedAtFromAthlete(athlete) {
  const timestamps = (athlete?.documents || [])
    .flatMap((document) => [document?.uploadedAt, document?.reviewedAt, document?.verifiedAt])
    .filter(Boolean)

  return timestamps[0] || new Date().toISOString()
}

export function getAccountAthleteApplicationId({ ownerUserKey, scope, scopeId }) {
  return getApplicationId({ ownerUserKey, scope, scopeId })
}

export function readAccountAthleteApplications() {
  const records = readJsonStorage(ACCOUNT_ATHLETE_APPLICATIONS_STORAGE_KEY, [])
  const storedRecords = Array.isArray(records) ? records.map(normalizeApplication).filter(Boolean) : []
  const storedIds = new Set(storedRecords.map((record) => record.id))
  const syntheticRecords = readAccountAthleteSnapshots().flatMap((athlete) => {
    const applicationId = getApplicationId({
      ownerUserKey: athlete.ownerUserKey || 'anonymous',
      scope: 'athlete',
      scopeId: athlete.id,
    })

    if (storedIds.has(applicationId)) {
      return []
    }

    return [
      normalizeApplication({
        id: applicationId,
        ownerUserKey: athlete.ownerUserKey || 'anonymous',
        ownerName: athlete.ownerName || '',
        ownerEmail: athlete.ownerEmail || '',
        ownerPhone: athlete.ownerPhone || '',
        scope: 'athlete',
        scopeId: athlete.id,
        participantName: athlete.fullName || '',
        participantBirthDate: athlete.birthDate || '',
        participantClub: athlete.club || '',
        participantKind: 'athlete',
        status: CONSULTATION_STATUS.NEW,
        note: '',
        createdAt: getApplicationCreatedAtFromAthlete(athlete),
        updatedAt: getApplicationCreatedAtFromAthlete(athlete),
      }),
    ]
  })

  return [...storedRecords, ...syntheticRecords].filter(Boolean)
}

export function readAccountAthleteApplication({ ownerUserKey, scope, scopeId }) {
  const applicationId = getApplicationId({ ownerUserKey, scope, scopeId })
  return readAccountAthleteApplications().find((record) => record.id === applicationId) || null
}

export function upsertAccountAthleteApplication(record) {
  const normalizedRecord = normalizeApplication(record)

  if (!normalizedRecord) {
    return null
  }

  const records = readAccountAthleteApplications().filter((item) => item.id !== normalizedRecord.id)
  records.unshift(normalizedRecord)
  writeJsonStorage(ACCOUNT_ATHLETE_APPLICATIONS_STORAGE_KEY, records)
  return normalizedRecord
}

export function removeAccountAthleteApplication({ ownerUserKey, scope, scopeId }) {
  const applicationId = getApplicationId({ ownerUserKey, scope, scopeId })
  const records = readAccountAthleteApplications().filter((record) => record.id !== applicationId)
  writeJsonStorage(ACCOUNT_ATHLETE_APPLICATIONS_STORAGE_KEY, records)
}

export function updateAccountAthleteApplication(
  { ownerUserKey, scope, scopeId },
  patch = {},
  { updatedBy = '' } = {},
) {
  const existingRecord = readAccountAthleteApplication({ ownerUserKey, scope, scopeId })
  const nextRecord = {
    ...existingRecord,
    ownerUserKey,
    scope,
    scopeId,
    ...patch,
    updatedAt: new Date().toISOString(),
    updatedBy: patch.updatedBy || updatedBy || existingRecord?.updatedBy || '',
  }

  return upsertAccountAthleteApplication(nextRecord)
}

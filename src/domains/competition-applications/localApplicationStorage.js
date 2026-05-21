import { normalizeCompetitionApplicationRecord } from './applicationRecords.js'

export const COMPETITION_APPLICATIONS_STORAGE_PREFIX =
  'smartswim:account-competition-registrations:v1'

export function resolveCompetitionApplicationUser(currentUser) {
  return currentUser?.value || currentUser || null
}

export function getCompetitionApplicationUserKey(currentUser) {
  const resolvedUser = resolveCompetitionApplicationUser(currentUser)

  return resolvedUser?.id || resolvedUser?.email || 'anonymous'
}

export function buildCompetitionApplicationsStorageKey(currentUser) {
  return `${COMPETITION_APPLICATIONS_STORAGE_PREFIX}:${getCompetitionApplicationUserKey(currentUser)}`
}

export function buildCompetitionApplicationsStorageKeyFromUserKey(userKey) {
  return `${COMPETITION_APPLICATIONS_STORAGE_PREFIX}:${userKey || 'anonymous'}`
}

export function getCompetitionApplicationsStorageKeys() {
  if (typeof window === 'undefined') {
    return []
  }

  const storagePrefix = `${COMPETITION_APPLICATIONS_STORAGE_PREFIX}:`
  const storageKeys = []

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index)

    if (storageKey && storageKey.startsWith(storagePrefix)) {
      storageKeys.push(storageKey)
    }
  }

  return storageKeys
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
    // Ignore storage quota and serialization failures for the local adapter.
  }
}

export function readCompetitionApplicationsByStorageKey(storageKey, sourceUserKey = '') {
  const parsedApplications = readJsonStorage(storageKey, [])

  if (!Array.isArray(parsedApplications)) {
    return []
  }

  return parsedApplications
    .filter((item) => item && typeof item === 'object')
    .map((item) => normalizeCompetitionApplicationRecord(item, sourceUserKey))
}

export function writeCompetitionApplicationsByStorageKey(storageKey, applications) {
  writeJsonStorage(storageKey, applications)
}

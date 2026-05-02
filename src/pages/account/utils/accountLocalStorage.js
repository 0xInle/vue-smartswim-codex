import { normalizeAccountDocumentsState } from '@/pages/account/utils/accountDocumentTypes'

const ACCOUNT_PROFILE_STORAGE_PREFIX = 'smartswim:account-profile:v2'
const ACCOUNT_ATHLETES_STORAGE_PREFIX = 'smartswim:account-athletes:v1'

function resolveCurrentUser(currentUser) {
  return currentUser?.value || currentUser || null
}

function getCurrentUserKey(currentUser) {
  const resolvedUser = resolveCurrentUser(currentUser)

  return resolvedUser?.id || resolvedUser?.email || 'anonymous'
}

function buildStorageKey(prefix, currentUser) {
  return `${prefix}:${getCurrentUserKey(currentUser)}`
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

export function getAccountProfileStorageKey(currentUser) {
  return buildStorageKey(ACCOUNT_PROFILE_STORAGE_PREFIX, currentUser)
}

export function getAccountAthletesStorageKey(currentUser) {
  return buildStorageKey(ACCOUNT_ATHLETES_STORAGE_PREFIX, currentUser)
}

export function readAccountProfileSnapshot(currentUser) {
  const resolvedUser = resolveCurrentUser(currentUser)
  const fallbackProfile = {
    fullName: resolvedUser?.name || '',
    birthDate: '',
    club: '',
    phone: '',
    email: resolvedUser?.email || '',
  }

  const storageKey = getAccountProfileStorageKey(resolvedUser)
  const parsedProfile = readJsonStorage(storageKey, null)

  if (!parsedProfile || typeof parsedProfile !== 'object') {
    return fallbackProfile
  }

  return {
    fullName: parsedProfile.fullName || fallbackProfile.fullName,
    birthDate: parsedProfile.birthDate || '',
    club: parsedProfile.club || '',
    phone: parsedProfile.phone || '',
    email: parsedProfile.email || fallbackProfile.email,
  }
}

export function readAccountAthletesSnapshot(currentUser) {
  const storageKey = getAccountAthletesStorageKey(currentUser)
  const parsedAthletes = readJsonStorage(storageKey, [])

  if (!Array.isArray(parsedAthletes)) {
    return []
  }

  return parsedAthletes
    .map((athlete, index) => {
      if (!athlete || typeof athlete !== 'object') {
        return null
      }

      return {
        id: athlete.id || `${Date.now()}-${index}`,
        fullName: athlete.fullName || '',
        birthDate: athlete.birthDate || '',
        gender: athlete.gender || '',
        club: athlete.club || '',
        rank: athlete.rank || '',
        coach: athlete.coach || '',
        documents: normalizeAccountDocumentsState(athlete.documents),
      }
    })
    .filter(Boolean)
}


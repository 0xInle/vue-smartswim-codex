import { normalizeAccountDocumentsState } from '@/pages/account/utils/accountDocumentTypes'
import { mergeDocumentsWithReviewRecords } from '@/pages/account/utils/accountDocumentRegistry'

const ACCOUNT_PROFILE_STORAGE_PREFIX = 'smartswim:account-profile:v2'
const ACCOUNT_ATHLETES_STORAGE_PREFIX = 'smartswim:account-athletes:v1'
const ACCOUNT_DOCUMENTS_STORAGE_PREFIX = 'smartswim:account-documents:compact:v1'

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

export function stripAccountDocumentFileData(documents = []) {
  return normalizeAccountDocumentsState(documents).map((document) => ({
    ...document,
    fileDataUrl: '',
  }))
}

export function getAccountProfileStorageKey(currentUser) {
  return buildStorageKey(ACCOUNT_PROFILE_STORAGE_PREFIX, currentUser)
}

export function getAccountAthletesStorageKey(currentUser) {
  return buildStorageKey(ACCOUNT_ATHLETES_STORAGE_PREFIX, currentUser)
}

export function getAccountDocumentsStorageKey(currentUser, scope = 'profile', scopeId = 'profile') {
  return [ACCOUNT_DOCUMENTS_STORAGE_PREFIX, scope, getCurrentUserKey(currentUser), scopeId].join(':')
}

function getLoadedDocumentCount(documents = []) {
  return documents.filter((document) => document?.status && document.status !== 'missing').length
}

export function readAccountDocumentsSnapshot(currentUser, scope = 'profile', scopeId = 'profile') {
  const resolvedUser = resolveCurrentUser(currentUser)
  const storageKey = getAccountDocumentsStorageKey(resolvedUser, scope, scopeId)
  const anonymousStorageKey = [ACCOUNT_DOCUMENTS_STORAGE_PREFIX, scope, 'anonymous', scopeId].join(':')
  const parsedDocuments =
    readJsonStorage(storageKey, null) ||
    (storageKey === anonymousStorageKey ? null : readJsonStorage(anonymousStorageKey, null))

  return mergeDocumentsWithReviewRecords({
    currentUser: resolvedUser,
    scope,
    scopeId,
    documents: Array.isArray(parsedDocuments) ? parsedDocuments : [],
  })
}

export function writeAccountDocumentsSnapshot(
  currentUser,
  documents,
  scope = 'profile',
  scopeId = 'profile',
) {
  if (typeof window === 'undefined') {
    return true
  }

  const resolvedUser = resolveCurrentUser(currentUser)
  const storageKey = getAccountDocumentsStorageKey(resolvedUser, scope, scopeId)

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(stripAccountDocumentFileData(documents)))
    return true
  } catch {
    return false
  }
}

export function readAccountProfileSnapshot(currentUser) {
  const resolvedUser = resolveCurrentUser(currentUser)
  const storedDocuments = readAccountDocumentsSnapshot(resolvedUser, 'profile', 'profile')
  const fallbackProfile = {
    fullName: resolvedUser?.name || '',
    birthDate: '',
    club: '',
    phone: '',
    email: resolvedUser?.email || '',
    documents: storedDocuments,
  }

  const storageKey = getAccountProfileStorageKey(resolvedUser)
  const anonymousStorageKey = `${ACCOUNT_PROFILE_STORAGE_PREFIX}:anonymous`
  const parsedProfile =
    readJsonStorage(storageKey, null) ||
    (storageKey === anonymousStorageKey ? null : readJsonStorage(anonymousStorageKey, null))

  if (!parsedProfile || typeof parsedProfile !== 'object') {
    return fallbackProfile
  }

  return {
    fullName: parsedProfile.fullName || fallbackProfile.fullName,
    birthDate: parsedProfile.birthDate || '',
    club: parsedProfile.club || '',
    phone: parsedProfile.phone || '',
    email: parsedProfile.email || fallbackProfile.email,
    documents: (() => {
      const profileDocuments = mergeDocumentsWithReviewRecords({
        currentUser: resolvedUser,
        scope: 'profile',
        scopeId: 'profile',
        documents: parsedProfile.documents || [],
      })

      return getLoadedDocumentCount(storedDocuments) > getLoadedDocumentCount(profileDocuments)
        ? storedDocuments
        : profileDocuments
    })(),
  }
}

export function writeAccountProfileSnapshot(currentUser, profile) {
  if (typeof window === 'undefined') {
    return true
  }

  const resolvedUser = resolveCurrentUser(currentUser)
  const storageKey = getAccountProfileStorageKey(resolvedUser)
  const normalizedDocuments = stripAccountDocumentFileData(profile?.documents || [])

  try {
    writeAccountDocumentsSnapshot(resolvedUser, normalizedDocuments, 'profile', 'profile')
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        fullName: profile?.fullName || '',
        birthDate: profile?.birthDate || '',
        club: profile?.club || '',
        phone: profile?.phone || '',
        email: profile?.email || resolvedUser?.email || '',
        documents: normalizedDocuments,
      }),
    )
    return true
  } catch {
    // Ignore storage quota and serialization errors in the mock profile snapshot.
    return false
  }
}

export function readAccountAthletesSnapshot(currentUser) {
  const resolvedUser = resolveCurrentUser(currentUser)
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

      const athleteId = athlete.id || `${Date.now()}-${index}`

      return {
        id: athleteId,
        fullName: athlete.fullName || '',
        birthDate: athlete.birthDate || '',
        gender: athlete.gender || '',
        club: athlete.club || '',
        rank: athlete.rank || '',
        coach: athlete.coach || '',
        documents: mergeDocumentsWithReviewRecords({
          currentUser: resolvedUser,
          scope: 'athlete',
          scopeId: athleteId,
          documents: normalizeAccountDocumentsState(athlete.documents),
        }),
      }
    })
    .filter(Boolean)
}

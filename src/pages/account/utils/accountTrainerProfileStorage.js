const ACCOUNT_TRAINER_PROFILE_STORAGE_PREFIX = 'smartswim:account-trainer-profile:v1'

function resolveCurrentUser(currentUser) {
  return currentUser?.value || currentUser || null
}

function getCurrentUserKey(currentUser) {
  const resolvedUser = resolveCurrentUser(currentUser)

  return resolvedUser?.id || resolvedUser?.email || 'anonymous'
}

function buildStorageKey(currentUser) {
  return `${ACCOUNT_TRAINER_PROFILE_STORAGE_PREFIX}:${getCurrentUserKey(currentUser)}`
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

export function readTrainerProfileSnapshot(currentUser) {
  const resolvedUser = resolveCurrentUser(currentUser)
  const storageKey = buildStorageKey(resolvedUser)
  const anonymousStorageKey = `${ACCOUNT_TRAINER_PROFILE_STORAGE_PREFIX}:anonymous`
  const fallbackProfile = {
    fullName: resolvedUser?.name || '',
    birthDate: '',
    phone: resolvedUser?.phone || '',
    email: resolvedUser?.email || '',
  }
  const parsedProfile =
    readJsonStorage(storageKey, null) ||
    (storageKey === anonymousStorageKey ? null : readJsonStorage(anonymousStorageKey, null))

  if (!parsedProfile || typeof parsedProfile !== 'object') {
    return fallbackProfile
  }

  return {
    fullName: parsedProfile.fullName || fallbackProfile.fullName,
    birthDate: parsedProfile.birthDate || '',
    phone: parsedProfile.phone || fallbackProfile.phone,
    email: parsedProfile.email || fallbackProfile.email,
  }
}

export function writeTrainerProfileSnapshot(currentUser, profile) {
  if (typeof window === 'undefined') {
    return true
  }

  const resolvedUser = resolveCurrentUser(currentUser)
  const storageKey = buildStorageKey(resolvedUser)

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        fullName: profile?.fullName || '',
        birthDate: profile?.birthDate || '',
        phone: profile?.phone || '',
        email: profile?.email || resolvedUser?.email || '',
      }),
    )
    return true
  } catch {
    return false
  }
}

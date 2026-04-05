const REGISTERED_USER_STORAGE_KEY = 'smartswim-registered-user'
const REGISTERED_USERS_STORAGE_KEY = 'smartswim-registered-users'

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

export function loadRegisteredUser() {
  if (!canUseStorage()) {
    return null
  }

  const storedValue = window.localStorage.getItem(REGISTERED_USER_STORAGE_KEY)

  if (!storedValue) {
    return null
  }

  try {
    return JSON.parse(storedValue)
  } catch {
    window.localStorage.removeItem(REGISTERED_USER_STORAGE_KEY)
    return null
  }
}

export function saveRegisteredUser(user) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(REGISTERED_USER_STORAGE_KEY, JSON.stringify(user))

  const registeredUsers = loadRegisteredUsers()
  const existingUserIndex = registeredUsers.findIndex(
    (registeredUser) => registeredUser.email === user.email,
  )

  if (existingUserIndex >= 0) {
    registeredUsers[existingUserIndex] = {
      ...registeredUsers[existingUserIndex],
      ...user,
    }
  } else {
    registeredUsers.unshift(user)
  }

  window.localStorage.setItem(REGISTERED_USERS_STORAGE_KEY, JSON.stringify(registeredUsers))
}

export function loadRegisteredUsers() {
  if (!canUseStorage()) {
    return []
  }

  const storedValue = window.localStorage.getItem(REGISTERED_USERS_STORAGE_KEY)

  if (!storedValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(storedValue)
    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue
  } catch {
    window.localStorage.removeItem(REGISTERED_USERS_STORAGE_KEY)
    return []
  }
}

export function getRegisteredUsersSnapshot() {
  const registeredUsers = loadRegisteredUsers()
  const registeredUser = loadRegisteredUser()

  if (!registeredUser) {
    return registeredUsers
  }

  const hasRegisteredUser = registeredUsers.some((user) => user.email === registeredUser.email)

  if (hasRegisteredUser) {
    return registeredUsers
  }

  return [registeredUser, ...registeredUsers]
}

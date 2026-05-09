import { accountMockUsers } from '@/pages/account/accountUsers.data'
import { mergeDocumentsWithReviewRecords } from '@/pages/account/utils/accountDocumentRegistry'
import { createAccountDocumentsState, normalizeAccountDocumentsState } from '@/pages/account/utils/accountDocumentTypes'
import { stripAccountDocumentFileData } from '@/pages/account/utils/accountLocalStorage'
import { formatRussianPhone } from '@/utils/phone'
import { CRM_ROLE } from '@/utils/crmRoles'

const ACCOUNT_USERS_STORAGE_KEY = 'smartswim:account-users:v1'

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

function normalizeUser(user, fallback = null) {
  return {
    id: user?.id || fallback?.id || '',
    name: user?.name || fallback?.name || '',
    email: user?.email || fallback?.email || '',
    phone: formatRussianPhone(user?.phone || fallback?.phone || ''),
    role: user?.role || fallback?.role || CRM_ROLE.USER,
    status: user?.status || fallback?.status || 'paid',
    registeredAt: user?.registeredAt || fallback?.registeredAt || null,
    documents: normalizeAccountDocumentsState(user?.documents || fallback?.documents || createAccountDocumentsState()),
  }
}

export function readAccountUsersSnapshot() {
  const parsedUsers = readJsonStorage(ACCOUNT_USERS_STORAGE_KEY, null)

  if (!Array.isArray(parsedUsers)) {
    return accountMockUsers.map((user) => {
      const documents = mergeDocumentsWithReviewRecords({
        currentUser: user,
        scope: 'user',
        scopeId: user.id,
        documents: createAccountDocumentsState(),
      })

      return {
        ...user,
        documents,
      }
    })
  }

  return parsedUsers
    .map((user) => {
      const seedUser = accountMockUsers.find((item) => item.id === user?.id) || null

      const normalizedUser = normalizeUser(user, seedUser)

      return {
        ...normalizedUser,
        documents: mergeDocumentsWithReviewRecords({
          currentUser: normalizedUser,
          scope: 'user',
          scopeId: normalizedUser.id,
          documents: normalizedUser.documents,
        }),
      }
    })
    .filter((user) => Boolean(user.id))
}

export function writeAccountUsersSnapshot(users) {
  if (typeof window === 'undefined') {
    return true
  }

  try {
    const normalizedUsers = Array.isArray(users)
      ? users.map((user) => ({
          ...normalizeUser(user),
          documents: stripAccountDocumentFileData(user?.documents || []),
        }))
      : []

    window.localStorage.setItem(ACCOUNT_USERS_STORAGE_KEY, JSON.stringify(normalizedUsers))
    return true
  } catch {
    return false
  }
}

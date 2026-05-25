import { createAccountDocumentsState, normalizeAccountDocumentsState } from '@/pages/account/utils/accountDocumentTypes'
import {
  deleteCrmUserForAdmin,
  fetchAllCrmUsersForAdmin,
  mergeCrmUserWithProfile,
  subscribeToCrmUsers,
  updateCrmUserForAdmin,
} from './supabaseAccountUsersAdapter.js'
import {
  loadAllAccountAthletesForAdmin,
  loadAllAccountProfilesForAdmin,
} from '@/domains/account-data/accountDataRepository'
import { loadAllAccountDocumentReviewsForAdmin } from '@/domains/account-documents/documentRepository'
import { refreshAllAccountAdmissionWorkflowForStaff } from '@/pages/account/utils/accountAdmissions'

function groupByOwnerAndScope(documents = []) {
  return documents.reduce((acc, document) => {
    const ownerUserKey = document.ownerUserKey || document.ownerUserId || ''
    const scope = document.scope || 'profile'
    const scopeId = document.scopeId || 'profile'
    const key = [ownerUserKey, scope, scopeId].join(':')

    if (!acc.has(key)) {
      acc.set(key, [])
    }

    acc.get(key).push(document)
    return acc
  }, new Map())
}

function getDocumentsForScope(documentsByScope, { ownerUserId, scope, scopeId }) {
  const key = [ownerUserId || '', scope || 'profile', scopeId || 'profile'].join(':')

  return normalizeAccountDocumentsState(documentsByScope.get(key) || createAccountDocumentsState())
}

export async function loadAllAccountUsersForAdmin() {
  const [crmUsers, profiles, athletes, documents] = await Promise.all([
    fetchAllCrmUsersForAdmin(),
    loadAllAccountProfilesForAdmin(),
    loadAllAccountAthletesForAdmin(),
    loadAllAccountDocumentReviewsForAdmin(),
    refreshAllAccountAdmissionWorkflowForStaff(),
  ])
  const profilesByOwner = new Map(profiles.map((profile) => [profile.ownerUserId, profile]))
  const documentsByScope = groupByOwnerAndScope(documents)

  return crmUsers.map((user) => {
    const profile = profilesByOwner.get(user.id) || null
    const mergedUser = mergeCrmUserWithProfile(user, profile)
    const userAthletes = athletes
      .filter((athlete) => athlete.ownerUserId === user.id)
      .map((athlete) => ({
        ...athlete,
        documents: getDocumentsForScope(documentsByScope, {
          ownerUserId: user.id,
          scope: 'athlete',
          scopeId: athlete.id,
        }),
      }))

    return {
      ...mergedUser,
      documents: getDocumentsForScope(documentsByScope, {
        ownerUserId: user.id,
        scope: 'profile',
        scopeId: 'profile',
      }),
      athletes: userAthletes,
    }
  })
}

export async function saveAccountUserForAdmin(userId, patch = {}) {
  return updateCrmUserForAdmin(userId, patch)
}

export async function removeAccountUserFromCrmForAdmin(userId) {
  return deleteCrmUserForAdmin(userId)
}

export function subscribeToAccountUsersChanges(callback) {
  return subscribeToCrmUsers(callback)
}

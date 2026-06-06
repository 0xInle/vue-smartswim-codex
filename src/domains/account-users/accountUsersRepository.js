import { createAccountDocumentsState, normalizeAccountDocumentsState } from '@/pages/account/utils/accountDocumentTypes'
import { CRM_ROLE } from '@/utils/crmRoles'
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

function createAthleteCrmRow({ athlete, owner, documents }) {
  return {
    id: `athlete:${athlete.id}`,
    athleteId: athlete.id,
    ownerUserId: owner.id,
    ownerName: owner.name || owner.email || '',
    ownerEmail: owner.email || '',
    ownerPhone: owner.phone || '',
    isAthleteRecord: true,
    email: owner.email || '',
    name: athlete.fullName || 'Спортсмен без имени',
    phone: owner.phone || '',
    birthDate: athlete.birthDate || '',
    club: athlete.club || '',
    gender: athlete.gender || '',
    rank: athlete.rank || '',
    coach: athlete.coach || '',
    role: CRM_ROLE.ATHLETE,
    status: owner.status || 'paid',
    registeredAt: athlete.createdAt || owner.registeredAt || null,
    documents,
    athletes: [],
  }
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

  return crmUsers.flatMap((user) => {
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

    const userRow = {
      ...mergedUser,
      documents: getDocumentsForScope(documentsByScope, {
        ownerUserId: user.id,
        scope: 'profile',
        scopeId: 'profile',
      }),
      athletes: userAthletes,
    }

    const athleteRows = userAthletes.map((athlete) =>
      createAthleteCrmRow({
        athlete,
        owner: mergedUser,
        documents: athlete.documents,
      }),
    )

    return [userRow, ...athleteRows]
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

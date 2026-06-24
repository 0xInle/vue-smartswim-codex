import { isApplicationStatusActive } from './applicationLifecycle.js'
import {
  createCompetitionApplicationRecord,
  getCompetitionApplicationStageNumber,
  resolveCompetitionApplicationStageId,
} from './applicationRecords.js'
import {
  createSupabaseCompetitionApplication,
  deleteSupabaseCompetitionApplication,
  countActiveCompetitionApplicationsByStageId,
  fetchAllCompetitionApplicationsForAdmin,
  fetchCompetitionApplicationStageRefsForAdmin,
  fetchLatestCompetitionApplicationsForAdmin,
  fetchCompetitionApplicationsForCurrentUser,
  searchCompetitionApplicationsPageForAdmin,
  subscribeToCompetitionApplications,
  updateSupabaseCompetitionApplication,
} from './supabaseApplicationAdapter.js'

export {
  createCompetitionApplicationId,
  createCompetitionApplicationRecord,
  getCompetitionApplicationStageNumber,
  resolveCompetitionApplicationStageId,
} from './applicationRecords.js'

function countApplicationsByStageId(applications, stageId, { status = 'active' } = {}) {
  if (!stageId) {
    return 0
  }

  return applications.filter((application) => {
    if (application.stageId !== stageId) {
      return false
    }

    if (status === 'all') {
      return true
    }

    if (status === 'active') {
      return isApplicationStatusActive(application.status)
    }

    return application.status === status
  }).length
}

function countApplicationsForParticipant(
  applications,
  { participantKind = '', participantId = '', status = 'active' } = {},
) {
  if (!participantKind || !participantId) {
    return 0
  }

  return applications.filter((application) => {
    if (
      application.participantKind !== participantKind ||
      application.participantId !== participantId
    ) {
      return false
    }

    if (status === 'all') {
      return true
    }

    if (status === 'active') {
      return isApplicationStatusActive(application.status)
    }

    return application.status === status
  }).length
}

function getApplicationStageNumber(application = {}) {
  const stageIdMatch = String(application.stageId || '').match(/stage-(\d+)$/)

  if (stageIdMatch) {
    return Number(stageIdMatch[1]) || null
  }

  const stageLabelMatch = String(application.stageLabel || '').match(/\d+/)

  return stageLabelMatch ? Number(stageLabelMatch[0]) || null : null
}

function applicationMatchesStagePatch(application = {}, stageId = '', patch = {}) {
  if (application.stageId === stageId) {
    return true
  }

  if (!patch.competitionName || application.competitionName !== patch.competitionName) {
    return false
  }

  return getApplicationStageNumber(application) === getApplicationStageNumber({ stageId })
}

export async function countCompetitionApplicationsByStageIdFromSource(
  stageId,
  { status = 'active' } = {},
) {
  if (status === 'active') {
    return countActiveCompetitionApplicationsByStageId(stageId)
  }

  const applications = await fetchAllCompetitionApplicationsForAdmin()

  return countApplicationsByStageId(applications, stageId, { status })
}

export async function updateCompetitionApplicationStatus(
  currentUser,
  applicationId,
  status,
  { statusChangedBy = 'user' } = {},
) {
  return patchCompetitionApplication(currentUser, applicationId, { status }, { statusChangedBy })
}

export async function loadCompetitionApplicationsForCurrentUser(_currentUser) {
  return fetchCompetitionApplicationsForCurrentUser()
}

export async function loadAllCompetitionApplicationsForAdmin() {
  return fetchAllCompetitionApplicationsForAdmin()
}

export async function loadCompetitionApplicationStageRefsForAdmin() {
  return fetchCompetitionApplicationStageRefsForAdmin()
}

export async function loadLatestCompetitionApplicationsForAdmin(params = {}) {
  return fetchLatestCompetitionApplicationsForAdmin(params)
}

export async function searchCompetitionApplicationsListPageForAdmin(params = {}) {
  return searchCompetitionApplicationsPageForAdmin(params)
}

export async function createCompetitionApplication(currentUser, application) {
  return createSupabaseCompetitionApplication(application)
}

export async function patchCompetitionApplication(
  currentUser,
  applicationId,
  patch = {},
  { statusChangedBy = 'user' } = {},
) {
  return updateSupabaseCompetitionApplication(applicationId, {
    ...patch,
    statusChangedBy: patch.statusChangedBy || statusChangedBy,
  })
}

export async function patchCompetitionApplicationByUserKey(
  userKey,
  applicationId,
  patch = {},
  { statusChangedBy = 'admin' } = {},
) {
  return updateSupabaseCompetitionApplication(applicationId, {
    ...patch,
    statusChangedBy: patch.statusChangedBy || statusChangedBy,
  })
}

export async function deleteCompetitionApplication(currentUser, applicationId) {
  return deleteSupabaseCompetitionApplication(applicationId)
}

export function subscribeToCompetitionApplicationChanges(callback) {
  return subscribeToCompetitionApplications(callback)
}

export async function updateCompetitionApplicationsByStageIdFromSource(
  stageId,
  patch = {},
  { statusChangedBy = 'admin' } = {},
) {
  if (!stageId) {
    return 0
  }

  const applications = await fetchAllCompetitionApplicationsForAdmin()
  const targetApplications = applications.filter((application) =>
    applicationMatchesStagePatch(application, stageId, patch),
  )

  await Promise.all(
    targetApplications.map((application) =>
      updateSupabaseCompetitionApplication(application.id, {
        ...patch,
        stageId,
        statusChangedBy: patch.statusChangedBy || statusChangedBy,
      }),
    )
  )

  return targetApplications.length
}

export async function countCompetitionApplicationsForParticipantFromSource(
  currentUser,
  { participantKind = '', participantId = '', status = 'active' } = {},
) {
  const applications = await fetchCompetitionApplicationsForCurrentUser()

  return countApplicationsForParticipant(applications, { participantKind, participantId, status })
}

export async function syncCompetitionApplicationOwnerSnapshotFromSource(_currentUser, _profile = {}) {
  return 0
}

export async function syncCompetitionApplicationAthleteSnapshotFromSource(
  _currentUser,
  _athlete = {},
) {
  return 0
}

import {
  countCompetitionApplicationsByStageIdFromSource,
  countCompetitionApplicationsForParticipantFromSource,
  createCompetitionApplication,
  createCompetitionApplicationId,
  createCompetitionApplicationRecord,
  deleteCompetitionApplication,
  getCompetitionApplicationStageNumber,
  loadCompetitionApplicationStageRefsForAdmin,
  loadAllCompetitionApplicationsForAdmin,
  loadLatestCompetitionApplicationsForAdmin,
  loadCompetitionApplicationsForCurrentUser,
  patchCompetitionApplication,
  patchCompetitionApplicationByUserKey,
  resolveCompetitionApplicationStageId,
  subscribeToCompetitionApplicationChanges,
  syncCompetitionApplicationAthleteSnapshotFromSource,
  syncCompetitionApplicationOwnerSnapshotFromSource,
  updateCompetitionApplicationsByStageIdFromSource,
} from '@/domains/competition-applications/applicationRepository'

export const createCompetitionRegistrationId = createCompetitionApplicationId
export const getCompetitionCardStageNumber = getCompetitionApplicationStageNumber
export const resolveCompetitionStageId = resolveCompetitionApplicationStageId
export const countCompetitionRegistrationsByStageIdFromSource =
  countCompetitionApplicationsByStageIdFromSource
export const createCompetitionRegistrationRecord = createCompetitionApplicationRecord
export const countCompetitionRegistrationsForParticipantFromSource =
  countCompetitionApplicationsForParticipantFromSource
export const syncCompetitionRegistrationOwnerSnapshotFromSource =
  syncCompetitionApplicationOwnerSnapshotFromSource
export const syncCompetitionRegistrationAthleteSnapshotFromSource =
  syncCompetitionApplicationAthleteSnapshotFromSource
export const updateCompetitionRegistrationsByStageIdFromSource =
  updateCompetitionApplicationsByStageIdFromSource
export const loadCompetitionRegistrationsForCurrentUser =
  loadCompetitionApplicationsForCurrentUser
export const loadAllCompetitionRegistrationsForAdmin = loadAllCompetitionApplicationsForAdmin
export const loadCompetitionRegistrationStageRefsForAdmin =
  loadCompetitionApplicationStageRefsForAdmin
export const loadLatestCompetitionRegistrationsForAdmin =
  loadLatestCompetitionApplicationsForAdmin
export const createCompetitionRegistration = createCompetitionApplication
export const patchCompetitionRegistration = patchCompetitionApplication
export const patchCompetitionRegistrationByUserKey = patchCompetitionApplicationByUserKey
export const deleteCompetitionRegistration = deleteCompetitionApplication
export const subscribeToCompetitionRegistrationChanges = subscribeToCompetitionApplicationChanges

export function buildCompetitionAccountRoute({ competitionSlug = '', stageId = '' } = {}) {
  const url = new URL(import.meta.env.BASE_URL || '/', window.location.origin)
  url.pathname = `${url.pathname.replace(/\/$/, '')}/account`.replace(/\/+/g, '/')
  url.searchParams.set('section', 'competitions')

  if (competitionSlug) {
    url.searchParams.set('competitionSlug', competitionSlug)
  }

  if (stageId) {
    url.searchParams.set('stageId', stageId)
  }

  return `${url.pathname}${url.search}`
}

import {
  countCompetitionApplicationsByStageId,
  countCompetitionApplicationsByStageIdFromSource,
  countCompetitionApplicationsForParticipant,
  countCompetitionApplicationsForParticipantFromSource,
  createCompetitionApplication,
  createCompetitionApplicationId,
  createCompetitionApplicationRecord,
  getCompetitionApplicationStageNumber,
  loadAllCompetitionApplicationsForAdmin,
  loadCompetitionApplicationsForCurrentUser,
  patchCompetitionApplication,
  patchCompetitionApplicationByUserKey,
  persistCompetitionApplications,
  persistCompetitionApplicationsByUserKey,
  readAllCompetitionApplications,
  readCompetitionApplications,
  resolveCompetitionApplicationStageId,
  subscribeToCompetitionApplicationChanges,
  syncCompetitionApplicationAthleteSnapshot,
  syncCompetitionApplicationAthleteSnapshotFromSource,
  syncCompetitionApplicationOwnerSnapshot,
  syncCompetitionApplicationOwnerSnapshotFromSource,
  updateCompetitionApplication,
  updateCompetitionApplicationByUserKey,
  updateCompetitionApplicationStatus,
  updateCompetitionApplicationsByStageId,
  updateCompetitionApplicationsByStageIdFromSource,
} from '@/domains/competition-applications/applicationRepository'

export const createCompetitionRegistrationId = createCompetitionApplicationId
export const getCompetitionCardStageNumber = getCompetitionApplicationStageNumber
export const resolveCompetitionStageId = resolveCompetitionApplicationStageId
export const readCompetitionRegistrations = readCompetitionApplications
export const readAllCompetitionRegistrations = readAllCompetitionApplications
export const countCompetitionRegistrationsByStageId = countCompetitionApplicationsByStageId
export const countCompetitionRegistrationsByStageIdFromSource =
  countCompetitionApplicationsByStageIdFromSource
export const persistCompetitionRegistrations = persistCompetitionApplications
export const persistCompetitionRegistrationsByUserKey = persistCompetitionApplicationsByUserKey
export const createCompetitionRegistrationRecord = createCompetitionApplicationRecord
export const updateCompetitionRegistration = updateCompetitionApplication
export const countCompetitionRegistrationsForParticipant =
  countCompetitionApplicationsForParticipant
export const countCompetitionRegistrationsForParticipantFromSource =
  countCompetitionApplicationsForParticipantFromSource
export const syncCompetitionRegistrationOwnerSnapshot = syncCompetitionApplicationOwnerSnapshot
export const syncCompetitionRegistrationOwnerSnapshotFromSource =
  syncCompetitionApplicationOwnerSnapshotFromSource
export const syncCompetitionRegistrationAthleteSnapshot = syncCompetitionApplicationAthleteSnapshot
export const syncCompetitionRegistrationAthleteSnapshotFromSource =
  syncCompetitionApplicationAthleteSnapshotFromSource
export const updateCompetitionRegistrationStatus = updateCompetitionApplicationStatus
export const updateCompetitionRegistrationByUserKey = updateCompetitionApplicationByUserKey
export const updateCompetitionRegistrationsByStageId = updateCompetitionApplicationsByStageId
export const updateCompetitionRegistrationsByStageIdFromSource =
  updateCompetitionApplicationsByStageIdFromSource
export const loadCompetitionRegistrationsForCurrentUser =
  loadCompetitionApplicationsForCurrentUser
export const loadAllCompetitionRegistrationsForAdmin = loadAllCompetitionApplicationsForAdmin
export const createCompetitionRegistration = createCompetitionApplication
export const patchCompetitionRegistration = patchCompetitionApplication
export const patchCompetitionRegistrationByUserKey = patchCompetitionApplicationByUserKey
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

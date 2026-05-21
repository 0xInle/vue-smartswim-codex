import {
  countCompetitionApplicationsByStageId,
  countCompetitionApplicationsForParticipant,
  createCompetitionApplicationId,
  createCompetitionApplicationRecord,
  getCompetitionApplicationStageNumber,
  persistCompetitionApplications,
  persistCompetitionApplicationsByUserKey,
  readAllCompetitionApplications,
  readCompetitionApplications,
  resolveCompetitionApplicationStageId,
  syncCompetitionApplicationAthleteSnapshot,
  syncCompetitionApplicationOwnerSnapshot,
  updateCompetitionApplication,
  updateCompetitionApplicationByUserKey,
  updateCompetitionApplicationStatus,
  updateCompetitionApplicationsByStageId,
} from '@/domains/competition-applications/applicationRepository'

export const createCompetitionRegistrationId = createCompetitionApplicationId
export const getCompetitionCardStageNumber = getCompetitionApplicationStageNumber
export const resolveCompetitionStageId = resolveCompetitionApplicationStageId
export const readCompetitionRegistrations = readCompetitionApplications
export const readAllCompetitionRegistrations = readAllCompetitionApplications
export const countCompetitionRegistrationsByStageId = countCompetitionApplicationsByStageId
export const persistCompetitionRegistrations = persistCompetitionApplications
export const persistCompetitionRegistrationsByUserKey = persistCompetitionApplicationsByUserKey
export const createCompetitionRegistrationRecord = createCompetitionApplicationRecord
export const updateCompetitionRegistration = updateCompetitionApplication
export const countCompetitionRegistrationsForParticipant =
  countCompetitionApplicationsForParticipant
export const syncCompetitionRegistrationOwnerSnapshot = syncCompetitionApplicationOwnerSnapshot
export const syncCompetitionRegistrationAthleteSnapshot = syncCompetitionApplicationAthleteSnapshot
export const updateCompetitionRegistrationStatus = updateCompetitionApplicationStatus
export const updateCompetitionRegistrationByUserKey = updateCompetitionApplicationByUserKey
export const updateCompetitionRegistrationsByStageId = updateCompetitionApplicationsByStageId

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

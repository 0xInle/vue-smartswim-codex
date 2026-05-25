import {
  deleteCompetitionStage,
  fetchCompetitionCatalog,
  patchCompetitionStage,
  replaceCompetitionStageDistances,
  subscribeToCompetitionCatalog,
  updateCompetitionTitle,
  upsertCompetition,
  upsertCompetitionStage,
} from './supabaseCompetitionCatalogAdapter.js'

export async function loadCompetitionCatalog() {
  return fetchCompetitionCatalog()
}

export async function saveCompetitionCatalogCompetition(competition = {}) {
  return upsertCompetition(competition)
}

export async function saveCompetitionCatalogCompetitionTitle(competitionId, title) {
  return updateCompetitionTitle(competitionId, title)
}

export async function saveCompetitionCatalogStage(stage = {}) {
  return upsertCompetitionStage(stage)
}

export async function updateCompetitionCatalogStage(stageId, patch = {}) {
  return patchCompetitionStage(stageId, patch)
}

export async function updateCompetitionCatalogStageDistances(stageId, description = '') {
  await patchCompetitionStage(stageId, { description })
  return replaceCompetitionStageDistances(stageId, description)
}

export async function removeCompetitionCatalogStage(stageId) {
  return deleteCompetitionStage(stageId)
}

export function subscribeToCompetitionCatalogChanges(callback) {
  return subscribeToCompetitionCatalog(callback)
}

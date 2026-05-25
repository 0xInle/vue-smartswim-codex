import { reactive } from 'vue'
import {
  loadCompetitionCatalog,
  removeCompetitionCatalogStage,
  saveCompetitionCatalogCompetition,
  saveCompetitionCatalogCompetitionTitle,
  saveCompetitionCatalogStage,
  subscribeToCompetitionCatalogChanges,
  updateCompetitionCatalogStage,
  updateCompetitionCatalogStageDistances,
} from '@/domains/competition-catalog/competitionCatalogRepository'

export const competitionDirections = reactive([])

let catalogLoadRequestId = 0

function replaceCompetitionDirectionsState(nextState = []) {
  competitionDirections.splice(0, competitionDirections.length, ...nextState)
}

export async function refreshCompetitionDirectionsFromSource() {
  const requestId = catalogLoadRequestId + 1
  catalogLoadRequestId = requestId

  try {
    const nextCatalog = await loadCompetitionCatalog()

    if (requestId === catalogLoadRequestId) {
      replaceCompetitionDirectionsState(nextCatalog)
    }
  } catch {
    if (requestId === catalogLoadRequestId) {
      replaceCompetitionDirectionsState([])
    }
  }
}

export async function saveCompetitionDirectionToSource(competition) {
  await saveCompetitionCatalogCompetition(competition)
  await refreshCompetitionDirectionsFromSource()
}

export async function saveCompetitionDirectionTitleToSource(competitionSlug, title) {
  await saveCompetitionCatalogCompetitionTitle(competitionSlug, title)
  await refreshCompetitionDirectionsFromSource()
}

export async function saveCompetitionStageToSource(stage) {
  await saveCompetitionCatalogStage(stage)
  await refreshCompetitionDirectionsFromSource()
}

export async function patchCompetitionStageInSource(stageId, patch) {
  await updateCompetitionCatalogStage(stageId, patch)
  await refreshCompetitionDirectionsFromSource()
}

export async function saveCompetitionStageDistancesToSource(stageId, description) {
  await updateCompetitionCatalogStageDistances(stageId, description)
  await refreshCompetitionDirectionsFromSource()
}

export async function deleteCompetitionStageFromSource(stageId) {
  await removeCompetitionCatalogStage(stageId)
  await refreshCompetitionDirectionsFromSource()
}

try {
  void refreshCompetitionDirectionsFromSource()

  subscribeToCompetitionCatalogChanges(() => {
    void refreshCompetitionDirectionsFromSource()
  })
} catch {
  replaceCompetitionDirectionsState([])
}

export function getCompetitionBySlug(slug) {
  return competitionDirections.find((item) => item.slug === slug)
}

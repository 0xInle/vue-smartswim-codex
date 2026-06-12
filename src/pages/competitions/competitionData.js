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
let catalogLoadPromise = null
let catalogSubscriptionStop = null
let ignoreCatalogRealtimeUntil = 0
const LOCAL_CATALOG_REALTIME_ECHO_SUPPRESSION_MS = 5000

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

export function ensureCompetitionDirectionsLoaded() {
  if (competitionDirections.length) {
    return Promise.resolve(competitionDirections)
  }

  if (!catalogLoadPromise) {
    catalogLoadPromise = refreshCompetitionDirectionsFromSource().finally(() => {
      catalogLoadPromise = null
    })
  }

  return catalogLoadPromise
}

export function startCompetitionDirectionsRealtime() {
  if (catalogSubscriptionStop) {
    return catalogSubscriptionStop
  }

  catalogSubscriptionStop = subscribeToCompetitionCatalogChanges(() => {
    if (Date.now() < ignoreCatalogRealtimeUntil) {
      return
    }

    void refreshCompetitionDirectionsFromSource()
  })

  return catalogSubscriptionStop
}

export function stopCompetitionDirectionsRealtime() {
  if (!catalogSubscriptionStop) {
    return
  }

  catalogSubscriptionStop()
  catalogSubscriptionStop = null
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

export async function patchCompetitionStageInSource(stageId, patch, { refresh = true } = {}) {
  if (!refresh) {
    ignoreCatalogRealtimeUntil = Date.now() + LOCAL_CATALOG_REALTIME_ECHO_SUPPRESSION_MS
  }

  await updateCompetitionCatalogStage(stageId, patch)

  if (refresh) {
    await refreshCompetitionDirectionsFromSource()
  }
}

export async function saveCompetitionStageDistancesToSource(stageId, description) {
  await updateCompetitionCatalogStageDistances(stageId, description)
  await refreshCompetitionDirectionsFromSource()
}

export async function deleteCompetitionStageFromSource(stageId) {
  await removeCompetitionCatalogStage(stageId)
  await refreshCompetitionDirectionsFromSource()
}

export function getCompetitionBySlug(slug) {
  return competitionDirections.find((item) => item.slug === slug)
}

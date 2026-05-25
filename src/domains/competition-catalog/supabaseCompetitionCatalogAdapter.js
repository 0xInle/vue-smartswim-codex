import {
  mapCompetitionUpsertPayload,
  mapNormalizedCompetitionCatalog,
  mapStageUpsertPayload,
  splitStageDescriptionToDistanceRows,
} from './competitionCatalogMappers.js'
import { getCurrentSession } from '@/utils/supabaseAuth'
import { getSupabaseClient } from '@/utils/supabaseClient'
import { getUserFacingErrorMessage } from '@/utils/userFacingErrors'

const COMPETITIONS_TABLE = 'competitions'
const COMPETITION_STAGES_TABLE = 'competition_stages'
const COMPETITION_STAGE_DISTANCES_TABLE = 'competition_stage_distances'
const COMPETITION_REGISTRATION_OPTIONS_TABLE = 'competition_registration_options'
const COMPETITION_FAQ_SECTIONS_TABLE = 'competition_faq_sections'
const COMPETITION_FAQ_ITEMS_TABLE = 'competition_faq_items'
const COMPETITION_CATALOG_SQL_PATH = 'supabase/competition_catalog_normalized.sql'
let competitionCatalogSubscriptionId = 0

const COMPETITION_SELECT = [
  'id',
  'slug',
  'badge',
  'title',
  'subtitle',
  'summary',
  'description',
  'location',
  'season',
  'image_url',
  'image_alt',
  'registration_status',
  'registration_closed_title',
  'registration_closed_text',
  'position_url',
  'documents_route',
  'sort_order',
].join(',')

const STAGE_SELECT = [
  'id',
  'competition_id',
  'stage_number',
  'title',
  'date_label',
  'stage_date',
  'place',
  'meta',
  'description',
  'status',
  'protocol_url',
  'photo_url',
  'registration_status',
  'registration_open_at',
  'registration_close_at',
  'registration_open_date_label',
  'registration_close_date_label',
  'registration_competition_date_label',
  'registration_close_note',
  'registration_closed_title',
  'registration_closed_text',
  'is_public',
  'sort_order',
].join(',')

function toMissingCatalogTableError(tableName) {
  return `Каталог соревнований недоступен: таблица ${tableName} не найдена. Выполните SQL из файла ${COMPETITION_CATALOG_SQL_PATH} в Supabase SQL Editor.`
}

function isMissingCatalogTableError(error, tableName) {
  if (!error) {
    return false
  }

  return (
    error.code === '42P01' ||
    new RegExp(`relation .*${tableName}.* does not exist`, 'i').test(error.message || '') ||
    new RegExp(`table .*${tableName}.* not found`, 'i').test(error.message || '')
  )
}

function throwCompetitionCatalogError(error, tableName, fallback) {
  if (isMissingCatalogTableError(error, tableName)) {
    throw new Error(toMissingCatalogTableError(tableName))
  }

  throw new Error(getUserFacingErrorMessage(error, fallback))
}

async function requireCurrentSession(message) {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error(message)
  }

  return session
}

async function fetchTable(tableName, select, orderColumn = 'sort_order') {
  const { data, error } = await getSupabaseClient()
    .from(tableName)
    .select(select)
    .order(orderColumn, { ascending: true })

  if (error) {
    throwCompetitionCatalogError(error, tableName, 'Не удалось загрузить каталог соревнований.')
  }

  return data ?? []
}

export async function fetchCompetitionCatalog() {
  const [
    competitions,
    stages,
    distances,
    options,
    faqSections,
    faqItems,
  ] = await Promise.all([
    fetchTable(COMPETITIONS_TABLE, COMPETITION_SELECT),
    fetchTable(COMPETITION_STAGES_TABLE, STAGE_SELECT),
    fetchTable(COMPETITION_STAGE_DISTANCES_TABLE, '*'),
    fetchTable(COMPETITION_REGISTRATION_OPTIONS_TABLE, '*'),
    fetchTable(COMPETITION_FAQ_SECTIONS_TABLE, '*'),
    fetchTable(COMPETITION_FAQ_ITEMS_TABLE, '*'),
  ])

  return mapNormalizedCompetitionCatalog({
    competitions,
    stages,
    distances,
    options,
    faqSections,
    faqItems,
  })
}

export async function upsertCompetition(competition = {}) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')
  const payload = mapCompetitionUpsertPayload(competition)

  const { error } = await getSupabaseClient()
    .from(COMPETITIONS_TABLE)
    .upsert(payload, { onConflict: 'id' })

  if (error) {
    throwCompetitionCatalogError(error, COMPETITIONS_TABLE, 'Не удалось сохранить соревнование.')
  }
}

export async function updateCompetitionTitle(competitionId, title) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { error } = await getSupabaseClient()
    .from(COMPETITIONS_TABLE)
    .update({ title: title || '' })
    .eq('id', competitionId)

  if (error) {
    throwCompetitionCatalogError(error, COMPETITIONS_TABLE, 'Не удалось обновить соревнование.')
  }
}

export async function upsertCompetitionStage(stage = {}) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')
  const payload = mapStageUpsertPayload(stage)

  const { error } = await getSupabaseClient()
    .from(COMPETITION_STAGES_TABLE)
    .upsert(payload, { onConflict: 'id' })

  if (error) {
    throwCompetitionCatalogError(error, COMPETITION_STAGES_TABLE, 'Не удалось сохранить этап.')
  }

  await replaceCompetitionStageDistances(payload.id, payload.description)
}

export async function patchCompetitionStage(stageId, patch = {}) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { error } = await getSupabaseClient()
    .from(COMPETITION_STAGES_TABLE)
    .update(patch)
    .eq('id', stageId)

  if (error) {
    throwCompetitionCatalogError(error, COMPETITION_STAGES_TABLE, 'Не удалось обновить этап.')
  }
}

export async function replaceCompetitionStageDistances(stageId, description = '') {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const client = getSupabaseClient()
  const { error: deleteError } = await client
    .from(COMPETITION_STAGE_DISTANCES_TABLE)
    .delete()
    .eq('stage_id', stageId)

  if (deleteError) {
    throwCompetitionCatalogError(
      deleteError,
      COMPETITION_STAGE_DISTANCES_TABLE,
      'Не удалось обновить дистанции этапа.',
    )
  }

  const distanceRows = splitStageDescriptionToDistanceRows(stageId, description)

  if (!distanceRows.length) {
    return
  }

  const { error: insertError } = await client
    .from(COMPETITION_STAGE_DISTANCES_TABLE)
    .upsert(distanceRows, { onConflict: 'id' })

  if (insertError) {
    throwCompetitionCatalogError(
      insertError,
      COMPETITION_STAGE_DISTANCES_TABLE,
      'Не удалось сохранить дистанции этапа.',
    )
  }
}

export async function deleteCompetitionStage(stageId) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { error } = await getSupabaseClient()
    .from(COMPETITION_STAGES_TABLE)
    .delete()
    .eq('id', stageId)

  if (error) {
    throwCompetitionCatalogError(error, COMPETITION_STAGES_TABLE, 'Не удалось удалить этап.')
  }
}

export function subscribeToCompetitionCatalog(callback) {
  const client = getSupabaseClient()
  competitionCatalogSubscriptionId += 1

  const channel = client
    .channel(`competition-catalog-normalized-feed-${competitionCatalogSubscriptionId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: COMPETITIONS_TABLE }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: COMPETITION_STAGES_TABLE }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: COMPETITION_STAGE_DISTANCES_TABLE }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: COMPETITION_REGISTRATION_OPTIONS_TABLE }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: COMPETITION_FAQ_SECTIONS_TABLE }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: COMPETITION_FAQ_ITEMS_TABLE }, callback)
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

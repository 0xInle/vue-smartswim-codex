import {
  mapCompetitionApplicationInsertPayload,
  mapCompetitionApplicationUpdatePayload,
  mapSupabaseCompetitionApplicationRow,
} from './supabaseApplicationMapper.js'
import { getCurrentSession } from '@/utils/supabaseAuth'
import { getSupabaseClient } from '@/utils/supabaseClient'
import { getUserFacingErrorMessage } from '@/utils/userFacingErrors'

const COMPETITION_APPLICATIONS_TABLE = 'competition_applications'
const COMPETITION_APPLICATIONS_SQL_PATH = 'supabase/competition_applications.sql'
let competitionApplicationsSubscriptionId = 0
const COMPETITION_APPLICATION_UPDATE_NOT_ALLOWED_MESSAGE =
  'Заявку не удалось обновить. Проверьте права доступа или текущий статус заявки.'
const COMPETITION_APPLICATION_SELECT = [
  'id',
  'owner_user_id',
  'owner_email',
  'owner_name',
  'owner_phone',
  'participant_kind',
  'participant_id',
  'participant_snapshot',
  'competition_slug',
  'competition_name',
  'stage_id',
  'stage_label',
  'competition_date_label',
  'competition_window_label',
  'registration_kind',
  'payment_option_id',
  'payment_option_title',
  'team_name',
  'seed_time',
  'comment',
  'status',
  'admission_status',
  'payment_status',
  'status_changed_at',
  'status_changed_by',
  'created_at',
  'updated_at',
].join(',')

function toMissingCompetitionApplicationsTableError() {
  return `CRM недоступна: таблица ${COMPETITION_APPLICATIONS_TABLE} не найдена. Выполните SQL из файла ${COMPETITION_APPLICATIONS_SQL_PATH} в Supabase SQL Editor.`
}

function isMissingCompetitionApplicationsTableError(error) {
  if (!error) {
    return false
  }

  return (
    error.code === '42P01' ||
    new RegExp(`relation .*${COMPETITION_APPLICATIONS_TABLE}.* does not exist`, 'i').test(
      error.message || '',
    ) ||
    new RegExp(`table .*${COMPETITION_APPLICATIONS_TABLE}.* not found`, 'i').test(
      error.message || '',
    )
  )
}

function throwCompetitionApplicationError(error, fallback) {
  if (isMissingCompetitionApplicationsTableError(error)) {
    throw new Error(toMissingCompetitionApplicationsTableError())
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

export async function fetchCompetitionApplicationsForCurrentUser() {
  await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')

  const { data, error } = await getSupabaseClient()
    .from(COMPETITION_APPLICATIONS_TABLE)
    .select(COMPETITION_APPLICATION_SELECT)
    .order('updated_at', { ascending: false })

  if (error) {
    throwCompetitionApplicationError(error, 'Не удалось загрузить заявки на соревнования.')
  }

  return (data ?? []).map(mapSupabaseCompetitionApplicationRow)
}

export async function fetchAllCompetitionApplicationsForAdmin() {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { data, error } = await getSupabaseClient()
    .from(COMPETITION_APPLICATIONS_TABLE)
    .select(COMPETITION_APPLICATION_SELECT)
    .order('updated_at', { ascending: false })

  if (error) {
    throwCompetitionApplicationError(error, 'Не удалось загрузить заявки на соревнования.')
  }

  return (data ?? []).map(mapSupabaseCompetitionApplicationRow)
}

export async function countActiveCompetitionApplicationsByStageId(stageId) {
  await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')

  const { data, error } = await getSupabaseClient()
    .rpc('get_competition_stage_active_registration_count', {
      target_stage_id: stageId,
    })

  if (error) {
    throwCompetitionApplicationError(error, 'Не удалось проверить лимит мест этапа.')
  }

  return Number(data) || 0
}

export async function createSupabaseCompetitionApplication(application) {
  const session = await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')
  const payload = mapCompetitionApplicationInsertPayload(application, {
    ownerUserId: session.user.id,
  })
  const { data, error } = await getSupabaseClient()
    .from(COMPETITION_APPLICATIONS_TABLE)
    .insert(payload)
    .select(COMPETITION_APPLICATION_SELECT)
    .single()

  if (error) {
    throwCompetitionApplicationError(error, 'Не удалось создать заявку на соревнование.')
  }

  return mapSupabaseCompetitionApplicationRow(data)
}

export async function updateSupabaseCompetitionApplication(applicationId, patch = {}) {
  await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')

  const payload = mapCompetitionApplicationUpdatePayload(patch)

  if (!Object.keys(payload).length) {
    return null
  }

  const { data, error } = await getSupabaseClient()
    .from(COMPETITION_APPLICATIONS_TABLE)
    .update(payload)
    .eq('id', applicationId)
    .select(COMPETITION_APPLICATION_SELECT)
    .maybeSingle()

  if (error) {
    throwCompetitionApplicationError(error, 'Не удалось обновить заявку на соревнование.')
  }

  if (!data) {
    throw new Error(COMPETITION_APPLICATION_UPDATE_NOT_ALLOWED_MESSAGE)
  }

  return mapSupabaseCompetitionApplicationRow(data)
}

export function subscribeToCompetitionApplications(callback) {
  const client = getSupabaseClient()
  competitionApplicationsSubscriptionId += 1

  const channel = client
    .channel(`competition-applications-feed-${competitionApplicationsSubscriptionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: COMPETITION_APPLICATIONS_TABLE,
      },
      callback,
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

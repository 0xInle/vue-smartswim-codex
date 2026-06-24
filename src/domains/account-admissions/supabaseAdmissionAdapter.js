import {
  mapAdmissionUpsertPayload,
  mapAthleteApplicationUpsertPayload,
  mapSupabaseAdmissionRow,
  mapSupabaseAthleteApplicationRow,
} from './accountAdmissionMappers.js'
import { getCurrentSession } from '@/utils/supabaseAuth'
import { getSupabaseClient } from '@/utils/supabaseClient'
import { getUserFacingErrorMessage } from '@/utils/userFacingErrors'

const ACCOUNT_ATHLETE_APPLICATIONS_TABLE = 'account_athlete_applications'
const ACCOUNT_ADMISSIONS_TABLE = 'account_admissions'
const ACCOUNT_ADMISSIONS_SQL_PATH = 'supabase/account_athlete_admissions.sql'
let accountAdmissionSubscriptionId = 0

const ACCOUNT_ATHLETE_APPLICATION_SELECT = [
  'id',
  'owner_user_id',
  'owner_email',
  'owner_name',
  'owner_phone',
  'scope',
  'scope_id',
  'participant_name',
  'participant_birth_date',
  'participant_club',
  'participant_kind',
  'status',
  'note',
  'updated_by',
  'created_at',
  'updated_at',
].join(',')

const ACCOUNT_ADMISSION_SELECT = [
  'id',
  'owner_user_id',
  'owner_email',
  'owner_name',
  'scope',
  'scope_id',
  'participant_name',
  'participant_birth_date',
  'participant_club',
  'participant_kind',
  'status',
  'note',
  'admitted_at',
  'admitted_by',
  'email_notification_status',
  'email_notification_at',
  'created_at',
  'updated_at',
].join(',')

function toMissingAccountAdmissionsTableError(tableName) {
  return `Допуски спортсменов недоступны: таблица ${tableName} не найдена. Выполните SQL из файла ${ACCOUNT_ADMISSIONS_SQL_PATH} в Supabase SQL Editor.`
}

function isMissingAccountAdmissionsTableError(error, tableName) {
  if (!error) {
    return false
  }

  return (
    error.code === '42P01' ||
    new RegExp(`relation .*${tableName}.* does not exist`, 'i').test(error.message || '') ||
    new RegExp(`table .*${tableName}.* not found`, 'i').test(error.message || '')
  )
}

function throwAccountAdmissionsError(error, tableName, fallback) {
  if (isMissingAccountAdmissionsTableError(error, tableName)) {
    throw new Error(toMissingAccountAdmissionsTableError(tableName))
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

async function fetchWorkflowRows({ ownerOnly = false, ownerUserId = '', ownerUserIds = [] } = {}) {
  const session = await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')
  const client = getSupabaseClient()
  const normalizedOwnerUserIds = Array.from(
    new Set(
      (Array.isArray(ownerUserIds) ? ownerUserIds : [])
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    ),
  )
  let applicationsQuery = client
    .from(ACCOUNT_ATHLETE_APPLICATIONS_TABLE)
    .select(ACCOUNT_ATHLETE_APPLICATION_SELECT)
    .order('updated_at', { ascending: false })
  let admissionsQuery = client
    .from(ACCOUNT_ADMISSIONS_TABLE)
    .select(ACCOUNT_ADMISSION_SELECT)
    .order('updated_at', { ascending: false })

  if (ownerOnly) {
    applicationsQuery = applicationsQuery.eq('owner_user_id', session.user.id)
    admissionsQuery = admissionsQuery.eq('owner_user_id', session.user.id)
  }

  if (ownerUserId) {
    applicationsQuery = applicationsQuery.eq('owner_user_id', ownerUserId)
    admissionsQuery = admissionsQuery.eq('owner_user_id', ownerUserId)
  } else if (normalizedOwnerUserIds.length) {
    applicationsQuery = applicationsQuery.in('owner_user_id', normalizedOwnerUserIds)
    admissionsQuery = admissionsQuery.in('owner_user_id', normalizedOwnerUserIds)
  }

  const [applicationsResult, admissionsResult] = await Promise.all([
    applicationsQuery,
    admissionsQuery,
  ])

  if (applicationsResult.error) {
    throwAccountAdmissionsError(
      applicationsResult.error,
      ACCOUNT_ATHLETE_APPLICATIONS_TABLE,
      'Не удалось загрузить заявки спортсменов.',
    )
  }

  if (admissionsResult.error) {
    throwAccountAdmissionsError(
      admissionsResult.error,
      ACCOUNT_ADMISSIONS_TABLE,
      'Не удалось загрузить допуски спортсменов.',
    )
  }

  return {
    applications: (applicationsResult.data ?? []).map(mapSupabaseAthleteApplicationRow),
    admissions: (admissionsResult.data ?? []).map(mapSupabaseAdmissionRow),
  }
}

export async function fetchAccountAdmissionWorkflowForCurrentUser() {
  return fetchWorkflowRows({ ownerOnly: true })
}

export async function fetchAllAccountAdmissionWorkflowForStaff() {
  return fetchWorkflowRows({ ownerOnly: false })
}

export async function fetchAccountAdmissionWorkflowForOwnerForStaff(ownerUserId) {
  return fetchWorkflowRows({ ownerUserId })
}

export async function fetchAccountAdmissionWorkflowForOwnersForStaff(ownerUserIds = []) {
  if (!Array.isArray(ownerUserIds) || !ownerUserIds.some((value) => String(value || '').trim())) {
    return {
      applications: [],
      admissions: [],
    }
  }

  return fetchWorkflowRows({ ownerUserIds })
}

export async function upsertAthleteApplication(record = {}) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')
  const payload = mapAthleteApplicationUpsertPayload(record, {
    ownerUserId: record.ownerUserId || record.ownerUserKey,
  })

  const { data, error } = await getSupabaseClient()
    .from(ACCOUNT_ATHLETE_APPLICATIONS_TABLE)
    .upsert(payload, { onConflict: 'id' })
    .select(ACCOUNT_ATHLETE_APPLICATION_SELECT)
    .single()

  if (error) {
    throwAccountAdmissionsError(
      error,
      ACCOUNT_ATHLETE_APPLICATIONS_TABLE,
      'Не удалось сохранить заявку спортсмена.',
    )
  }

  return mapSupabaseAthleteApplicationRow(data)
}

export async function deleteAthleteApplication({ id }) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { error } = await getSupabaseClient()
    .from(ACCOUNT_ATHLETE_APPLICATIONS_TABLE)
    .delete()
    .eq('id', id)

  if (error) {
    throwAccountAdmissionsError(
      error,
      ACCOUNT_ATHLETE_APPLICATIONS_TABLE,
      'Не удалось удалить заявку спортсмена.',
    )
  }
}

export async function upsertAdmission(record = {}) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')
  const payload = mapAdmissionUpsertPayload(record, {
    ownerUserId: record.ownerUserId || record.ownerUserKey,
  })

  const { data, error } = await getSupabaseClient()
    .from(ACCOUNT_ADMISSIONS_TABLE)
    .upsert(payload, { onConflict: 'id' })
    .select(ACCOUNT_ADMISSION_SELECT)
    .single()

  if (error) {
    throwAccountAdmissionsError(error, ACCOUNT_ADMISSIONS_TABLE, 'Не удалось сохранить допуск.')
  }

  return mapSupabaseAdmissionRow(data)
}

export function subscribeToAccountAdmissionWorkflow(callback) {
  const client = getSupabaseClient()
  accountAdmissionSubscriptionId += 1

  const channel = client
    .channel(`account-admission-workflow-feed-${accountAdmissionSubscriptionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: ACCOUNT_ATHLETE_APPLICATIONS_TABLE,
      },
      callback,
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: ACCOUNT_ADMISSIONS_TABLE,
      },
      callback,
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

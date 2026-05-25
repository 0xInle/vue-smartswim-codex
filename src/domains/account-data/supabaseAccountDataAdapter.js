import {
  createEmptyAccountProfile,
  mapAccountAthleteUpsertPayload,
  mapAccountProfileUpsertPayload,
  mapSupabaseAccountAthleteRow,
  mapSupabaseAccountProfileRow,
} from './accountDataMappers.js'
import { getCurrentSession } from '@/utils/supabaseAuth'
import { getSupabaseClient } from '@/utils/supabaseClient'

const ACCOUNT_PROFILES_TABLE = 'account_profiles'
const ACCOUNT_ATHLETES_TABLE = 'account_athletes'
const ACCOUNT_DATA_SQL_PATH = 'supabase/account_profiles_athletes.sql'
let accountDataSubscriptionId = 0

const ACCOUNT_PROFILE_SELECT = [
  'owner_user_id',
  'full_name',
  'birth_date',
  'club',
  'phone',
  'email',
  'created_at',
  'updated_at',
].join(',')

const ACCOUNT_ATHLETE_SELECT = [
  'id',
  'owner_user_id',
  'full_name',
  'birth_date',
  'gender',
  'club',
  'rank',
  'coach',
  'created_at',
  'updated_at',
].join(',')

function toMissingAccountDataTableError(tableName) {
  return `Данные аккаунта недоступны: таблица ${tableName} не найдена. Выполните SQL из файла ${ACCOUNT_DATA_SQL_PATH} в Supabase SQL Editor.`
}

function isMissingAccountDataTableError(error, tableName) {
  if (!error) {
    return false
  }

  return (
    error.code === '42P01' ||
    new RegExp(`relation .*${tableName}.* does not exist`, 'i').test(error.message || '') ||
    new RegExp(`table .*${tableName}.* not found`, 'i').test(error.message || '')
  )
}

function throwAccountDataError(error, tableName, fallback) {
  if (isMissingAccountDataTableError(error, tableName)) {
    throw new Error(toMissingAccountDataTableError(tableName))
  }

  throw new Error(error?.message || fallback)
}

async function requireCurrentSession(message) {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error(message)
  }

  return session
}

function resolveCurrentUser(currentUser) {
  return currentUser?.value || currentUser || null
}

export async function fetchAccountProfileForCurrentUser({ currentUser } = {}) {
  const session = await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')
  const resolvedUser = resolveCurrentUser(currentUser)

  const { data, error } = await getSupabaseClient()
    .from(ACCOUNT_PROFILES_TABLE)
    .select(ACCOUNT_PROFILE_SELECT)
    .eq('owner_user_id', session.user.id)
    .maybeSingle()

  if (error) {
    throwAccountDataError(error, ACCOUNT_PROFILES_TABLE, 'Не удалось загрузить профиль.')
  }

  return data
    ? mapSupabaseAccountProfileRow(data, resolvedUser)
    : createEmptyAccountProfile(resolvedUser)
}

export async function upsertAccountProfileForCurrentUser({ currentUser, profile } = {}) {
  const session = await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')
  const resolvedUser = resolveCurrentUser(currentUser)
  const payload = mapAccountProfileUpsertPayload(profile, session.user.id)

  const { data, error } = await getSupabaseClient()
    .from(ACCOUNT_PROFILES_TABLE)
    .upsert(payload, { onConflict: 'owner_user_id' })
    .select(ACCOUNT_PROFILE_SELECT)
    .single()

  if (error) {
    throwAccountDataError(error, ACCOUNT_PROFILES_TABLE, 'Не удалось сохранить профиль.')
  }

  return mapSupabaseAccountProfileRow(data, resolvedUser)
}

export async function fetchAccountAthletesForCurrentUser() {
  const session = await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')

  const { data, error } = await getSupabaseClient()
    .from(ACCOUNT_ATHLETES_TABLE)
    .select(ACCOUNT_ATHLETE_SELECT)
    .eq('owner_user_id', session.user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    throwAccountDataError(error, ACCOUNT_ATHLETES_TABLE, 'Не удалось загрузить спортсменов.')
  }

  return (data ?? []).map(mapSupabaseAccountAthleteRow)
}

export async function fetchAllAccountProfilesForAdmin() {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { data, error } = await getSupabaseClient()
    .from(ACCOUNT_PROFILES_TABLE)
    .select(ACCOUNT_PROFILE_SELECT)
    .order('updated_at', { ascending: false })

  if (error) {
    throwAccountDataError(error, ACCOUNT_PROFILES_TABLE, 'Не удалось загрузить профили.')
  }

  return (data ?? []).map((row) => ({
    ownerUserId: row.owner_user_id || '',
    ...mapSupabaseAccountProfileRow(row),
  }))
}

export async function fetchAllAccountAthletesForAdmin() {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { data, error } = await getSupabaseClient()
    .from(ACCOUNT_ATHLETES_TABLE)
    .select(ACCOUNT_ATHLETE_SELECT)
    .order('updated_at', { ascending: false })

  if (error) {
    throwAccountDataError(error, ACCOUNT_ATHLETES_TABLE, 'Не удалось загрузить спортсменов.')
  }

  return (data ?? []).map((row) => ({
    ownerUserId: row.owner_user_id || '',
    ownerUserKey: row.owner_user_id || '',
    ...mapSupabaseAccountAthleteRow(row),
  }))
}

export async function upsertAccountAthleteForCurrentUser({ athlete } = {}) {
  const session = await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')
  const payload = mapAccountAthleteUpsertPayload(athlete, session.user.id)

  const { data, error } = await getSupabaseClient()
    .from(ACCOUNT_ATHLETES_TABLE)
    .upsert(payload, { onConflict: 'id' })
    .select(ACCOUNT_ATHLETE_SELECT)
    .single()

  if (error) {
    throwAccountDataError(error, ACCOUNT_ATHLETES_TABLE, 'Не удалось сохранить спортсмена.')
  }

  return mapSupabaseAccountAthleteRow(data)
}

export async function deleteAccountAthleteForCurrentUser(athleteId) {
  await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')

  const { error } = await getSupabaseClient()
    .from(ACCOUNT_ATHLETES_TABLE)
    .delete()
    .eq('id', athleteId)

  if (error) {
    throwAccountDataError(error, ACCOUNT_ATHLETES_TABLE, 'Не удалось удалить спортсмена.')
  }
}

export function subscribeToAccountDataChanges(callback) {
  const client = getSupabaseClient()
  accountDataSubscriptionId += 1

  const channel = client
    .channel(`account-data-feed-${accountDataSubscriptionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: ACCOUNT_PROFILES_TABLE,
      },
      callback,
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: ACCOUNT_ATHLETES_TABLE,
      },
      callback,
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

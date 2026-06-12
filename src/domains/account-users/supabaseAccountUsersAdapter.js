import { CRM_ROLE } from '@/utils/crmRoles'
import { formatPhone } from '@/utils/phone'
import { formatDateForInput } from '@/domains/account-data/accountDataMappers'
import { getCurrentSession } from '@/utils/supabaseAuth'
import { getSupabaseClient } from '@/utils/supabaseClient'
import { getUserFacingErrorMessage } from '@/utils/userFacingErrors'

const CRM_USERS_TABLE = 'crm_users'
const CRM_USERS_SQL_PATH = 'supabase/crm_users.sql'
let crmUsersSubscriptionId = 0

const CRM_USER_SELECT = [
  'id',
  'email',
  'name',
  'role',
  'account_status',
  'registered_at',
].join(',')

function toMissingCrmUsersTableError() {
  return `Пользователи CRM недоступны: таблица ${CRM_USERS_TABLE} не найдена. Выполните SQL из файла ${CRM_USERS_SQL_PATH} в Supabase SQL Editor.`
}

function isMissingCrmUsersTableError(error) {
  if (!error) {
    return false
  }

  return (
    error.code === '42P01' ||
    new RegExp(`relation .*${CRM_USERS_TABLE}.* does not exist`, 'i').test(error.message || '') ||
    new RegExp(`table .*${CRM_USERS_TABLE}.* not found`, 'i').test(error.message || '')
  )
}

function throwCrmUsersError(error, fallback) {
  if (isMissingCrmUsersTableError(error)) {
    throw new Error(toMissingCrmUsersTableError())
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

function normalizeRole(role) {
  return Object.values(CRM_ROLE).includes(role) ? role : CRM_ROLE.USER
}

function normalizeStatus(status) {
  return status === 'unpaid' ? 'unpaid' : 'paid'
}

function mapSupabaseAccountUserSearchRow(row = {}) {
  return {
    id: row.row_id || '',
    athleteId: row.athlete_id || '',
    ownerUserId: row.owner_user_id || '',
    ownerName: row.owner_name || '',
    ownerEmail: row.owner_email || '',
    ownerPhone: formatPhone(row.owner_phone || ''),
    isAthleteRecord: row.row_kind === 'athlete',
    email: row.email || '',
    name: row.name || row.email || '',
    phone: formatPhone(row.phone || ''),
    birthDate: formatDateForInput(row.birth_date),
    club: row.club || '',
    gender: row.gender || '',
    rank: row.rank || '',
    coach: row.coach || '',
    role: normalizeRole(row.role),
    status: normalizeStatus(row.account_status),
    registeredAt: row.registered_at || null,
    experience: row.experience || '',
    mainProfile: row.main_profile || '',
    availableSeats: row.available_seats || '',
    education: row.education || '',
    sportAchievements: row.sport_achievements || '',
    worksWith: row.works_with || '',
    minAge: row.min_age || '',
    preparationLevel: row.preparation_level || '',
    metro: row.metro || '',
    documents: [],
    athletes: [],
  }
}

export function mapSupabaseCrmUserRow(row = {}) {
  return {
    id: row.id || '',
    email: row.email || '',
    name: row.name || '',
    phone: '',
    role: normalizeRole(row.role),
    status: normalizeStatus(row.account_status),
    registeredAt: row.registered_at || null,
  }
}

export async function searchAccountUsersPageForAdmin({
  page = 1,
  pageSize = 20,
  search = '',
  role = 'all',
} = {}) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { data, error } = await getSupabaseClient().rpc('search_account_users_for_admin', {
    search_query: String(search || '').trim(),
    role_filter: role || 'all',
    page_number: Math.max(1, Number(page) || 1),
    page_size: Math.max(1, Number(pageSize) || 20),
  })

  if (error) {
    throwCrmUsersError(error, 'Не удалось найти пользователей CRM.')
  }

  return {
    items: (data ?? []).map(mapSupabaseAccountUserSearchRow),
    total: Number(data?.[0]?.total_count || 0),
  }
}

export async function fetchAllCrmUsersForAdmin() {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { data, error } = await getSupabaseClient()
    .from(CRM_USERS_TABLE)
    .select(CRM_USER_SELECT)
    .order('registered_at', { ascending: false })

  if (error) {
    throwCrmUsersError(error, 'Не удалось загрузить пользователей CRM.')
  }

  return (data ?? []).map(mapSupabaseCrmUserRow)
}

export async function fetchCrmUsersPageForAdmin({
  page = 1,
  pageSize = 20,
  role = 'all',
} = {}) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const normalizedPage = Math.max(1, Number(page) || 1)
  const normalizedPageSize = Math.max(1, Number(pageSize) || 20)
  const from = (normalizedPage - 1) * normalizedPageSize
  const to = from + normalizedPageSize - 1
  let query = getSupabaseClient()
    .from(CRM_USERS_TABLE)
    .select(CRM_USER_SELECT, { count: 'exact' })
    .order('registered_at', { ascending: false })
    .range(from, to)

  if (role && role !== 'all' && role !== CRM_ROLE.ATHLETE) {
    query = query.eq('role', normalizeRole(role))
  }

  const { data, error, count } = await query

  if (error) {
    throwCrmUsersError(error, 'Не удалось загрузить пользователей CRM.')
  }

  return {
    items: (data ?? []).map(mapSupabaseCrmUserRow),
    total: count ?? 0,
  }
}

export async function fetchCrmUserForAdmin(userId) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { data, error } = await getSupabaseClient()
    .from(CRM_USERS_TABLE)
    .select(CRM_USER_SELECT)
    .eq('id', userId)
    .single()

  if (error) {
    throwCrmUsersError(error, 'Не удалось загрузить пользователя CRM.')
  }

  return mapSupabaseCrmUserRow(data)
}

export async function updateCrmUserForAdmin(userId, patch = {}) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const payload = {}

  if (Object.prototype.hasOwnProperty.call(patch, 'name')) {
    payload.name = patch.name || ''
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'role')) {
    payload.role = normalizeRole(patch.role)
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'status')) {
    payload.account_status = normalizeStatus(patch.status)
  }

  const { data, error } = await getSupabaseClient()
    .from(CRM_USERS_TABLE)
    .update(payload)
    .eq('id', userId)
    .select(CRM_USER_SELECT)
    .single()

  if (error) {
    throwCrmUsersError(error, 'Не удалось обновить пользователя CRM.')
  }

  return mapSupabaseCrmUserRow(data)
}

export async function deleteCrmUserForAdmin(userId) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { error } = await getSupabaseClient().from(CRM_USERS_TABLE).delete().eq('id', userId)

  if (error) {
    throwCrmUsersError(error, 'Не удалось удалить пользователя из CRM.')
  }
}

export function subscribeToCrmUsers(callback) {
  const client = getSupabaseClient()
  crmUsersSubscriptionId += 1

  const channel = client
    .channel(`crm-users-feed-${crmUsersSubscriptionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: CRM_USERS_TABLE,
      },
      callback,
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

export function mergeCrmUserWithProfile(user, profile = null) {
  return {
    ...user,
    name: profile?.fullName || user.name || user.email || '',
    phone: formatPhone(profile?.phone || user.phone || ''),
    email: profile?.email || user.email || '',
    birthDate: profile?.birthDate || '',
    club: profile?.club || '',
    experience: profile?.experience || '',
    mainProfile: profile?.mainProfile || '',
    availableSeats: profile?.availableSeats || '',
    education: profile?.education || '',
    sportAchievements: profile?.sportAchievements || '',
    worksWith: profile?.worksWith || '',
    minAge: profile?.minAge || '',
    preparationLevel: profile?.preparationLevel || '',
    metro: profile?.metro || '',
  }
}

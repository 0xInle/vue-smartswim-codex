import { CRM_ROLE } from '@/utils/crmRoles'
import { formatRussianPhone } from '@/utils/phone'
import { getCurrentSession } from '@/utils/supabaseAuth'
import { getSupabaseClient } from '@/utils/supabaseClient'

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

  throw new Error(error?.message || fallback)
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
    phone: formatRussianPhone(profile?.phone || user.phone || ''),
    email: profile?.email || user.email || '',
  }
}

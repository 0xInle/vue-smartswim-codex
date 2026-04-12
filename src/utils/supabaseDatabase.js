import { CRM_ROLE } from '@/utils/crmRoles'
import { getCurrentSession } from '@/utils/supabaseAuth'
import { getSupabaseClient } from '@/utils/supabaseClient'

function toMissingTableError(tableName, sqlFilePath) {
  return `CRM недоступна: таблица ${tableName} не найдена. Выполните SQL из файла ${sqlFilePath} в Supabase SQL Editor.`
}

function isMissingTableError(error, tableName) {
  if (!error) {
    return false
  }

  return (
    error.code === '42P01' ||
    new RegExp(`relation .*${tableName}.* does not exist`, 'i').test(error.message || '') ||
    new RegExp(`table .*${tableName}.* not found`, 'i').test(error.message || '')
  )
}

function isConsultationStatusConstraintError(error) {
  if (!error) {
    return false
  }

  return (
    error.code === '23514' &&
    /consultation_requests_status_check/i.test(error.message || '')
  )
}

function mapCrmUser(row) {
  return {
    id: row.id ?? null,
    email: row.email ?? '',
    name: row.name ?? '',
    role: row.role ?? CRM_ROLE.USER,
    registeredAt: row.registered_at ?? null,
  }
}

function mapConsultationRequest(row) {
  const rawTime = row.consultation_time ?? ''
  const normalizedStatus = row.status === 'contacted' ? 'processed' : row.status ?? 'new'

  return {
    id: row.id ?? null,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    phone: row.phone ?? '',
    consultationDate: row.consultation_date ?? '',
    consultationTime: typeof rawTime === 'string' ? rawTime.slice(0, 5) : '',
    status: normalizedStatus,
    createdAt: row.created_at ?? null,
  }
}

export async function fetchCurrentCrmUser() {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error('Сессия истекла. Войдите в личный кабинет заново.')
  }

  const { data, error } = await getSupabaseClient()
    .from('crm_users')
    .select('id,email,name,role,registered_at')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error, 'crm_users')) {
      throw new Error(toMissingTableError('crm_users', 'supabase/crm_users.sql'))
    }

    throw new Error(error.message || 'Не удалось загрузить профиль пользователя из CRM.')
  }

  if (!data) {
    throw new Error(
      'Пользователь авторизован в Supabase Auth, но профиль в crm_users не создан. Проверьте trigger handle_auth_user_created и содержимое таблицы crm_users.',
    )
  }

  return mapCrmUser(data)
}

export async function createConsultationRequest(payload) {
  const { error } = await getSupabaseClient()
    .from('consultation_requests')
    .insert({
      first_name: payload.firstName,
      last_name: payload.lastName,
      phone: payload.phone,
      consultation_date: payload.consultationDate,
      consultation_time: payload.consultationTime,
      status: payload.status ?? 'new',
    })

  if (error) {
    if (isMissingTableError(error, 'consultation_requests')) {
      throw new Error(
        toMissingTableError('consultation_requests', 'supabase/consultation_requests.sql'),
      )
    }

    throw new Error(error.message || 'Не удалось отправить заявку на консультацию.')
  }

  return {
    id: null,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone,
    consultationDate: payload.consultationDate,
    consultationTime: payload.consultationTime,
    status: payload.status ?? 'new',
    createdAt: null,
  }
}

export async function fetchConsultationRequests() {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error('Сессия истекла. Войдите в CRM заново.')
  }

  const { data, error } = await getSupabaseClient()
    .from('consultation_requests')
    .select('id,first_name,last_name,phone,consultation_date,consultation_time,status,created_at')
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingTableError(error, 'consultation_requests')) {
      throw new Error(
        toMissingTableError('consultation_requests', 'supabase/consultation_requests.sql'),
      )
    }

    throw new Error(error.message || 'Не удалось загрузить заявки на консультацию.')
  }

  return (data ?? []).map(mapConsultationRequest)
}

export async function updateConsultationRequestStatus({ id, status }) {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error('Сессия истекла. Войдите в CRM заново.')
  }

  const client = getSupabaseClient()

  const { data, error } = await client
    .from('consultation_requests')
    .update({
      status,
    })
    .eq('id', id)
    .select('id,first_name,last_name,phone,consultation_date,consultation_time,status,created_at')
    .single()

  if (error) {
    if (status === 'processed' && isConsultationStatusConstraintError(error)) {
      const fallbackResult = await client
        .from('consultation_requests')
        .update({
          status: 'contacted',
        })
        .eq('id', id)
        .select('id,first_name,last_name,phone,consultation_date,consultation_time,status,created_at')
        .single()

      if (!fallbackResult.error) {
        return mapConsultationRequest({
          ...fallbackResult.data,
          status: 'processed',
        })
      }
    }

    if (isMissingTableError(error, 'consultation_requests')) {
      throw new Error(
        toMissingTableError('consultation_requests', 'supabase/consultation_requests.sql'),
      )
    }

    if (isConsultationStatusConstraintError(error)) {
      throw new Error(
        'В Supabase еще не обновлен список статусов consultation_requests. Выполните SQL из файла supabase/consultation_requests.sql и повторите действие.',
      )
    }

    throw new Error(error.message || 'Не удалось обновить статус заявки.')
  }

  return mapConsultationRequest(data)
}

export function subscribeToConsultationRequests(callback) {
  const client = getSupabaseClient()
  const channel = client
    .channel('consultation-requests-feed')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'consultation_requests',
      },
      callback,
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

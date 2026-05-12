import { CRM_ROLE } from '@/utils/crmRoles'
import { getCurrentSession } from '@/utils/supabaseAuth'
import { getSupabaseClient } from '@/utils/supabaseClient'
import { formatRussianPhone, isRussianPhone } from '@/utils/phone'

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

function isTrainerBookingStatusConstraintError(error) {
  if (!error) {
    return false
  }

  return error.code === '23514' && /trainer_bookings_status_check/i.test(error.message || '')
}

function isMissingColumnError(error, columnName) {
  if (!error) {
    return false
  }

  return (
    error.code === '42703' ||
    (
      error.code === 'PGRST204' &&
      new RegExp(`['"]${columnName}['"].*schema cache`, 'i').test(error.message || '')
    ) ||
    new RegExp(`column .*${columnName}.* does not exist`, 'i').test(error.message || '') ||
    new RegExp(`column .*${columnName}.* not exist`, 'i').test(error.message || '') ||
    new RegExp(`could not find .*${columnName}.*column`, 'i').test(error.message || '')
  )
}

function getMissingConsultationRequestColumn(error) {
  return ['callback_time', 'comment'].find((columnName) =>
    isMissingColumnError(error, columnName),
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
  const rawCallbackTime = row.callback_time ?? ''
  const normalizedStatus = row.status === 'contacted' ? 'processed' : row.status ?? 'new'

  return {
    id: row.id ?? null,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    phone: formatRussianPhone(row.phone ?? ''),
    consultationDate: row.consultation_date ?? '',
    consultationTime: typeof rawTime === 'string' ? rawTime.slice(0, 5) : '',
    callbackDate: row.callback_date ?? '',
    callbackTime: typeof rawCallbackTime === 'string' ? rawCallbackTime.slice(0, 5) : '',
    comment: row.comment ?? '',
    status: normalizedStatus,
    createdAt: row.created_at ?? null,
  }
}

function mapTrainerBooking(row) {
  const rawTime = row.preferred_time ?? ''

  return {
    id: row.id ?? null,
    trainerId: row.trainer_id ?? '',
    trainerName: row.trainer_name ?? '',
    clientUserId: row.client_user_id ?? null,
    firstName: row.client_first_name ?? '',
    lastName: row.client_last_name ?? '',
    phone: formatRussianPhone(row.client_phone ?? ''),
    email: row.client_email ?? '',
    preferredDate: row.preferred_date ?? '',
    preferredTime: typeof rawTime === 'string' ? rawTime.slice(0, 5) : '',
    comment: row.comment ?? '',
    status: row.status ?? 'new',
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

export async function createTrainerBooking(payload) {
  if (!isRussianPhone(payload.phone)) {
    throw new Error('Укажите номер в формате +7 (961) 471-33-80.')
  }

  const session = await getCurrentSession().catch(() => null)
  const resolvedClientUserId = session?.user?.id ?? null
  const insertPayload = {
    trainer_id: payload.trainerId,
    trainer_name: payload.trainerName,
    client_user_id: resolvedClientUserId,
    client_first_name: payload.firstName,
    client_last_name: payload.lastName,
    client_phone: formatRussianPhone(payload.phone),
    client_email: payload.email,
    preferred_date: payload.preferredDate,
    preferred_time: payload.preferredTime,
    comment: payload.comment ?? '',
    status: payload.status ?? 'new',
  }

  if (!session) {
    const { error } = await getSupabaseClient().from('trainer_bookings').insert(insertPayload)

    if (error) {
      if (isMissingTableError(error, 'trainer_bookings')) {
        throw new Error(toMissingTableError('trainer_bookings', 'supabase/trainer_bookings.sql'))
      }

      throw new Error(error.message || 'Не удалось записаться к тренеру.')
    }

    return mapTrainerBooking({
      ...insertPayload,
      id: null,
      created_at: null,
    })
  }

  const { data, error } = await getSupabaseClient()
    .from('trainer_bookings')
    .insert(insertPayload)
    .select(
      'id,trainer_id,trainer_name,client_user_id,client_first_name,client_last_name,client_phone,client_email,preferred_date,preferred_time,comment,status,created_at',
    )
    .single()

  if (error) {
    if (isMissingTableError(error, 'trainer_bookings')) {
      throw new Error(toMissingTableError('trainer_bookings', 'supabase/trainer_bookings.sql'))
    }

    throw new Error(error.message || 'Не удалось записаться к тренеру.')
  }

  return mapTrainerBooking(data)
}

export async function createConsultationRequest(payload) {
  if (!isRussianPhone(payload.phone)) {
    throw new Error('Укажите номер в формате +7 (961) 471-33-80.')
  }

  const { error } = await getSupabaseClient()
    .from('consultation_requests')
    .insert({
      first_name: payload.firstName,
      last_name: payload.lastName,
      phone: formatRussianPhone(payload.phone),
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
    phone: formatRussianPhone(payload.phone),
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
    .select('*')
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

export async function fetchOwnTrainerBookings() {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error('Сессия истекла. Войдите в личный кабинет заново.')
  }

  const { data, error } = await getSupabaseClient()
    .from('trainer_bookings')
    .select(
      'id,trainer_id,trainer_name,client_user_id,client_first_name,client_last_name,client_phone,client_email,preferred_date,preferred_time,comment,status,created_at',
    )
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingTableError(error, 'trainer_bookings')) {
      throw new Error(toMissingTableError('trainer_bookings', 'supabase/trainer_bookings.sql'))
    }

    throw new Error(error.message || 'Не удалось загрузить ваши записи к тренерам.')
  }

  return (data ?? []).map(mapTrainerBooking)
}

export async function fetchTrainerBookings() {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error('Сессия истекла. Войдите в CRM заново.')
  }

  const { data, error } = await getSupabaseClient()
    .from('trainer_bookings')
    .select(
      'id,trainer_id,trainer_name,client_user_id,client_first_name,client_last_name,client_phone,client_email,preferred_date,preferred_time,comment,status,created_at',
    )
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingTableError(error, 'trainer_bookings')) {
      throw new Error(toMissingTableError('trainer_bookings', 'supabase/trainer_bookings.sql'))
    }

    throw new Error(error.message || 'Не удалось загрузить записи к тренерам.')
  }

  return (data ?? []).map(mapTrainerBooking)
}

export async function updateConsultationRequestStatus({
  id,
  status,
  callbackTime = null,
  comment = '',
}) {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error('Сессия истекла. Войдите в CRM заново.')
  }

  const client = getSupabaseClient()
  const normalizedCallbackTime = callbackTime || null
  const normalizedComment = comment || ''

  function buildConsultationUpdatePayload(statusValue, optionalColumns) {
    const payload = {
      status: statusValue,
    }

    if (optionalColumns.has('callback_time')) {
      payload.callback_time = normalizedCallbackTime
    }

    if (optionalColumns.has('comment')) {
      payload.comment = normalizedComment
    }

    return payload
  }

  async function runUpdate(statusValue, optionalColumns) {
    const payload = buildConsultationUpdatePayload(statusValue, optionalColumns)

    return client.from('consultation_requests').update(payload).eq('id', id).select('*').single()
  }

  async function runUpdateWithAvailableColumns(statusValue, optionalColumns) {
    const availableOptionalColumns = new Set(optionalColumns)
    let result = await runUpdate(statusValue, availableOptionalColumns)

    while (result.error) {
      const missingColumn = getMissingConsultationRequestColumn(result.error)

      if (!missingColumn || !availableOptionalColumns.has(missingColumn)) {
        break
      }

      if (missingColumn === 'comment' && normalizedComment) {
        break
      }

      availableOptionalColumns.delete(missingColumn)
      result = await runUpdate(statusValue, availableOptionalColumns)
    }

    return {
      result,
      availableOptionalColumns,
    }
  }

  let { result, availableOptionalColumns } = await runUpdateWithAvailableColumns(
    status,
    new Set(['callback_time', 'comment']),
  )

  if (result.error) {
    if (status === 'processed' && isConsultationStatusConstraintError(result.error)) {
      const fallbackUpdate = await runUpdateWithAvailableColumns('contacted', availableOptionalColumns)
      result = fallbackUpdate.result
      availableOptionalColumns = fallbackUpdate.availableOptionalColumns

      if (!result.error) {
        return mapConsultationRequest({
          ...result.data,
          status: 'processed',
          callback_time: availableOptionalColumns.has('callback_time')
            ? normalizedCallbackTime
            : result.data.callback_time,
          comment: availableOptionalColumns.has('comment') ? normalizedComment : result.data.comment,
        })
      }
    }

    if (isMissingTableError(result.error, 'consultation_requests')) {
      throw new Error(
        toMissingTableError('consultation_requests', 'supabase/consultation_requests.sql'),
      )
    }

    if (isConsultationStatusConstraintError(result.error)) {
      throw new Error(
        'В Supabase еще не обновлен список статусов consultation_requests. Выполните SQL из файла supabase/consultation_requests.sql и повторите действие.',
      )
    }

    if (normalizedComment && isMissingColumnError(result.error, 'comment')) {
      throw new Error(
        'Комментарий не сохранен: в Supabase не найдена колонка comment у consultation_requests. Выполните SQL из файла supabase/consultation_requests.sql и повторите действие.',
      )
    }

    throw new Error(result.error.message || 'Не удалось обновить статус заявки.')
  }

  return mapConsultationRequest({
    ...result.data,
    callback_time: availableOptionalColumns.has('callback_time')
      ? normalizedCallbackTime
      : result.data.callback_time,
    comment: availableOptionalColumns.has('comment') ? normalizedComment : result.data.comment,
  })
}

export async function updateTrainerBookingStatus({ id, status }) {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error('Сессия истекла. Войдите в CRM заново.')
  }

  const { data, error } = await getSupabaseClient()
    .from('trainer_bookings')
    .update({
      status,
    })
    .eq('id', id)
    .select(
      'id,trainer_id,trainer_name,client_user_id,client_first_name,client_last_name,client_phone,client_email,preferred_date,preferred_time,comment,status,created_at',
    )
    .single()

  if (error) {
    if (isMissingTableError(error, 'trainer_bookings')) {
      throw new Error(toMissingTableError('trainer_bookings', 'supabase/trainer_bookings.sql'))
    }

    if (isTrainerBookingStatusConstraintError(error)) {
      throw new Error(
        'В Supabase еще не обновлен список статусов trainer_bookings. Выполните SQL из файла supabase/trainer_bookings.sql и повторите действие.',
      )
    }

    throw new Error(error.message || 'Не удалось обновить статус записи.')
  }

  return mapTrainerBooking(data)
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

export function subscribeToTrainerBookings(callback) {
  const client = getSupabaseClient()
  const channel = client
    .channel('trainer-bookings-feed')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trainer_bookings',
      },
      callback,
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

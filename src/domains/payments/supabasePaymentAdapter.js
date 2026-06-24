import {
  mapCompetitionPaymentInsertPayload,
  mapCompetitionPaymentUpdatePayload,
  mapCompetitionRefundInsertPayload,
  mapCompetitionRefundUpdatePayload,
  mapSupabaseCompetitionPaymentRow,
  mapSupabaseCompetitionRefundRow,
} from './paymentMappers.js'
import { COMPETITION_PAYMENT_STATUS, COMPETITION_REFUND_STATUS } from './paymentLifecycle.js'
import { getCurrentSession } from '@/utils/supabaseAuth'
import { getSupabaseClient } from '@/utils/supabaseClient'
import { getUserFacingErrorMessage } from '@/utils/userFacingErrors'

const COMPETITION_PAYMENTS_TABLE = 'competition_payments'
const COMPETITION_REFUNDS_TABLE = 'competition_refunds'
const COMPETITION_PAYMENTS_SQL_PATH = 'supabase/competition_payments.sql'
let competitionPaymentsSubscriptionId = 0
let competitionRefundsSubscriptionId = 0

const COMPETITION_PAYMENT_SELECT = [
  'id',
  'application_id',
  'owner_user_id',
  'provider',
  'provider_payment_id',
  'provider_status',
  'status',
  'amount_value',
  'amount_currency',
  'description',
  'confirmation_url',
  'idempotence_key',
  'metadata',
  'created_by_role',
  'created_at',
  'updated_at',
].join(',')

const COMPETITION_REFUND_SELECT = [
  'id',
  'payment_id',
  'application_id',
  'owner_user_id',
  'provider',
  'provider_refund_id',
  'provider_status',
  'status',
  'amount_value',
  'amount_currency',
  'reason',
  'admin_note',
  'requested_at',
  'resolved_at',
  'resolved_by',
  'metadata',
  'created_at',
  'updated_at',
].join(',')

function toMissingCompetitionPaymentsTableError() {
  return `Оплаты недоступны: таблицы платежей не найдены. Выполните SQL из файла ${COMPETITION_PAYMENTS_SQL_PATH} в Supabase SQL Editor.`
}

function isMissingCompetitionPaymentsTableError(error) {
  if (!error) {
    return false
  }

  return (
    error.code === '42P01' ||
    new RegExp(`relation .*(${COMPETITION_PAYMENTS_TABLE}|${COMPETITION_REFUNDS_TABLE}).* does not exist`, 'i').test(
      error.message || '',
    ) ||
    new RegExp(`table .*(${COMPETITION_PAYMENTS_TABLE}|${COMPETITION_REFUNDS_TABLE}).* not found`, 'i').test(
      error.message || '',
    )
  )
}

function throwCompetitionPaymentError(error, fallback) {
  if (isMissingCompetitionPaymentsTableError(error)) {
    throw new Error(toMissingCompetitionPaymentsTableError())
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

export async function fetchCompetitionPaymentsForCurrentUser() {
  const session = await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')

  const { data, error } = await getSupabaseClient()
    .from(COMPETITION_PAYMENTS_TABLE)
    .select(COMPETITION_PAYMENT_SELECT)
    .eq('owner_user_id', session.user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    throwCompetitionPaymentError(error, 'Не удалось загрузить оплаты.')
  }

  return (data ?? []).map(mapSupabaseCompetitionPaymentRow)
}

export async function fetchAllCompetitionPaymentsForAdmin() {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { data, error } = await getSupabaseClient()
    .from(COMPETITION_PAYMENTS_TABLE)
    .select(COMPETITION_PAYMENT_SELECT)
    .order('updated_at', { ascending: false })

  if (error) {
    throwCompetitionPaymentError(error, 'Не удалось загрузить оплаты для CRM.')
  }

  return (data ?? []).map(mapSupabaseCompetitionPaymentRow)
}

export async function fetchCompetitionPaymentsForApplicationsForAdmin(applicationIds = []) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')
  const normalizedApplicationIds = Array.from(
    new Set(
      (Array.isArray(applicationIds) ? applicationIds : [])
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    ),
  )

  if (!normalizedApplicationIds.length) {
    return []
  }

  const { data, error } = await getSupabaseClient()
    .from(COMPETITION_PAYMENTS_TABLE)
    .select(COMPETITION_PAYMENT_SELECT)
    .in('application_id', normalizedApplicationIds)
    .order('updated_at', { ascending: false })

  if (error) {
    throwCompetitionPaymentError(error, 'Не удалось загрузить оплаты для заявок.')
  }

  return (data ?? []).map(mapSupabaseCompetitionPaymentRow)
}

export async function fetchCompetitionRefundsForCurrentUser() {
  const session = await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')

  const { data, error } = await getSupabaseClient()
    .from(COMPETITION_REFUNDS_TABLE)
    .select(COMPETITION_REFUND_SELECT)
    .eq('owner_user_id', session.user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    throwCompetitionPaymentError(error, 'Не удалось загрузить возвраты.')
  }

  return (data ?? []).map(mapSupabaseCompetitionRefundRow)
}

export async function fetchCompetitionRefundsForApplicationsForAdmin(applicationIds = []) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')
  const normalizedApplicationIds = Array.from(
    new Set(
      (Array.isArray(applicationIds) ? applicationIds : [])
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    ),
  )

  if (!normalizedApplicationIds.length) {
    return []
  }

  const { data, error } = await getSupabaseClient()
    .from(COMPETITION_REFUNDS_TABLE)
    .select(COMPETITION_REFUND_SELECT)
    .in('application_id', normalizedApplicationIds)
    .order('updated_at', { ascending: false })

  if (error) {
    throwCompetitionPaymentError(error, 'Не удалось загрузить возвраты по заявкам.')
  }

  return (data ?? []).map(mapSupabaseCompetitionRefundRow)
}

export async function fetchAllCompetitionRefundsForAdmin() {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { data, error } = await getSupabaseClient()
    .from(COMPETITION_REFUNDS_TABLE)
    .select(COMPETITION_REFUND_SELECT)
    .order('updated_at', { ascending: false })

  if (error) {
    throwCompetitionPaymentError(error, 'Не удалось загрузить запросы возврата.')
  }

  return (data ?? []).map(mapSupabaseCompetitionRefundRow)
}

export async function createSupabaseCompetitionPayment(application, { amountValue = 0 } = {}) {
  const session = await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')
  const payload = mapCompetitionPaymentInsertPayload({
    application,
    ownerUserId: session.user.id,
    amountValue,
    status: COMPETITION_PAYMENT_STATUS.PROVIDER_UNAVAILABLE,
  })

  const { data, error } = await getSupabaseClient()
    .from(COMPETITION_PAYMENTS_TABLE)
    .insert(payload)
    .select(COMPETITION_PAYMENT_SELECT)
    .single()

  if (error) {
    throwCompetitionPaymentError(error, 'Не удалось создать платеж.')
  }

  return mapSupabaseCompetitionPaymentRow(data)
}

export async function updateSupabaseCompetitionPayment(paymentId, patch = {}) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')
  const payload = mapCompetitionPaymentUpdatePayload(patch)

  if (!Object.keys(payload).length) {
    return null
  }

  const { data, error } = await getSupabaseClient()
    .from(COMPETITION_PAYMENTS_TABLE)
    .update(payload)
    .eq('id', paymentId)
    .select(COMPETITION_PAYMENT_SELECT)
    .single()

  if (error) {
    throwCompetitionPaymentError(error, 'Не удалось обновить платеж.')
  }

  return mapSupabaseCompetitionPaymentRow(data)
}

export async function createSupabaseCompetitionRefund(payment, application, { reason = '' } = {}) {
  const session = await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')
  const payload = mapCompetitionRefundInsertPayload({
    payment,
    application,
    ownerUserId: session.user.id,
    reason,
  })

  const { data, error } = await getSupabaseClient()
    .from(COMPETITION_REFUNDS_TABLE)
    .insert(payload)
    .select(COMPETITION_REFUND_SELECT)
    .single()

  if (error) {
    throwCompetitionPaymentError(error, 'Не удалось запросить возврат.')
  }

  return mapSupabaseCompetitionRefundRow(data)
}

export async function updateSupabaseCompetitionRefund(refundId, patch = {}) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')
  const payload = mapCompetitionRefundUpdatePayload(patch)

  if (!Object.keys(payload).length) {
    return null
  }

  if (
    [COMPETITION_REFUND_STATUS.SUCCEEDED, COMPETITION_REFUND_STATUS.REJECTED, COMPETITION_REFUND_STATUS.FAILED].includes(
      payload.status,
    )
  ) {
    payload.resolved_at = new Date().toISOString()
  }

  const { data, error } = await getSupabaseClient()
    .from(COMPETITION_REFUNDS_TABLE)
    .update(payload)
    .eq('id', refundId)
    .select(COMPETITION_REFUND_SELECT)
    .single()

  if (error) {
    throwCompetitionPaymentError(error, 'Не удалось обновить возврат.')
  }

  return mapSupabaseCompetitionRefundRow(data)
}

export function subscribeToCompetitionPayments(callback) {
  const client = getSupabaseClient()
  competitionPaymentsSubscriptionId += 1

  const channel = client
    .channel(`competition-payments-feed-${competitionPaymentsSubscriptionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: COMPETITION_PAYMENTS_TABLE,
      },
      callback,
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

export function subscribeToCompetitionRefunds(callback) {
  const client = getSupabaseClient()
  competitionRefundsSubscriptionId += 1

  const channel = client
    .channel(`competition-refunds-feed-${competitionRefundsSubscriptionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: COMPETITION_REFUNDS_TABLE,
      },
      callback,
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

import {
  createSupabaseCompetitionPayment,
  createSupabaseCompetitionRefund,
  fetchAllCompetitionPaymentsForAdmin,
  fetchAllCompetitionRefundsForAdmin,
  fetchCompetitionPaymentsForCurrentUser,
  fetchCompetitionRefundsForCurrentUser,
  subscribeToCompetitionPayments,
  subscribeToCompetitionRefunds,
  updateSupabaseCompetitionPayment,
  updateSupabaseCompetitionRefund,
} from './supabasePaymentAdapter.js'
import { COMPETITION_PAYMENT_STATUS, COMPETITION_REFUND_STATUS } from './paymentLifecycle.js'

export async function loadPaymentsForCurrentUser() {
  return fetchCompetitionPaymentsForCurrentUser()
}

export async function loadAllPaymentsForAdmin() {
  return fetchAllCompetitionPaymentsForAdmin()
}

export async function loadRefundsForCurrentUser() {
  return fetchCompetitionRefundsForCurrentUser()
}

export async function loadAllRefundsForAdmin() {
  return fetchAllCompetitionRefundsForAdmin()
}

export async function createPendingCompetitionPaymentForCurrentUser(
  application,
  { amountValue = 0 } = {},
) {
  return createSupabaseCompetitionPayment(application, { amountValue })
}

export async function markCompetitionPaymentSucceeded(paymentId, actorName = 'admin') {
  return updateSupabaseCompetitionPayment(paymentId, {
    status: COMPETITION_PAYMENT_STATUS.SUCCEEDED,
    actorName,
  })
}

export async function markCompetitionPaymentFailed(paymentId, actorName = 'admin') {
  return updateSupabaseCompetitionPayment(paymentId, {
    status: COMPETITION_PAYMENT_STATUS.FAILED,
    actorName,
  })
}

export async function requestCompetitionRefundForCurrentUser(
  payment,
  application,
  { reason = '' } = {},
) {
  return createSupabaseCompetitionRefund(payment, application, { reason })
}

export async function resolveCompetitionRefundForAdmin(
  refundId,
  { status = COMPETITION_REFUND_STATUS.SUCCEEDED, adminNote = '' } = {},
) {
  return updateSupabaseCompetitionRefund(refundId, { status, adminNote })
}

export function subscribeToCompetitionPaymentChanges(callback) {
  return subscribeToCompetitionPayments(callback)
}

export function subscribeToCompetitionRefundChanges(callback) {
  return subscribeToCompetitionRefunds(callback)
}

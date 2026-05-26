import {
  COMPETITION_PAYMENT_PROVIDER,
  COMPETITION_PAYMENT_STATUS,
  COMPETITION_REFUND_STATUS,
  normalizeCompetitionPaymentStatus,
  normalizeCompetitionRefundStatus,
} from './paymentLifecycle.js'

export function mapSupabaseCompetitionPaymentRow(row = {}) {
  return {
    id: row.id || '',
    applicationId: row.application_id || '',
    ownerUserId: row.owner_user_id || '',
    provider: row.provider || COMPETITION_PAYMENT_PROVIDER.YOOKASSA,
    providerPaymentId: row.provider_payment_id || '',
    providerStatus: row.provider_status || '',
    status: normalizeCompetitionPaymentStatus(row.status),
    amountValue: Number(row.amount_value ?? 0),
    amountCurrency: row.amount_currency || 'RUB',
    description: row.description || '',
    confirmationUrl: row.confirmation_url || '',
    idempotenceKey: row.idempotence_key || '',
    metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {},
    createdByRole: row.created_by_role || 'user',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  }
}

export function mapSupabaseCompetitionRefundRow(row = {}) {
  return {
    id: row.id || '',
    paymentId: row.payment_id || '',
    applicationId: row.application_id || '',
    ownerUserId: row.owner_user_id || '',
    provider: row.provider || COMPETITION_PAYMENT_PROVIDER.YOOKASSA,
    providerRefundId: row.provider_refund_id || '',
    providerStatus: row.provider_status || '',
    status: normalizeCompetitionRefundStatus(row.status),
    amountValue: Number(row.amount_value ?? 0),
    amountCurrency: row.amount_currency || 'RUB',
    reason: row.reason || '',
    adminNote: row.admin_note || '',
    requestedAt: row.requested_at || '',
    resolvedAt: row.resolved_at || '',
    resolvedBy: row.resolved_by || '',
    metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {},
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  }
}

export function mapCompetitionPaymentInsertPayload({
  application,
  ownerUserId = '',
  amountValue = 0,
  status = COMPETITION_PAYMENT_STATUS.PROVIDER_UNAVAILABLE,
} = {}) {
  return {
    application_id: application?.id || '',
    owner_user_id: ownerUserId || application?.sourceUserKey || '',
    provider: COMPETITION_PAYMENT_PROVIDER.YOOKASSA,
    status,
    amount_value: Number.isFinite(Number(amountValue)) ? Number(amountValue) : 0,
    amount_currency: 'RUB',
    description: buildCompetitionPaymentDescription(application),
    confirmation_url: '',
    created_by_role: 'user',
    metadata: {
      competition_slug: application?.competitionSlug || '',
      competition_name: application?.competitionName || '',
      stage_id: application?.stageId || '',
      stage_label: application?.stageLabel || '',
      participant_name: application?.participantName || '',
      mvp_mode: true,
      provider_connected: false,
    },
  }
}

export function mapCompetitionRefundInsertPayload({
  payment,
  application,
  ownerUserId = '',
  reason = '',
} = {}) {
  return {
    payment_id: payment?.id || '',
    application_id: application?.id || payment?.applicationId || '',
    owner_user_id: ownerUserId || payment?.ownerUserId || application?.sourceUserKey || '',
    provider: COMPETITION_PAYMENT_PROVIDER.YOOKASSA,
    status: COMPETITION_REFUND_STATUS.REQUESTED,
    amount_value: Number.isFinite(Number(payment?.amountValue)) ? Number(payment.amountValue) : 0,
    amount_currency: payment?.amountCurrency || 'RUB',
    reason: String(reason || '').trim(),
    metadata: {
      competition_slug: application?.competitionSlug || '',
      competition_name: application?.competitionName || '',
      stage_id: application?.stageId || '',
      stage_label: application?.stageLabel || '',
      participant_name: application?.participantName || '',
      mvp_mode: true,
      provider_connected: false,
    },
  }
}

export function mapCompetitionPaymentUpdatePayload({ status, actorName = '' } = {}) {
  const payload = {}

  if (status) {
    payload.status = normalizeCompetitionPaymentStatus(status)
    payload.provider_status = 'manual_mvp'
    payload.created_by_role = 'admin'
  }

  if (actorName) {
    payload.metadata = {
      actor_name: actorName,
      mvp_mode: true,
      provider_connected: false,
    }
  }

  return payload
}

export function mapCompetitionRefundUpdatePayload({ status, adminNote = '' } = {}) {
  const payload = {}

  if (status) {
    payload.status = normalizeCompetitionRefundStatus(status)
    payload.provider_status = 'manual_mvp'
  }

  if (adminNote) {
    payload.admin_note = String(adminNote || '').trim()
  }

  return payload
}

function buildCompetitionPaymentDescription(application = {}) {
  const parts = [
    'Smart Swim',
    application.competitionName,
    application.stageLabel,
    application.participantName,
  ].filter(Boolean)

  return parts.join(' · ')
}

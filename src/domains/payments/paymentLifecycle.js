export const COMPETITION_PAYMENT_STATUS = Object.freeze({
  NOT_REQUIRED: 'not_required',
  PENDING: 'pending',
  PROVIDER_UNAVAILABLE: 'provider_unavailable',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELED: 'canceled',
  REFUNDED: 'refunded',
})

export const COMPETITION_APPLICATION_PAYMENT_STATUS = Object.freeze({
  NOT_REQUIRED: 'not_required',
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
})

export const COMPETITION_REFUND_STATUS = Object.freeze({
  REQUESTED: 'requested',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  REJECTED: 'rejected',
  FAILED: 'failed',
})

export const COMPETITION_PAYMENT_PROVIDER = Object.freeze({
  YOOKASSA: 'yookassa',
})

export const REFUND_DEADLINE_HOURS = 48

export const COMPETITION_PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'Все оплаты' },
  { value: COMPETITION_APPLICATION_PAYMENT_STATUS.NOT_REQUIRED, label: 'Не требуется' },
  { value: COMPETITION_APPLICATION_PAYMENT_STATUS.PENDING, label: 'Ожидает оплаты' },
  { value: COMPETITION_APPLICATION_PAYMENT_STATUS.PAID, label: 'Оплачено' },
  { value: COMPETITION_APPLICATION_PAYMENT_STATUS.FAILED, label: 'Ошибка оплаты' },
  { value: COMPETITION_APPLICATION_PAYMENT_STATUS.REFUNDED, label: 'Возврат' },
]

const PAYMENT_STATUS_META = Object.freeze({
  [COMPETITION_PAYMENT_STATUS.NOT_REQUIRED]: {
    label: 'Не требуется',
    description: 'Оплата по заявке пока не требуется.',
    tagType: 'info',
    rank: 0,
  },
  [COMPETITION_PAYMENT_STATUS.PENDING]: {
    label: 'Ожидает оплаты',
    description: 'Платеж создан и ожидает продолжения.',
    tagType: 'warning',
    rank: 1,
  },
  [COMPETITION_PAYMENT_STATUS.PROVIDER_UNAVAILABLE]: {
    label: 'ЮKassa не подключена',
    description: 'Оплата будет доступна после подключения ЮKassa.',
    tagType: 'warning',
    rank: 2,
  },
  [COMPETITION_PAYMENT_STATUS.SUCCEEDED]: {
    label: 'Оплачено',
    description: 'Оплата отмечена как успешная в Smart Swim.',
    tagType: 'success',
    rank: 3,
  },
  [COMPETITION_PAYMENT_STATUS.FAILED]: {
    label: 'Ошибка оплаты',
    description: 'Платеж отмечен как неуспешный.',
    tagType: 'danger',
    rank: 4,
  },
  [COMPETITION_PAYMENT_STATUS.CANCELED]: {
    label: 'Отменено',
    description: 'Платеж отменен.',
    tagType: 'info',
    rank: 5,
  },
  [COMPETITION_PAYMENT_STATUS.REFUNDED]: {
    label: 'Возврат',
    description: 'По платежу выполнен возврат.',
    tagType: 'info',
    rank: 6,
  },
})

const APPLICATION_PAYMENT_STATUS_META = Object.freeze({
  [COMPETITION_APPLICATION_PAYMENT_STATUS.NOT_REQUIRED]: PAYMENT_STATUS_META.not_required,
  [COMPETITION_APPLICATION_PAYMENT_STATUS.PENDING]: PAYMENT_STATUS_META.pending,
  [COMPETITION_APPLICATION_PAYMENT_STATUS.PAID]: PAYMENT_STATUS_META.succeeded,
  [COMPETITION_APPLICATION_PAYMENT_STATUS.FAILED]: PAYMENT_STATUS_META.failed,
  [COMPETITION_APPLICATION_PAYMENT_STATUS.REFUNDED]: PAYMENT_STATUS_META.refunded,
})

const REFUND_STATUS_META = Object.freeze({
  [COMPETITION_REFUND_STATUS.REQUESTED]: {
    label: 'Запрошен возврат',
    description: 'Запрос ожидает решения администратора.',
    tagType: 'warning',
    rank: 1,
  },
  [COMPETITION_REFUND_STATUS.PROCESSING]: {
    label: 'Возврат в работе',
    description: 'Администратор обрабатывает возврат.',
    tagType: 'warning',
    rank: 2,
  },
  [COMPETITION_REFUND_STATUS.SUCCEEDED]: {
    label: 'Возврат выполнен',
    description: 'Возврат отмечен как выполненный в Smart Swim.',
    tagType: 'success',
    rank: 3,
  },
  [COMPETITION_REFUND_STATUS.REJECTED]: {
    label: 'Возврат отклонен',
    description: 'Администратор отклонил запрос возврата.',
    tagType: 'danger',
    rank: 4,
  },
  [COMPETITION_REFUND_STATUS.FAILED]: {
    label: 'Ошибка возврата',
    description: 'Возврат отмечен как неуспешный.',
    tagType: 'danger',
    rank: 5,
  },
})

export function normalizeCompetitionPaymentStatus(status) {
  const normalizedStatus = String(status || '')

  if (Object.values(COMPETITION_PAYMENT_STATUS).includes(normalizedStatus)) {
    return normalizedStatus
  }

  return COMPETITION_PAYMENT_STATUS.NOT_REQUIRED
}

export function normalizeApplicationPaymentStatus(status) {
  const normalizedStatus = String(status || '')

  if (Object.values(COMPETITION_APPLICATION_PAYMENT_STATUS).includes(normalizedStatus)) {
    return normalizedStatus
  }

  return COMPETITION_APPLICATION_PAYMENT_STATUS.NOT_REQUIRED
}

export function normalizeCompetitionRefundStatus(status) {
  const normalizedStatus = String(status || '')

  if (Object.values(COMPETITION_REFUND_STATUS).includes(normalizedStatus)) {
    return normalizedStatus
  }

  return COMPETITION_REFUND_STATUS.REQUESTED
}

export function getCompetitionPaymentStatusMeta(status) {
  return PAYMENT_STATUS_META[normalizeCompetitionPaymentStatus(status)]
}

export function getApplicationPaymentStatusMeta(status) {
  return APPLICATION_PAYMENT_STATUS_META[normalizeApplicationPaymentStatus(status)]
}

export function getCompetitionRefundStatusMeta(status) {
  return REFUND_STATUS_META[normalizeCompetitionRefundStatus(status)]
}

export function getPaymentSortRank(status) {
  return getApplicationPaymentStatusMeta(status).rank
}

export function isPaymentSucceeded(payment) {
  return payment?.status === COMPETITION_PAYMENT_STATUS.SUCCEEDED
}

export function hasActiveRefund(refund) {
  return [COMPETITION_REFUND_STATUS.REQUESTED, COMPETITION_REFUND_STATUS.PROCESSING].includes(
    refund?.status,
  )
}

export function getRefundDeadline(stageDate) {
  const parsedDate = parseStageDate(stageDate)

  if (!parsedDate) {
    return null
  }

  return parsedDate.getTime() - REFUND_DEADLINE_HOURS * 60 * 60 * 1000
}

export function canRequestCompetitionRefund({ payment, refund, stageDate, now = Date.now() } = {}) {
  if (!isPaymentSucceeded(payment) || hasActiveRefund(refund)) {
    return false
  }

  const deadline = getRefundDeadline(stageDate)

  if (!deadline) {
    return false
  }

  return now < deadline
}

export function parseStageDate(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue) {
    return null
  }

  const isoDateMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (isoDateMatch) {
    const parsedDate = new Date(`${isoDateMatch[1]}-${isoDateMatch[2]}-${isoDateMatch[3]}T00:00:00`)

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  const parsedDate = new Date(normalizedValue)

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

export const APPLICATION_STATUS = Object.freeze({
  SUBMITTED: 'submitted',
  REVIEWING: 'reviewing',
  NEEDS_FIX: 'needs_fix',
  APPROVED: 'approved',
  PAYMENT_PENDING: 'payment_pending',
  PAID: 'paid',
  ADMITTED: 'admitted',
  WITHDRAWN: 'withdrawn',
  REJECTED: 'rejected',
})

export const APPLICATION_ACTOR = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
  NONE: 'none',
})

export const APPLICATION_STATUS_META = Object.freeze({
  [APPLICATION_STATUS.SUBMITTED]: {
    value: APPLICATION_STATUS.SUBMITTED,
    userLabel: 'Заявка подана',
    adminLabel: 'Новая заявка',
    shortLabel: 'Подана',
    tagType: 'primary',
    responsibleActor: APPLICATION_ACTOR.ADMIN,
    isTerminal: false,
    isActive: true,
    blocksAdmission: true,
    userDescription: 'Заявка ожидает первичной проверки администратором.',
    adminDescription: 'Новая заявка ожидает проверки данных и документов.',
    userNextAction: 'Ожидайте проверки. Если документы не загружены, добавьте их в разделе документов.',
    adminNextAction: 'Проверьте данные участника и документы, затем переведите заявку дальше.',
  },
  [APPLICATION_STATUS.REVIEWING]: {
    value: APPLICATION_STATUS.REVIEWING,
    userLabel: 'Заявка на проверке',
    adminLabel: 'В работе',
    shortLabel: 'На проверке',
    tagType: 'warning',
    responsibleActor: APPLICATION_ACTOR.ADMIN,
    isTerminal: false,
    isActive: true,
    blocksAdmission: true,
    userDescription: 'Администратор проверяет данные и документы.',
    adminDescription: 'Заявка находится в обработке.',
    userNextAction: 'Ожидайте решения, если документный блок не просит загрузить или исправить документы.',
    adminNextAction: 'Завершите проверку и выберите решение.',
  },
  [APPLICATION_STATUS.NEEDS_FIX]: {
    value: APPLICATION_STATUS.NEEDS_FIX,
    userLabel: 'Нужно исправить',
    adminLabel: 'Требует исправлений',
    shortLabel: 'Нужно исправить',
    tagType: 'danger',
    responsibleActor: APPLICATION_ACTOR.USER,
    isTerminal: false,
    isActive: true,
    blocksAdmission: true,
    userDescription: 'Заявка не может двигаться дальше, пока не исправлены данные или документы.',
    adminDescription: 'Ожидается исправление от пользователя.',
    userNextAction: 'Исправьте указанную проблему и обновите документы или данные заявки.',
    adminNextAction: 'Дождитесь обновления от пользователя, затем повторите проверку.',
  },
  [APPLICATION_STATUS.APPROVED]: {
    value: APPLICATION_STATUS.APPROVED,
    userLabel: 'Заявка одобрена',
    adminLabel: 'Одобрена',
    shortLabel: 'Одобрена',
    tagType: 'success',
    responsibleActor: APPLICATION_ACTOR.ADMIN,
    isTerminal: false,
    isActive: true,
    blocksAdmission: false,
    userDescription: 'Данные заявки приняты. Это еще не финальный допуск к старту.',
    adminDescription: 'Заявка одобрена и готова к финальному решению по допуску.',
    userNextAction: 'Ожидайте финального подтверждения допуска к старту.',
    adminNextAction: 'Подтвердите допуск, когда участник готов к старту.',
  },
  [APPLICATION_STATUS.PAYMENT_PENDING]: {
    value: APPLICATION_STATUS.PAYMENT_PENDING,
    userLabel: 'Ожидает оплаты',
    adminLabel: 'Ожидает оплаты',
    shortLabel: 'Ожидает оплаты',
    tagType: 'warning',
    responsibleActor: APPLICATION_ACTOR.USER,
    isTerminal: false,
    isActive: true,
    blocksAdmission: true,
    userDescription: 'Для продолжения требуется оплата или ожидание инструкций по оплате.',
    adminDescription: 'Заявка ожидает подтверждения оплаты.',
    userNextAction: 'Следуйте инструкции по оплате или дождитесь сообщения организатора.',
    adminNextAction: 'Подтвердите оплату или свяжитесь с пользователем.',
  },
  [APPLICATION_STATUS.PAID]: {
    value: APPLICATION_STATUS.PAID,
    userLabel: 'Оплачена',
    adminLabel: 'Оплачена',
    shortLabel: 'Оплачена',
    tagType: 'success',
    responsibleActor: APPLICATION_ACTOR.ADMIN,
    isTerminal: false,
    isActive: true,
    blocksAdmission: false,
    userDescription: 'Оплата подтверждена. Финальный допуск к старту подтверждается отдельно.',
    adminDescription: 'Оплата подтверждена, можно принять финальное решение по допуску.',
    userNextAction: 'Ожидайте финальную информацию о старте и допуске.',
    adminNextAction: 'Подтвердите допуск к старту, если остальные условия выполнены.',
  },
  [APPLICATION_STATUS.ADMITTED]: {
    value: APPLICATION_STATUS.ADMITTED,
    userLabel: 'Допущен к старту',
    adminLabel: 'Допущен',
    shortLabel: 'Допущен',
    tagType: 'success',
    responsibleActor: APPLICATION_ACTOR.NONE,
    isTerminal: true,
    isActive: false,
    blocksAdmission: false,
    userDescription: 'Участник допущен к соревнованию.',
    adminDescription: 'Финальное положительное решение принято.',
    userNextAction: 'Следуйте информации о старте и расписанию соревнования.',
    adminNextAction: 'Действий не требуется.',
  },
  [APPLICATION_STATUS.WITHDRAWN]: {
    value: APPLICATION_STATUS.WITHDRAWN,
    userLabel: 'Заявка снята',
    adminLabel: 'Снята',
    shortLabel: 'Снята',
    tagType: 'danger',
    responsibleActor: APPLICATION_ACTOR.NONE,
    isTerminal: true,
    isActive: false,
    blocksAdmission: true,
    userDescription: 'Заявка снята с участия.',
    adminDescription: 'Заявка снята и не требует обработки.',
    userNextAction: 'Подайте новую заявку, если регистрация еще открыта.',
    adminNextAction: 'Действий не требуется.',
  },
  [APPLICATION_STATUS.REJECTED]: {
    value: APPLICATION_STATUS.REJECTED,
    userLabel: 'Заявка отклонена',
    adminLabel: 'Отклонена',
    shortLabel: 'Отклонена',
    tagType: 'danger',
    responsibleActor: APPLICATION_ACTOR.NONE,
    isTerminal: true,
    isActive: false,
    blocksAdmission: true,
    userDescription: 'Администратор отклонил заявку.',
    adminDescription: 'Заявка отклонена и не требует обработки.',
    userNextAction: 'Свяжитесь с организатором или подайте новую заявку, если это допустимо.',
    adminNextAction: 'Действий не требуется.',
  },
})

export const APPLICATION_ALLOWED_TRANSITIONS = Object.freeze({
  [APPLICATION_STATUS.SUBMITTED]: [
    APPLICATION_STATUS.REVIEWING,
    APPLICATION_STATUS.NEEDS_FIX,
    APPLICATION_STATUS.APPROVED,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.WITHDRAWN,
  ],
  [APPLICATION_STATUS.REVIEWING]: [
    APPLICATION_STATUS.NEEDS_FIX,
    APPLICATION_STATUS.APPROVED,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.WITHDRAWN,
  ],
  [APPLICATION_STATUS.NEEDS_FIX]: [
    APPLICATION_STATUS.REVIEWING,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.WITHDRAWN,
  ],
  [APPLICATION_STATUS.APPROVED]: [
    APPLICATION_STATUS.PAYMENT_PENDING,
    APPLICATION_STATUS.PAID,
    APPLICATION_STATUS.ADMITTED,
    APPLICATION_STATUS.WITHDRAWN,
  ],
  [APPLICATION_STATUS.PAYMENT_PENDING]: [
    APPLICATION_STATUS.PAID,
    APPLICATION_STATUS.NEEDS_FIX,
    APPLICATION_STATUS.WITHDRAWN,
  ],
  [APPLICATION_STATUS.PAID]: [
    APPLICATION_STATUS.ADMITTED,
    APPLICATION_STATUS.WITHDRAWN,
    APPLICATION_STATUS.REJECTED,
  ],
  [APPLICATION_STATUS.ADMITTED]: [],
  [APPLICATION_STATUS.WITHDRAWN]: [],
  [APPLICATION_STATUS.REJECTED]: [],
})

const APPLICATION_ACTOR_LABELS = Object.freeze({
  [APPLICATION_ACTOR.USER]: 'Пользователь',
  [APPLICATION_ACTOR.ADMIN]: 'Администратор',
  [APPLICATION_ACTOR.NONE]: 'Действий не требуется',
})

export function normalizeApplicationStatus(status) {
  const normalizedStatus = String(status || '')

  if (Object.values(APPLICATION_STATUS).includes(normalizedStatus)) {
    return normalizedStatus
  }

  return APPLICATION_STATUS.SUBMITTED
}

export function getApplicationStatusMeta(status) {
  return APPLICATION_STATUS_META[normalizeApplicationStatus(status)]
}

export function getApplicationStatusOptions({ audience = 'admin' } = {}) {
  return Object.values(APPLICATION_STATUS_META).map((meta) => ({
    value: meta.value,
    label: audience === 'admin' ? meta.adminLabel : meta.userLabel,
  }))
}

export function getApplicationAllowedTransitions(status) {
  return APPLICATION_ALLOWED_TRANSITIONS[normalizeApplicationStatus(status)] || []
}

export function getApplicationTransitionOptions(status, { includeCurrent = true } = {}) {
  const currentStatus = normalizeApplicationStatus(status)
  const transitionStatuses = getApplicationAllowedTransitions(currentStatus)
  const optionStatuses = includeCurrent
    ? [currentStatus, ...transitionStatuses]
    : transitionStatuses

  return optionStatuses.map((optionStatus) => {
    const meta = getApplicationStatusMeta(optionStatus)

    return {
      value: meta.value,
      label: meta.adminLabel,
    }
  })
}

export function isApplicationStatusActive(status) {
  return getApplicationStatusMeta(status).isActive
}

export function isApplicationStatusTerminal(status) {
  return getApplicationStatusMeta(status).isTerminal
}

export function getApplicationStatusLabel(
  status,
  { audience = 'user', short = false } = {},
) {
  const meta = getApplicationStatusMeta(status)

  if (short) {
    return meta.shortLabel
  }

  return audience === 'admin' ? meta.adminLabel : meta.userLabel
}

export function getApplicationStatusTagType(status) {
  return getApplicationStatusMeta(status).tagType
}

export function resolveApplicationLifecycleSummary(
  registration,
  { audience = 'user', documentsStatus = null } = {},
) {
  const meta = getApplicationStatusMeta(registration?.status)
  const isAdminAudience = audience === 'admin'
  const documentDescription = documentsStatus?.description || ''
  const documentLabel = documentsStatus?.label || ''
  const hasBlockingDocuments = ['attention', 'missing'].includes(documentsStatus?.status)
  const nextAction = isAdminAudience ? meta.adminNextAction : meta.userNextAction

  return {
    status: meta.value,
    label: isAdminAudience ? meta.adminLabel : meta.userLabel,
    shortLabel: meta.shortLabel,
    tagType: meta.tagType,
    description: isAdminAudience ? meta.adminDescription : meta.userDescription,
    nextAction: hasBlockingDocuments && audience === 'user' ? documentDescription || nextAction : nextAction,
    responsibleActor: meta.responsibleActor,
    responsibleLabel: APPLICATION_ACTOR_LABELS[meta.responsibleActor],
    isTerminal: meta.isTerminal,
    isActive: meta.isActive,
    blocksAdmission: meta.blocksAdmission || hasBlockingDocuments,
    documentsLabel: documentLabel,
    documentsDescription: documentDescription,
  }
}

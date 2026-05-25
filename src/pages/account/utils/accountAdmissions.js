import { getAccountDocumentsAdmissionStatus } from '@/pages/account/utils/accountFormatters'
import {
  ATHLETE_APPLICATION_STATUS,
  CONSULTATION_STATUS,
} from '@/pages/account/utils/accountConstants'
import {
  getAccountWorkflowId,
  normalizeAccountWorkflowStatus,
} from '@/domains/account-admissions/accountAdmissionMappers'
import {
  loadAccountAdmissionWorkflowForCurrentUser,
  loadAllAccountAdmissionWorkflowForStaff,
  saveAccountAdmission,
} from '@/domains/account-admissions/accountAdmissionRepository'
import {
  readAccountAthleteApplication,
  setCachedAccountAthleteApplications,
} from '@/pages/account/utils/accountAthleteApplications'

let cachedAdmissions = []

function normalizeAdmission(record) {
  if (!record || typeof record !== 'object') {
    return null
  }

  const ownerUserKey = record.ownerUserKey || record.ownerUserId || 'anonymous'
  const scope = record.scope || 'profile'
  const scopeId = record.scopeId || 'profile'

  return {
    id: record.id || getAccountWorkflowId({ ownerUserKey, scope, scopeId }),
    ownerUserId: record.ownerUserId || ownerUserKey,
    ownerUserKey,
    ownerName: record.ownerName || '',
    ownerEmail: record.ownerEmail || '',
    scope,
    scopeId,
    participantName: record.participantName || '',
    participantBirthDate: record.participantBirthDate || '',
    participantClub: record.participantClub || '',
    participantKind: record.participantKind || 'owner',
    status: normalizeAccountWorkflowStatus(record.status),
    note: record.note || '',
    admittedAt: record.admittedAt || '',
    admittedBy: record.admittedBy || '',
    emailNotificationStatus: record.emailNotificationStatus || 'pending',
    emailNotificationAt: record.emailNotificationAt || '',
    createdAt: record.createdAt || record.updatedAt || record.admittedAt || '',
    updatedAt: record.updatedAt || record.admittedAt || '',
  }
}

function replaceCachedAdmission(record) {
  const normalizedRecord = normalizeAdmission(record)

  if (!normalizedRecord) {
    return null
  }

  cachedAdmissions = [
    normalizedRecord,
    ...cachedAdmissions.filter((item) => item.id !== normalizedRecord.id),
  ]

  return normalizedRecord
}

function setCachedAccountAdmissions(records = []) {
  cachedAdmissions = Array.isArray(records) ? records.map(normalizeAdmission).filter(Boolean) : []
}

function setCachedAdmissionWorkflow(workflow = {}) {
  setCachedAccountAthleteApplications(workflow.applications || [])
  setCachedAccountAdmissions(workflow.admissions || [])
}

export function getAccountAdmissionId({ ownerUserKey, scope, scopeId }) {
  return getAccountWorkflowId({ ownerUserKey, scope, scopeId })
}

export async function refreshAccountAdmissionWorkflowForCurrentUser() {
  const workflow = await loadAccountAdmissionWorkflowForCurrentUser()
  setCachedAdmissionWorkflow(workflow)
  return {
    applications: workflow.applications || [],
    admissions: workflow.admissions || [],
  }
}

export async function refreshAllAccountAdmissionWorkflowForStaff() {
  const workflow = await loadAllAccountAdmissionWorkflowForStaff()
  setCachedAdmissionWorkflow(workflow)
  return {
    applications: workflow.applications || [],
    admissions: workflow.admissions || [],
  }
}

export function readAccountAdmissions() {
  return cachedAdmissions
}

export function readAccountAdmission({ ownerUserKey, scope, scopeId }) {
  const admissionId = getAccountWorkflowId({ ownerUserKey, scope, scopeId })
  return cachedAdmissions.find((record) => record.id === admissionId) || null
}

export async function upsertAccountAdmission(record) {
  const normalizedRecord = normalizeAdmission(record)

  if (!normalizedRecord) {
    return null
  }

  const savedRecord = await saveAccountAdmission(normalizedRecord)
  return replaceCachedAdmission(savedRecord)
}

export async function createAccountAdmission({
  ownerUserKey,
  ownerName = '',
  ownerEmail = '',
  scope,
  scopeId,
  participantName = '',
  participantBirthDate = '',
  participantClub = '',
  participantKind = 'owner',
  note = '',
  status = ATHLETE_APPLICATION_STATUS.ADMITTED,
  admittedBy = 'Администратор',
}) {
  const now = new Date().toISOString()

  return upsertAccountAdmission({
    id: getAccountWorkflowId({ ownerUserKey, scope, scopeId }),
    ownerUserId: ownerUserKey,
    ownerUserKey,
    ownerName,
    ownerEmail,
    scope,
    scopeId,
    participantName,
    participantBirthDate,
    participantClub,
    participantKind,
    status,
    note,
    admittedAt: now,
    admittedBy,
    emailNotificationStatus: 'pending',
    emailNotificationAt: '',
    updatedAt: now,
  })
}

function getApplicationStatusMeta(status) {
  if (status === CONSULTATION_STATUS.NEW || status === ATHLETE_APPLICATION_STATUS.NEW) {
    return {
      status,
      label: 'Новая',
      description: 'Заявка только поступила в обработку.',
      tagType: 'danger',
      canAdmit: false,
    }
  }

  if (
    status === CONSULTATION_STATUS.PROCESSED ||
    status === ATHLETE_APPLICATION_STATUS.REVIEWING
  ) {
    return {
      status: CONSULTATION_STATUS.PROCESSED,
      label: 'В работе',
      description: 'Тренер обрабатывает заявку и уточняет данные.',
      tagType: 'warning',
      canAdmit: false,
    }
  }

  if (status === CONSULTATION_STATUS.CALL_BACK) {
    return {
      status,
      label: 'Перезвонить',
      description: 'Нужно связаться с владельцем заявки позже.',
      tagType: 'primary',
      canAdmit: false,
    }
  }

  if (status === CONSULTATION_STATUS.BUSY) {
    return {
      status,
      label: 'Телефон занят',
      description: 'Номер занят, нужно повторить попытку связи.',
      tagType: 'primary',
      canAdmit: false,
    }
  }

  if (status === CONSULTATION_STATUS.UNAVAILABLE) {
    return {
      status,
      label: 'Недоступен',
      description: 'Связаться с владельцем заявки не удалось.',
      tagType: 'info',
      canAdmit: false,
    }
  }

  if (status === CONSULTATION_STATUS.SCHEDULED) {
    return {
      status,
      label: 'Запланирована',
      description: 'Заявка отложена до согласованного времени.',
      tagType: 'warning',
      canAdmit: false,
    }
  }

  if (status === CONSULTATION_STATUS.CLOSED) {
    return {
      status,
      label: 'Закрыта',
      description: 'Заявка завершена.',
      tagType: 'info',
      canAdmit: false,
    }
  }

  if (status === ATHLETE_APPLICATION_STATUS.NEEDS_DATA) {
    return {
      status,
      label: 'Нужны данные',
      description: 'Нужно дополнить или исправить данные заявки.',
      tagType: 'danger',
      canAdmit: false,
    }
  }

  if (status === ATHLETE_APPLICATION_STATUS.READY) {
    return {
      status,
      label: 'Готово',
      description: 'Заявка обработана и готова к финальному действию.',
      tagType: 'success',
      canAdmit: true,
    }
  }

  if (status === ATHLETE_APPLICATION_STATUS.REJECTED) {
    return {
      status,
      label: 'Отклонена',
      description: 'Заявка завершена с отклонением.',
      tagType: 'danger',
      canAdmit: false,
    }
  }

  return {
    status: ATHLETE_APPLICATION_STATUS.ADMITTED,
    label: 'Допущен',
    description: 'Заявка завершена и допущена к дальнейшей работе.',
    tagType: 'success',
    canAdmit: true,
  }
}

export function resolveAccountAdmissionStatus({
  ownerUserKey,
  scope,
  scopeId,
  documents = [],
}) {
  const application = readAccountAthleteApplication({ ownerUserKey, scope, scopeId })
  const documentsStatus = getAccountDocumentsAdmissionStatus(documents)
  const admission = readAccountAdmission({ ownerUserKey, scope, scopeId })
  const activeApplication = application || admission

  if (admission?.status === ATHLETE_APPLICATION_STATUS.ADMITTED) {
    return {
      status: 'admitted',
      label: 'Допущен',
      description: admission?.admittedBy
        ? `Допущен ${admission.admittedBy}`.trim()
        : 'Заявка завершена и допущена к дальнейшей работе.',
      tagType: 'success',
      isFinal: true,
      canAdmit: true,
      finalAdmission: admission,
      note: admission.note || '',
      createdAt: admission.createdAt || '',
      updatedAt: admission.updatedAt || '',
      updatedBy: admission.updatedBy || admission.admittedBy || '',
    }
  }

  if (activeApplication) {
    const applicationStatusMeta = getApplicationStatusMeta(activeApplication.status)

    return {
      ...applicationStatusMeta,
      isFinal: applicationStatusMeta.status === ATHLETE_APPLICATION_STATUS.ADMITTED,
      finalAdmission: admission || activeApplication,
      canAdmit: applicationStatusMeta.canAdmit,
      note: activeApplication.note || '',
      createdAt: activeApplication.createdAt || '',
      updatedAt: activeApplication.updatedAt || '',
      updatedBy: activeApplication.updatedBy || '',
    }
  }

  if (documentsStatus.status !== 'admitted') {
    return {
      ...documentsStatus,
      isFinal: false,
      finalAdmission: admission,
      canAdmit: false,
    }
  }

  return {
    status: admission ? 'admitted' : 'ready',
    label: admission ? 'Допущен' : 'Готов к допуску',
    description: admission
      ? `Допущен секретарём ${admission.admittedAt || ''}`.trim()
      : 'Все документы одобрены. Ожидается финальное решение секретаря.',
    tagType: admission ? 'success' : 'warning',
    isFinal: Boolean(admission),
    canAdmit: true,
    finalAdmission: admission,
  }
}

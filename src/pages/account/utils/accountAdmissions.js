import { getAccountDocumentsAdmissionStatus } from '@/pages/account/utils/accountFormatters'
import {
  ATHLETE_APPLICATION_STATUS,
  CONSULTATION_STATUS,
} from '@/pages/account/utils/accountConstants'
import { readAccountAthleteApplication } from '@/pages/account/utils/accountAthleteApplications'

const ACCOUNT_ADMISSIONS_STORAGE_KEY = 'smartswim:account-admissions:v1'

function readJsonStorage(storageKey, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const serializedValue = window.localStorage.getItem(storageKey)
    return serializedValue ? JSON.parse(serializedValue) : fallback
  } catch {
    return fallback
  }
}

function writeJsonStorage(storageKey, value) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value))
  } catch {
    // Ignore storage errors in the temporary local workflow.
  }
}

export function getAccountAdmissionId({ ownerUserKey, scope, scopeId }) {
  return [ownerUserKey || 'anonymous', scope || 'profile', scopeId || 'profile'].join(':')
}

function normalizeAdmission(record) {
  if (!record || typeof record !== 'object') {
    return null
  }

  const allowedStatuses = new Set([
    ...Object.values(ATHLETE_APPLICATION_STATUS),
    ...Object.values(CONSULTATION_STATUS),
  ])
  const normalizedStatus = allowedStatuses.has(record.status)
    ? record.status
    : CONSULTATION_STATUS.NEW

  return {
    id: record.id || getAccountAdmissionId(record),
    ownerUserKey: record.ownerUserKey || 'anonymous',
    ownerName: record.ownerName || '',
    ownerEmail: record.ownerEmail || '',
    scope: record.scope || 'profile',
    scopeId: record.scopeId || 'profile',
    participantName: record.participantName || '',
    participantBirthDate: record.participantBirthDate || '',
    participantClub: record.participantClub || '',
    participantKind: record.participantKind || 'owner',
    status: normalizedStatus,
    note: record.note || '',
    admittedAt: record.admittedAt || '',
    admittedBy: record.admittedBy || '',
    emailNotificationStatus: record.emailNotificationStatus || 'pending',
    emailNotificationAt: record.emailNotificationAt || '',
    createdAt: record.createdAt || record.updatedAt || record.admittedAt || '',
    updatedAt: record.updatedAt || record.admittedAt || '',
  }
}

export function readAccountAdmissions() {
  const records = readJsonStorage(ACCOUNT_ADMISSIONS_STORAGE_KEY, [])
  return Array.isArray(records) ? records.map(normalizeAdmission).filter(Boolean) : []
}

export function readAccountAdmission({ ownerUserKey, scope, scopeId }) {
  const admissionId = getAccountAdmissionId({ ownerUserKey, scope, scopeId })
  return readAccountAdmissions().find((record) => record.id === admissionId) || null
}

export function upsertAccountAdmission(record) {
  const normalizedRecord = normalizeAdmission(record)

  if (!normalizedRecord) {
    return null
  }

  const records = readAccountAdmissions().filter((item) => item.id !== normalizedRecord.id)
  records.unshift(normalizedRecord)
  writeJsonStorage(ACCOUNT_ADMISSIONS_STORAGE_KEY, records)
  return normalizedRecord
}

export function createAccountAdmission({
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
    id: getAccountAdmissionId({ ownerUserKey, scope, scopeId }),
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

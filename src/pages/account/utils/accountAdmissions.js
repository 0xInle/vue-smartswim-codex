import { getAccountDocumentsAdmissionStatus } from '@/pages/account/utils/accountFormatters'

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
    status: record.status || 'admitted',
    admittedAt: record.admittedAt || '',
    admittedBy: record.admittedBy || '',
    emailNotificationStatus: record.emailNotificationStatus || 'pending',
    emailNotificationAt: record.emailNotificationAt || '',
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
    status: 'admitted',
    admittedAt: now,
    admittedBy,
    emailNotificationStatus: 'pending',
    emailNotificationAt: '',
    updatedAt: now,
  })
}

export function resolveAccountAdmissionStatus({
  ownerUserKey,
  scope,
  scopeId,
  documents = [],
}) {
  const documentsStatus = getAccountDocumentsAdmissionStatus(documents)
  const admission = readAccountAdmission({ ownerUserKey, scope, scopeId })

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

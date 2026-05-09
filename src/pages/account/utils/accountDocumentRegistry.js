import { ACCOUNT_DOCUMENT_TYPES, ACCOUNT_DOCUMENT_STATUS } from '@/pages/account/utils/accountDocumentTypes'

const ACCOUNT_DOCUMENT_REVIEW_STORAGE_KEY = 'smartswim:account-document-reviews:v1'

function resolveCurrentUser(currentUser) {
  return currentUser?.value || currentUser || null
}

function getCurrentUserKey(currentUser) {
  const resolvedUser = resolveCurrentUser(currentUser)

  return resolvedUser?.id || resolvedUser?.email || 'anonymous'
}

function readJsonStorage(storageKey, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const serializedValue = window.localStorage.getItem(storageKey)

    if (!serializedValue) {
      return fallback
    }

    return JSON.parse(serializedValue)
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
    // Ignore storage quota and serialization errors in the mock document registry.
  }
}

function normalizeDocuments(documents) {
  const nextDocuments = Array.isArray(documents) ? documents : []

  return ACCOUNT_DOCUMENT_TYPES.map((definition) => {
    const existing = nextDocuments.find((document) => document?.type === definition.type)

    return {
      type: definition.type,
      label: definition.label,
      hint: definition.hint,
      status: existing?.status || ACCOUNT_DOCUMENT_STATUS.MISSING,
      fileName: existing?.fileName || '',
      fileSize: existing?.fileSize || 0,
      fileType: existing?.fileType || '',
      fileDataUrl: existing?.fileDataUrl || '',
      uploadedAt: existing?.uploadedAt || '',
      expiresAt: existing?.expiresAt || '',
      verifiedAt: existing?.verifiedAt || '',
      verifiedBy: existing?.verifiedBy || '',
      rejectionReason: existing?.rejectionReason || '',
    }
  })
}

export function getAccountDocumentReviewRecordId({
  ownerUserKey,
  scope,
  scopeId,
  documentType,
}) {
  return [ownerUserKey || 'anonymous', scope || 'profile', scopeId || 'general', documentType || '']
    .join(':')
}

export function readAccountDocumentReviewRecords() {
  const records = readJsonStorage(ACCOUNT_DOCUMENT_REVIEW_STORAGE_KEY, [])

  return Array.isArray(records) ? records.filter((record) => record && typeof record === 'object') : []
}

function writeAccountDocumentReviewRecords(records) {
  writeJsonStorage(ACCOUNT_DOCUMENT_REVIEW_STORAGE_KEY, records)
}

function normalizeAccountDocumentReviewRecord(record) {
  if (!record || typeof record !== 'object') {
    return null
  }

  return {
    id: record.id || getAccountDocumentReviewRecordId(record),
    ownerUserKey: record.ownerUserKey || 'anonymous',
    ownerName: record.ownerName || '',
    ownerEmail: record.ownerEmail || '',
    ownerPhone: record.ownerPhone || '',
    scope: record.scope || 'profile',
    scopeId: record.scopeId || 'general',
    participantName: record.participantName || '',
    participantBirthDate: record.participantBirthDate || '',
    participantClub: record.participantClub || '',
    participantKind: record.participantKind || 'owner',
    documentType: record.documentType || '',
    documentLabel: record.documentLabel || '',
    documentHint: record.documentHint || '',
    status: record.status || ACCOUNT_DOCUMENT_STATUS.MISSING,
    fileName: record.fileName || '',
    fileSize: record.fileSize || 0,
    fileType: record.fileType || '',
    fileDataUrl: record.fileDataUrl || '',
    uploadedAt: record.uploadedAt || '',
    expiresAt: record.expiresAt || '',
    verifiedAt: record.verifiedAt || '',
    verifiedBy: record.verifiedBy || '',
    rejectionReason: record.rejectionReason || '',
    reviewedAt: record.reviewedAt || '',
    reviewedBy: record.reviewedBy || '',
  }
}

export function upsertAccountDocumentReviewRecord(record) {
  const normalizedRecord = normalizeAccountDocumentReviewRecord(record)

  if (!normalizedRecord) {
    return null
  }

  const records = readAccountDocumentReviewRecords()
  const nextId = normalizedRecord.id || getAccountDocumentReviewRecordId(normalizedRecord)
  const nextRecord = {
    ...normalizedRecord,
    id: nextId,
  }
  const nextRecords = records.filter((item) => item.id !== nextId)

  nextRecords.unshift(nextRecord)
  writeAccountDocumentReviewRecords(nextRecords)

  return nextRecord
}

export function removeAccountDocumentReviewRecords({ currentUser, scope, scopeId }) {
  const ownerUserKey = getCurrentUserKey(currentUser)
  const records = readAccountDocumentReviewRecords()
  const nextRecords = records.filter(
    (record) =>
      !(
        record.ownerUserKey === ownerUserKey &&
        record.scope === scope &&
        record.scopeId === scopeId
      ),
  )

  writeAccountDocumentReviewRecords(nextRecords)
}

function buildRecordFromDocument({
  ownerUserKey,
  ownerName,
  ownerEmail,
  ownerPhone,
  scope,
  scopeId,
  participantName,
  participantBirthDate,
  participantClub,
  participantKind,
  document,
  reviewerName = '',
}) {
  if (!document) {
    return null
  }

  return normalizeAccountDocumentReviewRecord({
    id: getAccountDocumentReviewRecordId({
      ownerUserKey,
      scope,
      scopeId,
      documentType: document.type,
    }),
    ownerUserKey,
    ownerName,
    ownerEmail,
    ownerPhone,
    scope,
    scopeId,
    participantName,
    participantBirthDate,
    participantClub,
    participantKind,
    documentType: document.type,
    documentLabel: document.label,
    documentHint: document.hint,
    status: document.status,
    fileName: document.fileName,
    fileSize: document.fileSize,
    fileType: document.fileType,
    fileDataUrl: document.fileDataUrl,
    uploadedAt: document.uploadedAt,
    expiresAt: document.expiresAt,
    verifiedAt: document.verifiedAt,
    verifiedBy: document.verifiedBy,
    rejectionReason: document.rejectionReason,
    reviewedAt: document.verifiedAt || document.uploadedAt || '',
    reviewedBy: reviewerName || document.verifiedBy || '',
  })
}

export function seedAccountDocumentReviewRecords({
  currentUser,
  ownerName = '',
  ownerEmail = '',
  ownerPhone = '',
  scope,
  scopeId,
  participantName = '',
  participantBirthDate = '',
  participantClub = '',
  participantKind = 'owner',
  documents = [],
}) {
  const ownerUserKey = getCurrentUserKey(currentUser)
  const nextDocuments = normalizeDocuments(documents)
  const records = readAccountDocumentReviewRecords()
  const existingRecordIds = new Set(records.map((record) => record.id))
  const nextRecords = [...records]

  nextDocuments.forEach((document) => {
    if (document.status === ACCOUNT_DOCUMENT_STATUS.MISSING) {
      return
    }

    const nextRecord = buildRecordFromDocument({
      ownerUserKey,
      ownerName,
      ownerEmail,
      ownerPhone,
      scope,
      scopeId,
      participantName,
      participantBirthDate,
      participantClub,
      participantKind,
      document,
    })

    if (!nextRecord || existingRecordIds.has(nextRecord.id)) {
      return
    }

    existingRecordIds.add(nextRecord.id)
    nextRecords.unshift(nextRecord)
  })

  writeAccountDocumentReviewRecords(nextRecords)
}

export function syncAccountDocumentReviewRecords({
  currentUser,
  ownerName = '',
  ownerEmail = '',
  ownerPhone = '',
  scope,
  scopeId,
  participantName = '',
  participantBirthDate = '',
  participantClub = '',
  participantKind = 'owner',
  documents = [],
  reviewerName = '',
}) {
  const ownerUserKey = getCurrentUserKey(currentUser)
  const nextDocuments = normalizeDocuments(documents)
  const records = readAccountDocumentReviewRecords()
  const recordById = new Map(records.map((record) => [record.id, record]))

  nextDocuments.forEach((document) => {
    const recordId = getAccountDocumentReviewRecordId({
      ownerUserKey,
      scope,
      scopeId,
      documentType: document.type,
    })

    if (document.status === ACCOUNT_DOCUMENT_STATUS.MISSING) {
      recordById.delete(recordId)
      return
    }

    const nextRecord = buildRecordFromDocument({
      ownerUserKey,
      ownerName,
      ownerEmail,
      ownerPhone,
      scope,
      scopeId,
      participantName,
      participantBirthDate,
      participantClub,
      participantKind,
      document,
      reviewerName,
    })

    if (!nextRecord) {
      return
    }

    recordById.set(nextRecord.id, nextRecord)
  })

  const nextRecords = Array.from(recordById.values()).sort((left, right) => {
    const leftTime = Date.parse(left.reviewedAt || left.uploadedAt || 0) || 0
    const rightTime = Date.parse(right.reviewedAt || right.uploadedAt || 0) || 0

    return rightTime - leftTime
  })

  writeAccountDocumentReviewRecords(nextRecords)
}

export function mergeDocumentsWithReviewRecords({
  currentUser,
  scope,
  scopeId,
  documents = [],
}) {
  const ownerUserKey = getCurrentUserKey(currentUser)
  const nextDocuments = normalizeDocuments(documents)
  const records = readAccountDocumentReviewRecords()
  const recordById = new Map(
    records.map((record) => [
      record.id,
      record,
    ]),
  )

  return nextDocuments.map((document) => {
    const recordId = getAccountDocumentReviewRecordId({
      ownerUserKey,
      scope,
      scopeId,
      documentType: document.type,
    })
    const reviewRecord = recordById.get(recordId)

    if (!reviewRecord) {
      return document
    }

    return {
      ...document,
      status: reviewRecord.status || document.status,
      fileName: reviewRecord.fileName || document.fileName,
      fileSize: reviewRecord.fileSize || document.fileSize,
      fileType: reviewRecord.fileType || document.fileType,
      fileDataUrl: reviewRecord.fileDataUrl || document.fileDataUrl,
      uploadedAt: reviewRecord.uploadedAt || document.uploadedAt,
      expiresAt: reviewRecord.expiresAt || document.expiresAt,
      verifiedAt: reviewRecord.verifiedAt || document.verifiedAt,
      verifiedBy: reviewRecord.verifiedBy || document.verifiedBy,
      rejectionReason: reviewRecord.rejectionReason || document.rejectionReason,
    }
  })
}

export function getAccountDocumentReviewSummary(records = []) {
  const normalizedRecords = Array.isArray(records) ? records : []

  return {
    total: normalizedRecords.length,
    pending: normalizedRecords.filter((record) => record.status === ACCOUNT_DOCUMENT_STATUS.UPLOADED)
      .length,
    verified: normalizedRecords.filter((record) => record.status === ACCOUNT_DOCUMENT_STATUS.VERIFIED)
      .length,
    rejected: normalizedRecords.filter((record) =>
      [ACCOUNT_DOCUMENT_STATUS.REJECTED, ACCOUNT_DOCUMENT_STATUS.NEEDS_REUPLOAD].includes(
        record.status,
      ),
    ).length,
  }
}

export function getAccountDocumentReviewRecordsForAdmin({
  search = '',
  statusFilter = 'all',
  scopeFilter = 'all',
} = {}) {
  const normalizedSearch = String(search || '')
    .trim()
    .toLowerCase()
  const records = readAccountDocumentReviewRecords()

  return records.filter((record) => {
    if (statusFilter !== 'all' && record.status !== statusFilter) {
      return false
    }

    if (scopeFilter !== 'all' && record.scope !== scopeFilter) {
      return false
    }

    if (!normalizedSearch) {
      return true
    }

    const haystack = [
      record.ownerName,
      record.ownerEmail,
      record.ownerPhone,
      record.participantName,
      record.participantBirthDate,
      record.participantClub,
      record.documentLabel,
      record.documentType,
      record.fileName,
      record.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedSearch)
  })
}

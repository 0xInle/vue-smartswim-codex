import {
  ACCOUNT_DOCUMENT_STATUS,
  getAccountDocumentDefinition,
  normalizeAccountDocumentState,
} from '@/pages/account/utils/accountDocumentTypes'

const DOCUMENT_INSERT_FIELD_MAP = Object.freeze({
  ownerEmail: 'owner_email',
  ownerName: 'owner_name',
  ownerPhone: 'owner_phone',
  participantKind: 'participant_kind',
  participantId: 'participant_id',
  scope: 'scope',
  scopeId: 'scope_id',
  documentType: 'document_type',
  documentLabel: 'document_label',
  documentHint: 'document_hint',
  status: 'status',
  fileName: 'file_name',
  fileSize: 'file_size',
  fileType: 'file_type',
  fileUrl: 'file_url',
  storagePath: 'storage_path',
  uploadedAt: 'uploaded_at',
  expiresAt: 'expires_at',
  reviewedAt: 'reviewed_at',
  reviewedByName: 'reviewed_by_name',
  rejectionReason: 'rejection_reason',
})

const DOCUMENT_UPDATE_FIELD_MAP = Object.freeze({
  ownerEmail: 'owner_email',
  ownerName: 'owner_name',
  ownerPhone: 'owner_phone',
  participantKind: 'participant_kind',
  participantId: 'participant_id',
  documentLabel: 'document_label',
  documentHint: 'document_hint',
  status: 'status',
  fileName: 'file_name',
  fileSize: 'file_size',
  fileType: 'file_type',
  fileUrl: 'file_url',
  storagePath: 'storage_path',
  uploadedAt: 'uploaded_at',
  expiresAt: 'expires_at',
  reviewedAt: 'reviewed_at',
  reviewedBy: 'reviewed_by',
  reviewedByName: 'reviewed_by_name',
  rejectionReason: 'rejection_reason',
})

function assignMappedFields(target, source, fieldMap) {
  Object.entries(fieldMap).forEach(([sourceKey, targetKey]) => {
    if (Object.prototype.hasOwnProperty.call(source, sourceKey)) {
      target[targetKey] = source[sourceKey] ?? null
    }
  })

  return target
}

function normalizeDocumentStatus(status) {
  return Object.values(ACCOUNT_DOCUMENT_STATUS).includes(status)
    ? status
    : ACCOUNT_DOCUMENT_STATUS.MISSING
}

function normalizeDateOnly(value) {
  if (!value) {
    return null
  }

  const dateValue = String(value)

  return dateValue.includes('T') ? dateValue.slice(0, 10) : dateValue
}

function buildParticipantSnapshot(document = {}) {
  return {
    name: document.participantName || '',
    birthDate: document.participantBirthDate || '',
    club: document.participantClub || '',
    kind: document.participantKind || '',
  }
}

export function mapSupabaseAccountDocumentRow(row = {}) {
  const definition = getAccountDocumentDefinition(row.document_type) || {
    type: row.document_type || '',
    label: row.document_label || '',
    hint: row.document_hint || '',
  }
  const participantSnapshot = row.participant_snapshot || {}
  const document = normalizeAccountDocumentState(
    {
      type: row.document_type,
      label: row.document_label,
      hint: row.document_hint,
      status: normalizeDocumentStatus(row.status),
      fileName: row.file_name || '',
      fileSize: row.file_size || 0,
      fileType: row.file_type || '',
      fileDataUrl: '',
      fileUrl: row.file_url || '',
      storagePath: row.storage_path || '',
      uploadedAt: row.uploaded_at || '',
      expiresAt: row.expires_at || '',
      verifiedAt: row.status === ACCOUNT_DOCUMENT_STATUS.VERIFIED ? row.reviewed_at || '' : '',
      verifiedBy: row.reviewed_by_name || '',
      rejectionReason: row.rejection_reason || '',
    },
    definition,
  )

  return {
    ...document,
    id: row.id || '',
    ownerUserId: row.owner_user_id || '',
    ownerUserKey: row.owner_user_id || '',
    ownerEmail: row.owner_email || '',
    ownerName: row.owner_name || '',
    ownerPhone: row.owner_phone || '',
    participantKind: row.participant_kind || 'owner',
    participantId: row.participant_id || 'profile',
    participantName: participantSnapshot.name || '',
    participantBirthDate: participantSnapshot.birthDate || participantSnapshot.birth_date || '',
    participantClub: participantSnapshot.club || '',
    scope: row.scope || 'profile',
    scopeId: row.scope_id || 'profile',
    documentType: row.document_type || document.type,
    documentLabel: row.document_label || document.label,
    documentHint: row.document_hint || document.hint,
    fileUrl: row.file_url || '',
    storagePath: row.storage_path || '',
    reviewedAt: row.reviewed_at || '',
    reviewedBy: row.reviewed_by || '',
    reviewedByName: row.reviewed_by_name || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  }
}

export function mapAccountDocumentUpsertPayload(
  document = {},
  { ownerUserId = '', currentUser = null, scope = 'profile', scopeId = 'profile' } = {},
) {
  const documentType = document.documentType || document.type || ''
  const definition = getAccountDocumentDefinition(documentType)
  const normalizedDocument = definition
    ? normalizeAccountDocumentState(document, definition)
    : {
        ...document,
        type: documentType,
        label: document.documentLabel || document.label || '',
        hint: document.documentHint || document.hint || '',
        status: normalizeDocumentStatus(document.status),
      }
  const payload = assignMappedFields(
    {},
    {
      ...document,
      ownerEmail: document.ownerEmail || currentUser?.email || '',
      ownerName: document.ownerName || currentUser?.name || '',
      ownerPhone: document.ownerPhone || currentUser?.phone || '',
      participantKind: document.participantKind || (scope === 'athlete' ? 'athlete' : 'owner'),
      participantId: document.participantId || scopeId || 'profile',
      scope,
      scopeId,
      documentType,
      documentLabel: document.documentLabel || normalizedDocument.label || '',
      documentHint: document.documentHint || normalizedDocument.hint || '',
      status: normalizeDocumentStatus(normalizedDocument.status),
      fileName: normalizedDocument.fileName || '',
      fileSize: normalizedDocument.fileSize || 0,
      fileType: normalizedDocument.fileType || '',
      fileUrl: document.fileUrl || '',
      storagePath: document.storagePath || '',
      uploadedAt: normalizedDocument.uploadedAt || null,
      expiresAt: normalizeDateOnly(normalizedDocument.expiresAt),
      reviewedAt: document.reviewedAt || normalizedDocument.verifiedAt || null,
      reviewedByName: document.reviewedByName || normalizedDocument.verifiedBy || '',
      rejectionReason: normalizedDocument.rejectionReason || '',
    },
    DOCUMENT_INSERT_FIELD_MAP,
  )

  payload.owner_user_id = ownerUserId || null
  payload.participant_snapshot = buildParticipantSnapshot(document)

  return payload
}

export function mapAccountDocumentUpdatePayload(patch = {}) {
  const normalizedPatch = {
    ...patch,
    documentType: patch.documentType || patch.type,
    documentLabel: patch.documentLabel || patch.label,
    documentHint: patch.documentHint || patch.hint,
    fileName: patch.fileName,
    fileSize: patch.fileSize,
    fileType: patch.fileType,
    fileUrl: patch.fileUrl,
    storagePath: patch.storagePath,
    uploadedAt: patch.uploadedAt,
    expiresAt: normalizeDateOnly(patch.expiresAt),
    reviewedAt: patch.reviewedAt || patch.verifiedAt,
    reviewedByName: patch.reviewedByName || patch.verifiedBy,
    rejectionReason: patch.rejectionReason,
  }

  if (patch.status) {
    normalizedPatch.status = normalizeDocumentStatus(patch.status)
  }

  return assignMappedFields({}, normalizedPatch, DOCUMENT_UPDATE_FIELD_MAP)
}

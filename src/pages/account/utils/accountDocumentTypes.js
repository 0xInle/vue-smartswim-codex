export const ACCOUNT_DOCUMENT_TYPES = Object.freeze([
  {
    type: 'passport_front',
    label: 'Паспорт, 1 страница',
    hint: 'Первая страница паспорта или свидетельства.',
  },
  {
    type: 'passport_back',
    label: 'Паспорт, 2 страница (регистрация)',
    hint: 'Страница с регистрацией или вторым разворотом.',
  },
  {
    type: 'medical_certificate',
    label: 'Медицинское заключение для участия в соревнованиях',
    hint: 'Справка о допуске к соревнованиям.',
  },
  {
    type: 'personal_data_consent',
    label: 'Согласие на обработку персональных данных',
    hint: 'Согласие на обработку персональных данных.',
  },
  {
    type: 'accident_insurance',
    label: 'Полис страхования от несчастных случаев',
    hint: 'Полис страхования от несчастных случаев.',
  },
])

export const ACCOUNT_DOCUMENT_STATUS = Object.freeze({
  MISSING: 'missing',
  UPLOADED: 'uploaded',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  NEEDS_REUPLOAD: 'needs_reupload',
})

export function getAccountDocumentDefinition(documentType) {
  return ACCOUNT_DOCUMENT_TYPES.find((item) => item.type === documentType) || null
}

export function createAccountDocumentState(definition) {
  return {
    type: definition.type,
    label: definition.label,
    hint: definition.hint,
    status: ACCOUNT_DOCUMENT_STATUS.MISSING,
    fileName: '',
    fileSize: 0,
    fileType: '',
    fileDataUrl: '',
    uploadedAt: '',
    expiresAt: '',
    verifiedAt: '',
    verifiedBy: '',
    rejectionReason: '',
  }
}

export function normalizeAccountDocumentState(document, definition) {
  const fallback = createAccountDocumentState(definition)
  const allowedStatuses = Object.values(ACCOUNT_DOCUMENT_STATUS)

  return {
    ...fallback,
    ...document,
    type: definition.type,
    label: definition.label,
    hint: definition.hint,
    status: allowedStatuses.includes(document?.status)
      ? document.status
      : fallback.status,
    fileDataUrl: typeof document?.fileDataUrl === 'string' ? document.fileDataUrl : '',
    fileType: typeof document?.fileType === 'string' ? document.fileType : '',
  }
}

export function createAccountDocumentsState() {
  return ACCOUNT_DOCUMENT_TYPES.map((definition) => createAccountDocumentState(definition))
}

export function normalizeAccountDocumentsState(documents = []) {
  const nextDocuments = Array.isArray(documents) ? documents : []

  return ACCOUNT_DOCUMENT_TYPES.map((definition) => {
    const existing = nextDocuments.find((document) => document?.type === definition.type)
    return normalizeAccountDocumentState(existing, definition)
  })
}

export function getAccountDocumentsStatusMeta(documents = []) {
  const normalizedDocuments = Array.isArray(documents) ? documents : []
  const documentCount = normalizedDocuments.length
  const missingCount = normalizedDocuments.filter(
    (document) => document.status === ACCOUNT_DOCUMENT_STATUS.MISSING,
  ).length
  const loadedCount = normalizedDocuments.filter(
    (document) => document.status !== ACCOUNT_DOCUMENT_STATUS.MISSING,
  ).length
  const hasPendingDocuments = normalizedDocuments.some(
    (document) => document.status === ACCOUNT_DOCUMENT_STATUS.UPLOADED,
  )
  const hasRejectedDocuments = normalizedDocuments.some(
    (document) => document.status === ACCOUNT_DOCUMENT_STATUS.REJECTED,
  )
  const hasReuploadRequests = normalizedDocuments.some(
    (document) => document.status === ACCOUNT_DOCUMENT_STATUS.NEEDS_REUPLOAD,
  )
  const allDocumentsLoaded = documentCount > 0 && missingCount === 0

  if (hasRejectedDocuments) {
    return {
      label: 'Есть отклоненные',
      tagType: 'danger',
      loadedCount,
      documentCount,
    }
  }

  if (hasReuploadRequests) {
    return {
      label: 'Нужно обновить',
      tagType: 'warning',
      loadedCount,
      documentCount,
    }
  }

  if (allDocumentsLoaded) {
    return {
      label: `${loadedCount}/${documentCount} загружено`,
      tagType: 'success',
      loadedCount,
      documentCount,
    }
  }

  if (hasPendingDocuments) {
    return {
      label: `${loadedCount}/${documentCount} загружено`,
      tagType: 'warning',
      loadedCount,
      documentCount,
    }
  }

  return {
    label: 'Документы не загружены',
    tagType: 'info',
    loadedCount,
    documentCount,
  }
}

export function getAccountDocumentStatusMeta(status) {
  if (status === ACCOUNT_DOCUMENT_STATUS.VERIFIED) {
    return {
      label: 'Одобрен',
      tagType: 'success',
    }
  }

  if (status === ACCOUNT_DOCUMENT_STATUS.REJECTED) {
    return {
      label: 'Отклонен',
      tagType: 'danger',
    }
  }

  if (status === ACCOUNT_DOCUMENT_STATUS.NEEDS_REUPLOAD) {
    return {
      label: 'Нужно обновить',
      tagType: 'warning',
    }
  }

  if (status === ACCOUNT_DOCUMENT_STATUS.UPLOADED) {
    return {
      label: 'На проверке',
      tagType: 'warning',
    }
  }

  return {
    label: 'Документ не загружен',
    tagType: 'info',
  }
}

export function isAccountDocumentVerified(document) {
  return document?.status === ACCOUNT_DOCUMENT_STATUS.VERIFIED
}

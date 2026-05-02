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

export function getAccountDocumentDefinition(documentType) {
  return ACCOUNT_DOCUMENT_TYPES.find((item) => item.type === documentType) || null
}

export function createAccountDocumentState(definition) {
  return {
    type: definition.type,
    label: definition.label,
    hint: definition.hint,
    status: 'missing',
    fileName: '',
    fileSize: 0,
    uploadedAt: '',
    expiresAt: '',
    verifiedAt: '',
    verifiedBy: '',
  }
}

export function normalizeAccountDocumentState(document, definition) {
  const fallback = createAccountDocumentState(definition)

  return {
    ...fallback,
    ...(document || {}),
    type: definition.type,
    label: definition.label,
    hint: definition.hint,
    status: ['missing', 'uploaded', 'verified', 'rejected'].includes(document?.status)
      ? document.status
      : fallback.status,
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
  const missingCount = normalizedDocuments.filter((document) => document.status === 'missing').length
  const loadedCount = normalizedDocuments.filter((document) => document.status !== 'missing').length
  const hasPendingDocuments = normalizedDocuments.some((document) => document.status === 'uploaded')
  const hasRejectedDocuments = normalizedDocuments.some((document) => document.status === 'rejected')
  const allDocumentsLoaded = documentCount > 0 && missingCount === 0

  if (hasRejectedDocuments) {
    return {
      label: 'Есть отклонённые',
      tagType: 'danger',
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

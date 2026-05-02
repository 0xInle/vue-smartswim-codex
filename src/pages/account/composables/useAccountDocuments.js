import { computed, reactive, ref, watch } from 'vue'
import {
  ACCOUNT_DOCUMENT_TYPES,
  createAccountDocumentState,
  normalizeAccountDocumentState,
  getAccountDocumentsStatusMeta,
} from '@/pages/account/utils/accountDocumentTypes'

const ACCOUNT_DOCUMENT_STORAGE_PREFIX = 'smartswim:account-documents:v1'

function getCurrentUserKey(currentUser) {
  return currentUser?.id || currentUser?.email || 'anonymous'
}

function createStorageKey({ currentUserKey, scope, scopeId }) {
  return [ACCOUNT_DOCUMENT_STORAGE_PREFIX, scope, currentUserKey, scopeId || 'general'].join(':')
}

export function useAccountDocuments({ currentUser, scope, scopeId }) {
  const documents = ref([])
  const uploadDialogState = reactive({
    isOpen: false,
    documentType: '',
    fileName: '',
    fileSize: 0,
    expiresAt: '',
  })

  const currentUserKey = computed(() => getCurrentUserKey(currentUser?.value || currentUser))
  const resolvedScope = computed(() => scope || 'profile')
  const resolvedScopeId = computed(() => scopeId?.value || scopeId || 'general')
  const storageKey = computed(() =>
    createStorageKey({
      currentUserKey: currentUserKey.value,
      scope: resolvedScope.value,
      scopeId: resolvedScopeId.value,
    }),
  )

  const documentCount = computed(() => documents.value.length)
  const loadedDocumentCount = computed(
    () => documents.value.filter((document) => document.status !== 'missing').length,
  )
  const verifiedDocumentCount = computed(
    () => documents.value.filter((document) => document.status === 'verified').length,
  )
  const missingDocumentCount = computed(
    () => documents.value.filter((document) => document.status === 'missing').length,
  )
  const allDocumentsLoaded = computed(
    () => documentCount.value > 0 && missingDocumentCount.value === 0,
  )
  const hasPendingDocuments = computed(
    () => documents.value.some((document) => document.status === 'uploaded'),
  )
  const hasRejectedDocuments = computed(
    () => documents.value.some((document) => document.status === 'rejected'),
  )

  function createInitialDocuments() {
    return ACCOUNT_DOCUMENT_TYPES.map((definition) => createAccountDocumentState(definition))
  }

  function loadDocuments() {
    if (typeof window === 'undefined') {
      documents.value = createInitialDocuments()
      return
    }

    try {
      const serialized = window.localStorage.getItem(storageKey.value)

      if (!serialized) {
        documents.value = createInitialDocuments()
        return
      }

      const parsed = JSON.parse(serialized)
      const nextDocuments = Array.isArray(parsed) ? parsed : []

      documents.value = ACCOUNT_DOCUMENT_TYPES.map((definition) => {
        const existing = nextDocuments.find((document) => document?.type === definition.type)
        return normalizeAccountDocumentState(existing, definition)
      })
    } catch {
      documents.value = createInitialDocuments()
    }
  }

  function persistDocuments() {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(storageKey.value, JSON.stringify(documents.value))
  }

  function openUploadDialog(documentType) {
    const target = documents.value.find((document) => document.type === documentType)

    if (!target) {
      return
    }

    uploadDialogState.isOpen = true
    uploadDialogState.documentType = documentType
    uploadDialogState.fileName = target.fileName || ''
    uploadDialogState.fileSize = target.fileSize || 0
    uploadDialogState.expiresAt = target.expiresAt || ''
  }

  function closeUploadDialog() {
    uploadDialogState.isOpen = false
    uploadDialogState.documentType = ''
    uploadDialogState.fileName = ''
    uploadDialogState.fileSize = 0
    uploadDialogState.expiresAt = ''
  }

  function upsertDocument(documentType, patch) {
    const index = documents.value.findIndex((document) => document.type === documentType)

    if (index === -1) {
      return
    }

    documents.value[index] = {
      ...documents.value[index],
      ...patch,
    }
  }

  function handleUploadSubmit({ file, expiresAt }) {
    if (!uploadDialogState.documentType || !file) {
      return
    }

    upsertDocument(uploadDialogState.documentType, {
      status: 'uploaded',
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      expiresAt: expiresAt || '',
      verifiedAt: '',
      verifiedBy: '',
    })

    persistDocuments()
    closeUploadDialog()
  }

  function handleDocumentRemove(documentType) {
    upsertDocument(documentType, {
      status: 'missing',
      fileName: '',
      fileSize: 0,
      uploadedAt: '',
      expiresAt: '',
      verifiedAt: '',
      verifiedBy: '',
    })

    persistDocuments()
  }

  function markDocumentVerified(documentType, verifier = 'Секретарь') {
    upsertDocument(documentType, {
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      verifiedBy: verifier,
    })

    persistDocuments()
  }

  function resetDocuments() {
    documents.value = createInitialDocuments()
    persistDocuments()
  }

  function getDocumentState(documentType) {
    return documents.value.find((document) => document.type === documentType) || null
  }

  function getDocumentsStatusLabel() {
    return getAccountDocumentsStatusMeta(documents.value).label
  }

  watch(storageKey, loadDocuments, { immediate: true })

  watch(
    documents,
    () => {
      persistDocuments()
    },
    { deep: true },
  )

  return {
    documents,
    uploadDialogState,
    documentCount,
    loadedDocumentCount,
    verifiedDocumentCount,
    missingDocumentCount,
    allDocumentsLoaded,
    hasPendingDocuments,
    hasRejectedDocuments,
    getDocumentState,
    getDocumentsStatusLabel,
    openUploadDialog,
    closeUploadDialog,
    handleUploadSubmit,
    handleDocumentRemove,
    markDocumentVerified,
    resetDocuments,
  }
}

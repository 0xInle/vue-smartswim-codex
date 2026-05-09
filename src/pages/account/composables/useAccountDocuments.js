import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessageBox } from 'element-plus'
import {
  ACCOUNT_DOCUMENT_TYPES,
  ACCOUNT_DOCUMENT_STATUS,
  createAccountDocumentState,
  normalizeAccountDocumentState,
} from '@/pages/account/utils/accountDocumentTypes'
import { showToast } from '@/utils/toast'
import {
  mergeDocumentsWithReviewRecords,
  seedAccountDocumentReviewRecords,
  syncAccountDocumentReviewRecords,
} from '@/pages/account/utils/accountDocumentRegistry'
import { getAccountDocumentsAdmissionStatus } from '@/pages/account/utils/accountFormatters'
import { readAccountProfileSnapshot } from '@/pages/account/utils/accountLocalStorage'

const ACCOUNT_DOCUMENT_STORAGE_PREFIX = 'smartswim:account-documents:v1'
const ACCOUNT_DOCUMENT_SHARED_STORAGE_PREFIX = 'smartswim:account-documents:shared:v1'

function getCurrentUserKey(currentUser) {
  return currentUser?.id || currentUser?.email || 'anonymous'
}

function createStorageKey({ currentUserKey, scope, scopeId }) {
  return [ACCOUNT_DOCUMENT_STORAGE_PREFIX, scope, currentUserKey, scopeId || 'general'].join(':')
}

function createSharedStorageKey({ scope, scopeId }) {
  return [ACCOUNT_DOCUMENT_SHARED_STORAGE_PREFIX, scope, scopeId || 'general'].join(':')
}

function readSerializedDocuments(storageKey) {
  if (typeof window === 'undefined') {
    return null
  }

  const serialized = window.localStorage.getItem(storageKey)

  return serialized || null
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
  const sharedStorageKey = computed(() =>
    createSharedStorageKey({
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

  function normalizeDocumentList(documentsSource) {
    const nextDocuments = Array.isArray(documentsSource) ? documentsSource : []

    return ACCOUNT_DOCUMENT_TYPES.map((definition) => {
      const existing = nextDocuments.find((document) => document?.type === definition.type)
      return normalizeAccountDocumentState(existing, definition)
    })
  }

  function getLoadedDocumentCount(documentsSource) {
    return documentsSource.filter((document) => document.status !== 'missing').length
  }

  function hydrateDocuments(documentsSource) {
    const normalizedDocuments = Array.isArray(documentsSource) ? documentsSource : createInitialDocuments()

    seedAccountDocumentReviewRecords({
      currentUser,
      ownerName: currentUser?.value?.name || currentUser?.name || '',
      ownerEmail: currentUser?.value?.email || currentUser?.email || '',
      ownerPhone: currentUser?.value?.phone || currentUser?.phone || '',
      scope: resolvedScope.value,
      scopeId: resolvedScopeId.value,
      documents: normalizedDocuments,
    })

    return mergeDocumentsWithReviewRecords({
      currentUser,
      scope: resolvedScope.value,
      scopeId: resolvedScopeId.value,
      documents: normalizedDocuments,
    })
  }

  function loadDocuments() {
    if (typeof window === 'undefined') {
      documents.value = createInitialDocuments()
      return
    }

    try {
      const fallbackStorageKey = createStorageKey({
        currentUserKey: 'anonymous',
        scope: resolvedScope.value,
        scopeId: resolvedScopeId.value,
      })

      const serialized = readSerializedDocuments(storageKey.value)
      const sharedSerialized = readSerializedDocuments(sharedStorageKey.value)
      const fallbackSerialized =
        storageKey.value === fallbackStorageKey ? null : readSerializedDocuments(fallbackStorageKey)
      const nextSerialized = serialized || sharedSerialized || fallbackSerialized
      const profileSnapshot = readAccountProfileSnapshot(currentUser)
      const profileDocuments = normalizeDocumentList(profileSnapshot.documents || [])

      let normalizedDocuments = createInitialDocuments()

      if (nextSerialized) {
        const parsed = JSON.parse(nextSerialized)
        const nextDocuments = Array.isArray(parsed) ? parsed : []
        normalizedDocuments = normalizeDocumentList(nextDocuments)
      }

      if (getLoadedDocumentCount(profileDocuments) > getLoadedDocumentCount(normalizedDocuments)) {
        normalizedDocuments = profileDocuments
      }

      documents.value = hydrateDocuments(normalizedDocuments)

      if (!serialized) {
        persistDocuments()
      }
      return
    } catch {
      // Fall through to the profile snapshot when the dedicated document storage is unavailable.
    }
    const profileSnapshot = readAccountProfileSnapshot(currentUser)
    const profileDocuments = normalizeDocumentList(profileSnapshot.documents || [])

    documents.value = hydrateDocuments(profileDocuments)
    persistDocuments()
  }

  function persistDocuments() {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(storageKey.value, JSON.stringify(documents.value))
      window.localStorage.setItem(sharedStorageKey.value, JSON.stringify(documents.value))
    } catch {
      // Ignore storage quota and serialization failures; keep the in-memory state updated.
    }
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

  function handleUploadSubmit({ file, fileDataUrl = '', fileType = '', expiresAt }) {
    if (!uploadDialogState.documentType || !file) {
      return
    }

    try {
      upsertDocument(uploadDialogState.documentType, {
        status: 'uploaded',
        fileName: file.name,
        fileSize: file.size,
        fileDataUrl,
        fileType,
        uploadedAt: new Date().toISOString(),
        expiresAt: expiresAt || '',
        verifiedAt: '',
        verifiedBy: '',
        rejectionReason: '',
      })

      syncAccountDocumentReviewRecords({
        currentUser,
        ownerName: currentUser?.value?.name || currentUser?.name || '',
        ownerEmail: currentUser?.value?.email || currentUser?.email || '',
        ownerPhone: currentUser?.value?.phone || currentUser?.phone || '',
        scope: resolvedScope.value,
        scopeId: resolvedScopeId.value,
        documents: documents.value,
      })

      persistDocuments()
      showToast('Документ загружен и отправлен на проверку')
    } catch {
      showToast('Не удалось сохранить документ', { type: 'error' })
    } finally {
      closeUploadDialog()
    }
  }

  function handleDocumentRemove(documentType) {
    const targetDocument = documents.value.find((document) => document.type === documentType)

    if (!targetDocument) {
      return
    }

    void ElMessageBox.confirm(
      `Удалить документ «${targetDocument.label}»?`,
      'Подтверждение удаления',
      {
        customClass: 'account__confirm-messagebox',
        confirmButtonText: 'Удалить',
        cancelButtonText: 'Отмена',
        confirmButtonClass: 'account__submit btn-reset',
        cancelButtonClass: 'account__table-action account__table-action--ghost btn-reset',
        type: 'warning',
        autofocus: false,
        closeOnClickModal: false,
        closeOnPressEscape: true,
      },
    )
      .then(() => {
        upsertDocument(documentType, {
          status: 'missing',
          fileName: '',
          fileSize: 0,
          fileDataUrl: '',
          fileType: '',
          uploadedAt: '',
          expiresAt: '',
          verifiedAt: '',
          verifiedBy: '',
          rejectionReason: '',
        })

        syncAccountDocumentReviewRecords({
          currentUser,
          ownerName: currentUser?.value?.name || currentUser?.name || '',
          ownerEmail: currentUser?.value?.email || currentUser?.email || '',
          ownerPhone: currentUser?.value?.phone || currentUser?.phone || '',
          scope: resolvedScope.value,
          scopeId: resolvedScopeId.value,
          documents: documents.value,
        })

        persistDocuments()
      })
      .catch(() => {})
  }

  function markDocumentVerified(documentType, verifier = 'Секретарь') {
    upsertDocument(documentType, {
      status: ACCOUNT_DOCUMENT_STATUS.VERIFIED,
      verifiedAt: new Date().toISOString(),
      verifiedBy: verifier,
    })

    syncAccountDocumentReviewRecords({
      currentUser,
      ownerName: currentUser?.value?.name || currentUser?.name || '',
      ownerEmail: currentUser?.value?.email || currentUser?.email || '',
      ownerPhone: currentUser?.value?.phone || currentUser?.phone || '',
      scope: resolvedScope.value,
      scopeId: resolvedScopeId.value,
      documents: documents.value,
      reviewerName: verifier,
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
    return getAccountDocumentsAdmissionStatus(documents.value).label
  }

  function handleStorageChange(event) {
    const storageKeyValue = String(event?.key || '')

    if (
      !storageKeyValue.includes(ACCOUNT_DOCUMENT_STORAGE_PREFIX) &&
      !storageKeyValue.includes(ACCOUNT_DOCUMENT_SHARED_STORAGE_PREFIX) &&
      !storageKeyValue.includes('account-document-reviews')
    ) {
      return
    }

    loadDocuments()
  }

  watch(storageKey, loadDocuments, { immediate: true })

  watch(
    documents,
    () => {
      persistDocuments()
    },
    { deep: true },
  )

  onMounted(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('storage', handleStorageChange)
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.removeEventListener('storage', handleStorageChange)
  })

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

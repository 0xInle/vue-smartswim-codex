import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  readAccountDocumentReviewRecords,
  upsertAccountDocumentReviewRecord,
} from '@/pages/account/utils/accountDocumentRegistry'
import { DOCUMENT_REVIEW_STATUS_OPTIONS } from '@/pages/account/utils/accountConstants'
import {
  formatAccountDocumentDate,
  formatCompactDateTime,
  getAccountDocumentDisplayStatus,
  getAccountDocumentsAdmissionStatus,
  isAccountDocumentExpired,
} from '@/pages/account/utils/accountFormatters'
import { ACCOUNT_DOCUMENT_STATUS } from '@/pages/account/utils/accountDocumentTypes'

function normalizeSearchValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function resolveReviewerName(currentUser) {
  return currentUser?.value?.name || currentUser?.name || 'Администратор'
}

export function useAccountDocumentReviews({ currentUser }) {
  const records = ref([])
  const search = ref('')
  const statusFilter = ref('all')
  const isLoading = ref(false)
  const reviewDialogState = reactive({
    isOpen: false,
    recordId: '',
    action: '',
    reason: '',
  })

  function loadRecords() {
    isLoading.value = true

    try {
      records.value = readAccountDocumentReviewRecords()
    } finally {
      isLoading.value = false
    }
  }

  const filteredRecords = computed(() => {
    const normalizedSearch = normalizeSearchValue(search.value)

    return records.value
      .filter((record) => {
        if (statusFilter.value !== 'all' && record.status !== statusFilter.value) {
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
          record.rejectionReason,
          record.verifiedBy,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(normalizedSearch)
      })
      .sort((left, right) => {
        const leftTime = Date.parse(left.reviewedAt || left.uploadedAt || 0) || 0
        const rightTime = Date.parse(right.reviewedAt || right.uploadedAt || 0) || 0

        return rightTime - leftTime
      })
  })

  const summary = computed(() => {
    const pending = records.value.filter(
      (record) => record.status === ACCOUNT_DOCUMENT_STATUS.UPLOADED,
    ).length
    const verified = records.value.filter(
      (record) => record.status === ACCOUNT_DOCUMENT_STATUS.VERIFIED,
    ).length
    const needsReview = records.value.filter((record) =>
      [ACCOUNT_DOCUMENT_STATUS.REJECTED, ACCOUNT_DOCUMENT_STATUS.NEEDS_REUPLOAD].includes(
        record.status,
      ),
    ).length
    const expired = records.value.filter((record) => isAccountDocumentExpired(record)).length

    return {
      total: records.value.length,
      pending,
      verified,
      needsReview,
      expired,
    }
  })

  const reviewRecord = computed(
    () => records.value.find((record) => record.id === reviewDialogState.recordId) || null,
  )

  const reviewDialogTitle = computed(() => {
    if (reviewDialogState.action === 'reject') {
      return 'Отклонить документ'
    }

    if (reviewDialogState.action === 'needs_reupload') {
      return 'Запросить повторную загрузку'
    }

    return 'Проверка документа'
  })

  const reviewDialogHint = computed(() => {
    if (reviewDialogState.action === 'reject') {
      return 'Опишите причину отклонения. Пользователь увидит этот комментарий в личном кабинете.'
    }

    if (reviewDialogState.action === 'needs_reupload') {
      return 'Укажите, что именно нужно исправить. Это отобразится у пользователя как запрос на повторную загрузку.'
    }

    return 'Подтвердите документ, если он соответствует требованиям.'
  })

  function closeReviewDialog() {
    reviewDialogState.isOpen = false
    reviewDialogState.recordId = ''
    reviewDialogState.action = ''
    reviewDialogState.reason = ''
  }

  function openReviewDialog(record, action) {
    if (!record || !action) {
      return
    }

    reviewDialogState.recordId = record.id
    reviewDialogState.action = action
    reviewDialogState.reason = record.rejectionReason || ''
    reviewDialogState.isOpen = true
  }

  function applyReviewAction({ record, status, reason = '' }) {
    if (!record) {
      return
    }

    const reviewerName = resolveReviewerName(currentUser)
    const nextRecord = {
      ...record,
      status,
      rejectionReason:
        status === ACCOUNT_DOCUMENT_STATUS.VERIFIED ? '' : String(reason || '').trim(),
      verifiedAt: status === ACCOUNT_DOCUMENT_STATUS.VERIFIED ? new Date().toISOString() : '',
      verifiedBy: status === ACCOUNT_DOCUMENT_STATUS.VERIFIED ? reviewerName : '',
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerName,
    }

    upsertAccountDocumentReviewRecord(nextRecord)
    loadRecords()
  }

  function handleApprove(record) {
    applyReviewAction({ record, status: ACCOUNT_DOCUMENT_STATUS.VERIFIED })
  }

  function submitReviewDialog() {
    if (!reviewRecord.value || !reviewDialogState.action) {
      return
    }

    const nextStatus =
      reviewDialogState.action === 'reject'
        ? ACCOUNT_DOCUMENT_STATUS.REJECTED
        : ACCOUNT_DOCUMENT_STATUS.NEEDS_REUPLOAD

    applyReviewAction({
      record: reviewRecord.value,
      status: nextStatus,
      reason: reviewDialogState.reason,
    })

    closeReviewDialog()
  }

  function refresh() {
    loadRecords()
  }

  function handleStorageChange(event) {
    const storageKeyValue = String(event?.key || '')

    if (!storageKeyValue.includes('account-document-reviews')) {
      return
    }

    loadRecords()
  }

  watch(
    currentUser,
    () => {
      loadRecords()
    },
    { immediate: true },
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
    records,
    filteredRecords,
    summary,
    search,
    statusFilter,
    isLoading,
    statusOptions: DOCUMENT_REVIEW_STATUS_OPTIONS,
    reviewDialogState,
    reviewRecord,
    reviewDialogTitle,
    reviewDialogHint,
    closeReviewDialog,
    openReviewDialog,
    handleApprove,
    submitReviewDialog,
    refresh,
    formatAccountDocumentDate,
    formatCompactDateTime,
    getAccountDocumentDisplayStatus,
    getAccountDocumentsAdmissionStatus,
  }
}

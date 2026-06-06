import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { DOCUMENT_REVIEW_STATUS_OPTIONS } from '@/pages/account/utils/accountConstants'
import {
  formatAccountDocumentDate,
  formatCompactDateTime,
  getAccountDocumentDisplayStatus,
  getAccountDocumentsAdmissionStatus,
  isAccountDocumentExpired,
} from '@/pages/account/utils/accountFormatters'
import {
  ACCOUNT_DOCUMENT_STATUS,
  normalizeAccountDocumentsState,
} from '@/pages/account/utils/accountDocumentTypes'
import {
  createAccountAdmission,
  refreshAllAccountAdmissionWorkflowForStaff,
  resolveAccountAdmissionStatus,
} from '@/pages/account/utils/accountAdmissions'
import { showToast } from '@/utils/toast'
import {
  loadAllAccountDocumentReviewsForAdmin,
  reviewAccountDocument,
  subscribeToAccountDocumentChanges,
} from '@/domains/account-documents/documentRepository'
import { subscribeToAccountAdmissionWorkflowChanges } from '@/domains/account-admissions/accountAdmissionRepository'

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
  const reviewActionId = ref('')
  const admissionActionId = ref('')
  const reviewDialogSubmitting = ref(false)
  const reviewDialogError = ref('')
  const reviewDialogState = reactive({
    isOpen: false,
    recordId: '',
    action: '',
    reason: '',
  })
  let unsubscribeFromSupabaseDocuments = null
  let unsubscribeFromSupabaseAdmissionWorkflow = null

  async function loadSupabaseRecords() {
    isLoading.value = true

    try {
      const [sourceRecords] = await Promise.all([
        loadAllAccountDocumentReviewsForAdmin(),
        refreshAllAccountAdmissionWorkflowForStaff(),
      ])

      records.value = sourceRecords.filter(
        (record) => record.status !== ACCOUNT_DOCUMENT_STATUS.MISSING,
      )
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Не удалось загрузить документы из Supabase',
        { type: 'error' },
      )
      records.value = []
    } finally {
      isLoading.value = false
    }
  }

  function loadRecords() {
    void loadSupabaseRecords()
  }

  function normalizeReviewRecord(record) {
    return {
      ...record,
      type: record.documentType,
      label: record.documentLabel,
      hint: record.documentHint,
    }
  }

  function normalizeReviewDocuments(documents) {
    return normalizeAccountDocumentsState(documents).map((document) => ({
      ...document,
      documentType: document.type,
      documentLabel: document.label,
      documentHint: document.hint,
    }))
  }

  const groupedRows = computed(() => {
    const grouped = new Map()
    const normalizedSearch = normalizeSearchValue(search.value)

    records.value.forEach((record) => {
      const groupId = getGroupId(record)
      const group = grouped.get(groupId) || {
        id: groupId,
        ownerUserKey: record.ownerUserKey || 'anonymous',
        ownerName: record.ownerName || 'Не указан',
        ownerEmail: record.ownerEmail || '',
        ownerPhone: record.ownerPhone || '',
        scope: record.scope || 'profile',
        scopeId: record.scopeId || 'profile',
        participantName: record.participantName || record.ownerName || 'Без имени',
        participantBirthDate: record.participantBirthDate || '',
        participantClub: record.participantClub || '',
        participantKind: record.participantKind || 'owner',
        documents: [],
      }

      group.documents.push(normalizeReviewRecord(record))
      grouped.set(groupId, group)
    })

    return Array.from(grouped.values())
      .map((group) => {
        const documents = normalizeReviewDocuments(group.documents).sort((left, right) => {
          const leftTime = Date.parse(left.reviewedAt || left.uploadedAt || 0) || 0
          const rightTime = Date.parse(right.reviewedAt || right.uploadedAt || 0) || 0

          return rightTime - leftTime
        })
        const statusMeta = resolveAccountAdmissionStatus({
          ownerUserKey: group.ownerUserKey,
          scope: group.scope,
          scopeId: group.scopeId,
          documents,
        })
        const haystack = [
          group.ownerName,
          group.ownerEmail,
          group.ownerPhone,
          group.participantName,
          ...documents.flatMap((document) => [
            document.documentLabel,
            document.documentType,
            document.fileName,
            document.rejectionReason,
            document.status,
          ]),
          statusMeta.note,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return {
          ...group,
          documents,
          statusMeta,
          documentCount: documents.length,
          haystack,
        }
      })
      .filter((group) => {
        if (statusFilter.value !== 'all' && group.statusMeta.status !== statusFilter.value) {
          return false
        }

        if (!normalizedSearch) {
          return true
        }

        return group.haystack.includes(normalizedSearch)
      })
      .sort((left, right) => {
        const leftTime = left.documents.reduce((max, document) => {
          const candidate = Date.parse(document.reviewedAt || document.uploadedAt || 0) || 0
          return Math.max(max, candidate)
        }, 0)
        const rightTime = right.documents.reduce((max, document) => {
          const candidate = Date.parse(document.reviewedAt || document.uploadedAt || 0) || 0
          return Math.max(max, candidate)
        }, 0)

        return rightTime - leftTime
      })
  })

  const groupedDocuments = computed(() => groupedRows.value.flatMap((group) => group.documents))

  const summary = computed(() => {
    const documents = groupedDocuments.value
    const usersWithDocuments = groupedRows.value.filter((group) =>
      group.documents.some((document) => document.status !== ACCOUNT_DOCUMENT_STATUS.MISSING),
    ).length
    const pending = documents.filter(
      (record) =>
        [
          ACCOUNT_DOCUMENT_STATUS.UPLOADED,
          ACCOUNT_DOCUMENT_STATUS.REJECTED,
          ACCOUNT_DOCUMENT_STATUS.NEEDS_REUPLOAD,
        ].includes(record.status),
    ).length
    const verified = documents.filter(
      (record) => record.status === ACCOUNT_DOCUMENT_STATUS.VERIFIED,
    ).length
    const expired = documents.filter((record) => isAccountDocumentExpired(record)).length

    return {
      totalUsers: groupedRows.value.length,
      usersWithDocuments,
      totalDocuments: documents.length,
      pending,
      verified,
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
    reviewDialogError.value = ''
  }

  function openReviewDialog(record, action) {
    if (!record || !action) {
      return
    }

    reviewDialogState.recordId = record.id
    reviewDialogState.action = action
    reviewDialogState.reason = record.rejectionReason || ''
    reviewDialogState.isOpen = true
    reviewDialogError.value = ''
  }

  async function applyReviewAction({ record, status, reason = '' }) {
    if (!record) {
      return
    }

    const reviewerName = resolveReviewerName(currentUser)
    reviewActionId.value = `${record.id}:${status}`

    try {
      await reviewAccountDocument(record.id, {
        status,
        rejectionReason:
          status === ACCOUNT_DOCUMENT_STATUS.VERIFIED ? '' : String(reason || '').trim(),
        reviewerName,
      })
      await loadSupabaseRecords()
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Не удалось обновить статус документа',
        { type: 'error' },
      )
    } finally {
      reviewActionId.value = ''
    }
  }

  function handleApprove(record) {
    void applyReviewAction({ record, status: ACCOUNT_DOCUMENT_STATUS.VERIFIED })
  }

  async function handleAdmit(group) {
    if (!group || group.statusMeta.status !== 'ready') {
      return
    }

    admissionActionId.value = group.id

    try {
      await createAccountAdmission({
        ownerUserKey: group.ownerUserKey,
        ownerName: group.ownerName,
        ownerEmail: group.ownerEmail,
        scope: group.scope,
        scopeId: group.scopeId,
        participantName: group.participantName,
        participantBirthDate: group.participantBirthDate,
        participantClub: group.participantClub,
        participantKind: group.participantKind,
        admittedBy: resolveReviewerName(currentUser),
      })
      showToast('Спортсмен допущен. Email-уведомление подготовлено к отправке.')
      loadRecords()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось сохранить допуск.', {
        type: 'error',
      })
    } finally {
      admissionActionId.value = ''
    }
  }

  async function submitReviewDialog() {
    if (!reviewRecord.value || !reviewDialogState.action) {
      return
    }

    const nextReason = String(reviewDialogState.reason || '').trim()

    if (reviewDialogState.action !== 'verified' && !nextReason) {
      reviewDialogError.value = 'Укажите причину, чтобы пользователь увидел комментарий.'
      return
    }

    const nextStatus =
      reviewDialogState.action === 'reject'
        ? ACCOUNT_DOCUMENT_STATUS.REJECTED
        : ACCOUNT_DOCUMENT_STATUS.NEEDS_REUPLOAD

    reviewDialogSubmitting.value = true

    await applyReviewAction({
      record: reviewRecord.value,
      status: nextStatus,
      reason: nextReason,
    })

    reviewDialogSubmitting.value = false
    closeReviewDialog()
  }

  function refresh() {
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
    unsubscribeFromSupabaseDocuments = subscribeToAccountDocumentChanges(() => {
      void loadSupabaseRecords()
    })
    unsubscribeFromSupabaseAdmissionWorkflow = subscribeToAccountAdmissionWorkflowChanges(() => {
      void loadSupabaseRecords()
    })
  })

  onBeforeUnmount(() => {
    if (unsubscribeFromSupabaseDocuments) {
      unsubscribeFromSupabaseDocuments()
      unsubscribeFromSupabaseDocuments = null
    }

    if (unsubscribeFromSupabaseAdmissionWorkflow) {
      unsubscribeFromSupabaseAdmissionWorkflow()
      unsubscribeFromSupabaseAdmissionWorkflow = null
    }
  })

  return {
    records,
    groupedRows,
    summary,
    search,
    statusFilter,
    isLoading,
    statusOptions: DOCUMENT_REVIEW_STATUS_OPTIONS,
    reviewDialogState,
    reviewDialogError,
    reviewActionId,
    admissionActionId,
    reviewDialogSubmitting,
    reviewRecord,
    reviewDialogTitle,
    reviewDialogHint,
    closeReviewDialog,
    openReviewDialog,
    handleApprove,
    handleAdmit,
    submitReviewDialog,
    refresh,
    formatAccountDocumentDate,
    formatCompactDateTime,
    getAccountDocumentDisplayStatus,
    getAccountDocumentsAdmissionStatus,
  }
}

function getGroupId({ ownerUserKey, scope, scopeId }) {
  return [ownerUserKey || 'anonymous', scope || 'profile', scopeId || 'profile'].join(':')
}

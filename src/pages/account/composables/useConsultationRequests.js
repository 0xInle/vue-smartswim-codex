import { computed, reactive, ref, watch } from 'vue'
import { showToast } from '@/utils/toast'
import {
  fetchConsultationRequests,
  subscribeToConsultationRequests,
  updateConsultationRequestStatus,
} from '@/utils/supabaseDatabase'
import {
  CONSULTATION_STATUS,
  CONSULTATION_STATUS_OPTIONS,
} from '@/pages/account/utils/accountConstants'
import {
  formatCompactDateTime,
  formatConsultationDate,
  formatConsultationFullName,
  formatConsultationStatus,
  getErrorMessage,
} from '@/pages/account/utils/accountFormatters'

export function useConsultationRequests({ isAdmin }) {
  const consultationRequests = ref([])
  const consultationStatusLoadingId = ref(null)
  const isAdminDataLoading = ref(false)
  const adminDataError = ref('')
  const consultationSearch = ref('')
  const consultationStatusFilter = ref('all')
  const consultationStatusDrafts = reactive({})
  let adminDataSyncPromise = null
  let unsubscribeConsultationFeed = null

  function clearConsultationDrafts() {
    Object.keys(consultationStatusDrafts).forEach((key) => {
      delete consultationStatusDrafts[key]
    })
  }

  function clearConsultationState() {
    consultationRequests.value = []
    adminDataError.value = ''
    clearConsultationDrafts()
  }

  function replaceConsultationRequest(nextRequest) {
    consultationRequests.value = consultationRequests.value.map((request) =>
      request.id === nextRequest.id ? nextRequest : request,
    )
    consultationStatusDrafts[nextRequest.id] = nextRequest.status
  }

  async function syncAdminData({ silent = false } = {}) {
    if (!isAdmin.value) {
      clearConsultationState()
      return
    }

    if (adminDataSyncPromise) {
      return adminDataSyncPromise
    }

    if (!silent) {
      isAdminDataLoading.value = true
    }

    adminDataSyncPromise = (async () => {
      try {
        consultationRequests.value = await fetchConsultationRequests()
        consultationRequests.value.forEach((request) => {
          consultationStatusDrafts[request.id] = request.status
        })
        adminDataError.value = ''
      } catch (error) {
        adminDataError.value = getErrorMessage(error, 'Не удалось загрузить CRM-данные.')
      } finally {
        if (!silent) {
          isAdminDataLoading.value = false
        }

        adminDataSyncPromise = null
      }
    })()

    return adminDataSyncPromise
  }

  function stopConsultationFeed() {
    unsubscribeConsultationFeed?.()
    unsubscribeConsultationFeed = null
  }

  function ensureConsultationFeed() {
    if (!isAdmin.value || unsubscribeConsultationFeed) {
      return
    }

    unsubscribeConsultationFeed = subscribeToConsultationRequests(() => {
      void syncAdminData({ silent: true })
    })
  }

  function handleConsultationRefresh() {
    void syncAdminData({ silent: false })
  }

  function handleConsultationDraftChange(requestId, status) {
    consultationStatusDrafts[requestId] = status
  }

  function getConsultationDraftStatus(requestId) {
    return consultationStatusDrafts[requestId] || CONSULTATION_STATUS.NEW
  }

  async function updateConsultationStatus(request, nextStatus, successMessage) {
    consultationStatusLoadingId.value = request.id

    try {
      const updatedRequest = await updateConsultationRequestStatus({
        id: request.id,
        status: nextStatus,
      })

      replaceConsultationRequest(updatedRequest)
      showToast(successMessage)
    } catch (error) {
      adminDataError.value = getErrorMessage(error, 'Не удалось обновить статус заявки.')
    } finally {
      consultationStatusLoadingId.value = null
    }
  }

  function handleConsultationMarkProcessed(request) {
    void updateConsultationStatus(
      request,
      CONSULTATION_STATUS.PROCESSED,
      'Заявка помечена как обработанная',
    )
  }

  function handleConsultationApplyDraft(request) {
    const nextStatus = getConsultationDraftStatus(request.id)

    if (!nextStatus || nextStatus === request.status) {
      return
    }

    void updateConsultationStatus(
      request,
      nextStatus,
      `Статус изменён: ${formatConsultationStatus(nextStatus)}`,
    )
  }

  function handleConsultationResetStatus(request) {
    void updateConsultationStatus(request, CONSULTATION_STATUS.NEW, 'Статус заявки сброшен')
  }

  const newConsultationRequestsCount = computed(
    () =>
      consultationRequests.value.filter((request) => request.status === CONSULTATION_STATUS.NEW)
        .length,
  )

  const filteredConsultationRequests = computed(() => {
    const normalizedSearch = consultationSearch.value.trim().toLowerCase()

    return consultationRequests.value.filter((request) => {
      const matchesStatus =
        consultationStatusFilter.value === 'all'
          ? true
          : request.status === consultationStatusFilter.value

      if (!matchesStatus) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const haystack = [
        request.firstName,
        request.lastName,
        formatConsultationFullName(request),
        request.phone,
        request.consultationDate,
        request.consultationTime,
        formatCompactDateTime(request.createdAt),
        formatConsultationDate(request.consultationDate),
        formatConsultationStatus(request.status),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  })

  const filteredConsultationRequestsTotal = computed(() => filteredConsultationRequests.value.length)
  const consultationTableRows = computed(() =>
    filteredConsultationRequests.value.flatMap((request) => [
      { key: `${request.id}-data`, kind: 'data', request },
      { key: `${request.id}-actions`, kind: 'actions', request },
    ]),
  )

  function consultationTableSpanMethod({ row, columnIndex }) {
    if (row.kind !== 'actions') {
      return [1, 1]
    }

    if (columnIndex === 0) {
      return [1, 6]
    }

    return [0, 0]
  }

  watch(
    [consultationSearch, consultationStatusFilter],
    () => {
      Object.keys(consultationStatusDrafts).forEach((key) => {
        const requestExists = filteredConsultationRequests.value.some(
          (request) => request.id === Number(key),
        )

        if (!requestExists) {
          delete consultationStatusDrafts[key]
        }
      })
    },
  )

  watch(
    isAdmin,
    (value) => {
      if (value) {
        ensureConsultationFeed()
        return
      }

      stopConsultationFeed()
      clearConsultationState()
    },
    { immediate: true },
  )

  return {
    consultationRequests,
    consultationStatusLoadingId,
    isAdminDataLoading,
    adminDataError,
    consultationSearch,
    consultationStatusFilter,
    consultationStatusOptions: CONSULTATION_STATUS_OPTIONS,
    newConsultationRequestsCount,
    filteredConsultationRequestsTotal,
    consultationTableRows,
    handleConsultationRefresh,
    handleConsultationDraftChange,
    getConsultationDraftStatus,
    handleConsultationMarkProcessed,
    handleConsultationApplyDraft,
    handleConsultationResetStatus,
    consultationTableSpanMethod,
    syncAdminData,
    stopConsultationFeed,
    clearConsultationState,
  }
}

import { computed, ref, watch } from 'vue'
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
import { getRussianPhoneSearchValue } from '@/utils/phone'

export function useConsultationRequests({ isAdmin }) {
  const consultationRequests = ref([])
  const consultationStatusLoadingId = ref(null)
  const isAdminDataLoading = ref(false)
  const adminDataError = ref('')
  const consultationSearch = ref('')
  const consultationStatusFilter = ref('all')
  const selectedConsultationRequest = ref(null)
  const isConsultationDetailsDialogOpen = ref(false)
  const consultationDetailsError = ref('')
  let adminDataSyncPromise = null
  let unsubscribeConsultationFeed = null

  function clearConsultationState() {
    consultationRequests.value = []
    adminDataError.value = ''
    closeConsultationDetailsDialog()
  }

  function replaceConsultationRequest(nextRequest) {
    consultationRequests.value = consultationRequests.value.map((request) =>
      request.id === nextRequest.id ? nextRequest : request,
    )

    if (selectedConsultationRequest.value?.id === nextRequest.id) {
      selectedConsultationRequest.value = nextRequest
    }
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

  function openConsultationDetailsDialog(request) {
    consultationDetailsError.value = ''
    selectedConsultationRequest.value = request
    isConsultationDetailsDialogOpen.value = true
  }

  function closeConsultationDetailsDialog() {
    isConsultationDetailsDialogOpen.value = false
    consultationDetailsError.value = ''
  }

  function clearConsultationDetailsDialog() {
    selectedConsultationRequest.value = null
    consultationDetailsError.value = ''
  }

  async function updateConsultationStatus(request, payload, successMessage) {
    consultationStatusLoadingId.value = request.id

    try {
      const updatedRequest = await updateConsultationRequestStatus({
        id: request.id,
        status: payload.status,
        callbackTime: payload.callbackTime,
        comment: payload.comment,
      })

      replaceConsultationRequest(updatedRequest)
      showToast(successMessage)
      return true
    } catch (error) {
      consultationDetailsError.value = getErrorMessage(error, 'Не удалось обновить статус заявки.')
      return false
    } finally {
      consultationStatusLoadingId.value = null
    }
  }

  async function handleConsultationDetailsSubmit(payload) {
    if (!selectedConsultationRequest.value || selectedConsultationRequest.value.id !== payload.requestId) {
      return
    }

    consultationDetailsError.value = ''

    if (
      payload.status === selectedConsultationRequest.value.status &&
      payload.callbackTime === selectedConsultationRequest.value.callbackTime &&
      payload.comment === selectedConsultationRequest.value.comment
    ) {
      closeConsultationDetailsDialog()
      return
    }

    const isUpdated = await updateConsultationStatus(
      selectedConsultationRequest.value,
      payload,
      `Заявка обновлена: ${formatConsultationStatus(payload.status)}`,
    )

    if (isUpdated) {
      closeConsultationDetailsDialog()
    }
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
        getRussianPhoneSearchValue(request.phone),
        request.consultationDate,
        request.consultationTime,
        request.callbackDate,
        request.callbackTime,
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
  const consultationTableRows = computed(() => filteredConsultationRequests.value)

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
    selectedConsultationRequest,
    isConsultationDetailsDialogOpen,
    consultationDetailsError,
    openConsultationDetailsDialog,
    closeConsultationDetailsDialog,
    clearConsultationDetailsDialog,
    handleConsultationDetailsSubmit,
    syncAdminData,
    stopConsultationFeed,
    clearConsultationState,
  }
}

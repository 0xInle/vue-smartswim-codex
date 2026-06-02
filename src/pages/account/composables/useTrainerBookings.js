import { computed, ref, watch } from 'vue'
import {
  fetchTrainerBookings,
  subscribeToTrainerBookings,
  updateTrainerBookingStatus,
} from '@/utils/supabaseDatabase'
import {
  TRAINER_BOOKING_STATUS,
  TRAINER_BOOKING_STATUS_OPTIONS,
} from '@/pages/account/utils/accountConstants'
import {
  formatCompactDateTime,
  formatConsultationDate,
  formatTrainerBookingClientName,
  formatTrainerBookingStatus,
  getErrorMessage,
} from '@/pages/account/utils/accountFormatters'
import { getPhoneSearchValue } from '@/utils/phone'

export function useTrainerBookings({ isAdmin }) {
  const trainerBookings = ref([])
  const trainerBookingsLoading = ref(false)
  const trainerBookingsError = ref('')
  const trainerBookingsSearch = ref('')
  const trainerBookingsStatusFilter = ref('all')
  let trainerBookingsSyncPromise = null
  let unsubscribeTrainerBookingsFeed = null

  function clearTrainerBookingsState() {
    trainerBookings.value = []
    trainerBookingsError.value = ''
  }

  async function syncTrainerBookings({ silent = false } = {}) {
    if (!isAdmin.value) {
      clearTrainerBookingsState()
      return
    }

    if (trainerBookingsSyncPromise) {
      return trainerBookingsSyncPromise
    }

    if (!silent) {
      trainerBookingsLoading.value = true
    }

    trainerBookingsSyncPromise = (async () => {
      try {
        trainerBookings.value = await fetchTrainerBookings()
        trainerBookingsError.value = ''
      } catch (error) {
        trainerBookingsError.value = getErrorMessage(error, 'Не удалось загрузить записи к тренерам.')
      } finally {
        if (!silent) {
          trainerBookingsLoading.value = false
        }

        trainerBookingsSyncPromise = null
      }
    })()

    return trainerBookingsSyncPromise
  }

  function stopTrainerBookingsFeed() {
    unsubscribeTrainerBookingsFeed?.()
    unsubscribeTrainerBookingsFeed = null
  }

  function ensureTrainerBookingsFeed() {
    if (!isAdmin.value || unsubscribeTrainerBookingsFeed) {
      return
    }

    unsubscribeTrainerBookingsFeed = subscribeToTrainerBookings(() => {
      void syncTrainerBookings({ silent: true })
    })
  }

  function handleTrainerBookingsRefresh() {
    void syncTrainerBookings()
  }

  async function handleTrainerBookingStatusUpdate(id, status) {
    if (!id || !status) {
      return null
    }

    try {
      const updatedBooking = await updateTrainerBookingStatus({ id, status })
      await syncTrainerBookings({ silent: true })
      return updatedBooking
    } catch (error) {
      trainerBookingsError.value = getErrorMessage(error, 'Не удалось обновить запись к тренеру.')
      return null
    }
  }

  const newTrainerBookingsCount = computed(
    () =>
      trainerBookings.value.filter((booking) => booking.status === TRAINER_BOOKING_STATUS.NEW).length,
  )

  const filteredTrainerBookings = computed(() => {
    const normalizedSearch = trainerBookingsSearch.value.trim().toLowerCase()

    return trainerBookings.value.filter((booking) => {
      const matchesStatus =
        trainerBookingsStatusFilter.value === 'all'
          ? true
          : booking.status === trainerBookingsStatusFilter.value

      if (!matchesStatus) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const haystack = [
        booking.trainerName,
        booking.firstName,
        booking.lastName,
        formatTrainerBookingClientName(booking),
        booking.phone,
        getPhoneSearchValue(booking.phone),
        booking.email,
        booking.preferredDate,
        booking.preferredTime,
        booking.comment,
        formatConsultationDate(booking.preferredDate),
        formatTrainerBookingStatus(booking.status),
        formatCompactDateTime(booking.createdAt),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  })

  const filteredTrainerBookingsTotal = computed(() => filteredTrainerBookings.value.length)

  watch(
    isAdmin,
    (value) => {
      if (value) {
        ensureTrainerBookingsFeed()
        return
      }

      stopTrainerBookingsFeed()
      clearTrainerBookingsState()
    },
    { immediate: true },
  )

  return {
    trainerBookings,
    trainerBookingsLoading,
    trainerBookingsError,
    trainerBookingsSearch,
    trainerBookingsStatusFilter,
    trainerBookingsStatusOptions: TRAINER_BOOKING_STATUS_OPTIONS,
    newTrainerBookingsCount,
    filteredTrainerBookings,
    filteredTrainerBookingsTotal,
    handleTrainerBookingsRefresh,
    handleTrainerBookingStatusUpdate,
    syncTrainerBookings,
    stopTrainerBookingsFeed,
    clearTrainerBookingsState,
  }
}

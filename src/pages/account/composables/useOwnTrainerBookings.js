import { computed, ref } from 'vue'
import { fetchOwnTrainerBookings, updateTrainerBookingStatus } from '@/utils/supabaseDatabase'
import { getErrorMessage } from '@/pages/account/utils/accountFormatters'

export function useOwnTrainerBookings() {
  const ownTrainerBookings = ref([])
  const ownTrainerBookingsLoading = ref(false)
  const ownTrainerBookingsError = ref('')
  let ownTrainerBookingsSyncPromise = null

  async function syncOwnTrainerBookings() {
    if (ownTrainerBookingsSyncPromise) {
      return ownTrainerBookingsSyncPromise
    }

    ownTrainerBookingsLoading.value = true

    ownTrainerBookingsSyncPromise = (async () => {
      try {
        ownTrainerBookings.value = await fetchOwnTrainerBookings()
        ownTrainerBookingsError.value = ''
      } catch (error) {
        ownTrainerBookings.value = []
        ownTrainerBookingsError.value = getErrorMessage(
          error,
          'Не удалось загрузить записи к тренерам.',
        )
      } finally {
        ownTrainerBookingsLoading.value = false
        ownTrainerBookingsSyncPromise = null
      }
    })()

    return ownTrainerBookingsSyncPromise
  }

  function clearOwnTrainerBookings() {
    ownTrainerBookings.value = []
    ownTrainerBookingsError.value = ''
  }

  async function updateOwnTrainerBookingStatus(id, status) {
    if (!id || !status) {
      return null
    }

    try {
      const updatedBooking = await updateTrainerBookingStatus({ id, status })
      await syncOwnTrainerBookings()
      return updatedBooking
    } catch (error) {
      ownTrainerBookingsError.value = getErrorMessage(
        error,
        'Не удалось обновить запись к тренеру.',
      )
      return null
    }
  }

  const ownTrainerBookingsTotal = computed(() => ownTrainerBookings.value.length)

  return {
    ownTrainerBookings,
    ownTrainerBookingsLoading,
    ownTrainerBookingsError,
    ownTrainerBookingsTotal,
    syncOwnTrainerBookings,
    updateOwnTrainerBookingStatus,
    clearOwnTrainerBookings,
  }
}

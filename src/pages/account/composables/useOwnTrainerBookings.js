import { computed, ref } from 'vue'
import { fetchOwnTrainerBookings } from '@/utils/supabaseDatabase'
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

  const ownTrainerBookingsTotal = computed(() => ownTrainerBookings.value.length)

  return {
    ownTrainerBookings,
    ownTrainerBookingsLoading,
    ownTrainerBookingsError,
    ownTrainerBookingsTotal,
    syncOwnTrainerBookings,
    clearOwnTrainerBookings,
  }
}

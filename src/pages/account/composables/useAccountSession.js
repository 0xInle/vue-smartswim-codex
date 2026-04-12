import { computed, ref } from 'vue'
import { CRM_ROLE, isAdminRole } from '@/utils/crmRoles'
import { signOutCurrentUser } from '@/utils/supabaseAuth'
import { fetchCurrentCrmUser } from '@/utils/supabaseDatabase'
import { getErrorMessage } from '@/pages/account/utils/accountFormatters'

export function useAccountSession({ router }) {
  const currentUser = ref(null)
  const isProfileLoading = ref(false)
  const profileLoadError = ref('')
  let currentUserSyncPromise = null

  const currentRole = computed(() => currentUser.value?.role || CRM_ROLE.USER)
  const isAdmin = computed(() => isAdminRole(currentRole.value))
  const currentRoleLabel = computed(() => {
    if (currentRole.value === CRM_ROLE.ADMIN) {
      return 'Администратор'
    }

    if (currentRole.value === CRM_ROLE.TRAINER) {
      return 'Тренер'
    }

    return 'Пользователь'
  })

  async function syncCurrentUser() {
    if (currentUserSyncPromise) {
      return currentUserSyncPromise
    }

    isProfileLoading.value = true

    currentUserSyncPromise = (async () => {
      try {
        currentUser.value = await fetchCurrentCrmUser()
        profileLoadError.value = ''
      } catch (error) {
        currentUser.value = null
        profileLoadError.value = getErrorMessage(error, 'Не удалось загрузить профиль кабинета.')
      } finally {
        isProfileLoading.value = false
        currentUserSyncPromise = null
      }
    })()

    return currentUserSyncPromise
  }

  function clearCurrentUser() {
    currentUser.value = null
    profileLoadError.value = ''
  }

  async function handleSignOut({ onSuccess, onError } = {}) {
    try {
      await signOutCurrentUser()
      clearCurrentUser()
      onSuccess?.()
      await router.push('/')
    } catch (error) {
      onError?.(getErrorMessage(error, 'Не удалось завершить сессию.'))
    }
  }

  return {
    currentUser,
    currentRole,
    currentRoleLabel,
    isAdmin,
    isProfileLoading,
    profileLoadError,
    syncCurrentUser,
    clearCurrentUser,
    handleSignOut,
  }
}

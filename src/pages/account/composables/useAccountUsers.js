import { computed, reactive, ref, watch } from 'vue'
import { accountMockUsers } from '@/pages/account/accountUsers.data'
import {
  createDefaultUserEditForm,
  USERS_PAGE_SIZE,
} from '@/pages/account/utils/accountConstants'
import { formatUserStatus } from '@/pages/account/utils/accountFormatters'
import { getCrmRoleLabel } from '@/utils/crmRoles'
import { showToast } from '@/utils/toast'

export function useAccountUsers() {
  const users = ref(accountMockUsers.map((user) => ({ ...user })))
  const usersPage = ref(1)
  const usersSearch = ref('')
  const usersRoleFilter = ref('all')
  const isUserEditDialogOpen = ref(false)
  const isUserDeleteDialogOpen = ref(false)
  const userPendingDelete = ref(null)
  const userEditForm = reactive(createDefaultUserEditForm())

  const filteredUsers = computed(() => {
    const normalizedSearch = usersSearch.value.trim().toLowerCase()

    return users.value.filter((user) => {
      const matchesRole =
        usersRoleFilter.value === 'all' ? true : user.role === usersRoleFilter.value

      if (!matchesRole) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const haystack = [
        user.id,
        user.name,
        user.email,
        user.phone,
        user.role,
        getCrmRoleLabel(user.role),
        formatUserStatus(user.status),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  })

  const filteredUsersTotal = computed(() => filteredUsers.value.length)
  const usersPageCount = computed(() =>
    Math.max(1, Math.ceil(filteredUsersTotal.value / USERS_PAGE_SIZE)),
  )
  const paginatedUsers = computed(() => {
    const startIndex = (usersPage.value - 1) * USERS_PAGE_SIZE

    return filteredUsers.value.slice(startIndex, startIndex + USERS_PAGE_SIZE)
  })

  function handleUsersPageChange(page) {
    usersPage.value = page
  }

  function resetUsersPage() {
    usersPage.value = 1
  }

  function resetUserEditForm() {
    Object.assign(userEditForm, createDefaultUserEditForm())
  }

  function handleOpenUserEdit(user) {
    Object.assign(userEditForm, {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    })

    isUserEditDialogOpen.value = true
  }

  function handleCloseUserEdit() {
    isUserEditDialogOpen.value = false
    resetUserEditForm()
  }

  function handleUserEditSubmit() {
    const userIndex = users.value.findIndex((item) => item.id === userEditForm.id)

    if (userIndex === -1) {
      handleCloseUserEdit()
      return
    }

    users.value[userIndex] = {
      ...users.value[userIndex],
      name: userEditForm.name.trim(),
      email: userEditForm.email.trim(),
      phone: userEditForm.phone.trim(),
      role: userEditForm.role,
      status: userEditForm.status,
    }

    showToast('Пользователь обновлён')
    handleCloseUserEdit()
  }

  function handleOpenUserDelete(user) {
    userPendingDelete.value = user
    isUserDeleteDialogOpen.value = true
  }

  function handleCloseUserDelete() {
    isUserDeleteDialogOpen.value = false
    userPendingDelete.value = null
  }

  function handleConfirmUserDelete() {
    if (!userPendingDelete.value) {
      return
    }

    users.value = users.value.filter((item) => item.id !== userPendingDelete.value.id)
    showToast('Пользователь удалён')
    handleCloseUserDelete()
  }

  watch(
    usersPageCount,
    (pageCount) => {
      if (usersPage.value > pageCount) {
        usersPage.value = pageCount
      }
    },
    { immediate: true },
  )

  watch([usersSearch, usersRoleFilter], resetUsersPage)

  return {
    usersPage,
    usersSearch,
    usersRoleFilter,
    filteredUsersTotal,
    usersPageCount,
    paginatedUsers,
    isUserEditDialogOpen,
    isUserDeleteDialogOpen,
    userPendingDelete,
    userEditForm,
    handleUsersPageChange,
    resetUsersPage,
    handleOpenUserEdit,
    handleCloseUserEdit,
    handleUserEditSubmit,
    handleOpenUserDelete,
    handleCloseUserDelete,
    handleConfirmUserDelete,
  }
}

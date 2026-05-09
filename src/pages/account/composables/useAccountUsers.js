import { computed, reactive, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import {
  createDefaultUserEditForm,
  USERS_PAGE_SIZE,
} from '@/pages/account/utils/accountConstants'
import {
  createAccountDocumentsState,
  normalizeAccountDocumentsState,
} from '@/pages/account/utils/accountDocumentTypes'
import {
  removeAccountDocumentReviewRecords,
  syncAccountDocumentReviewRecords,
} from '@/pages/account/utils/accountDocumentRegistry'
import { formatUserStatus } from '@/pages/account/utils/accountFormatters'
import { formatRussianPhone, getRussianPhoneSearchValue } from '@/utils/phone'
import { getCrmRoleLabel } from '@/utils/crmRoles'
import { showToast } from '@/utils/toast'
import {
  readAccountUsersSnapshot,
  writeAccountUsersSnapshot,
} from '@/pages/account/utils/accountUsersStorage'

export function useAccountUsers() {
  const users = ref(readAccountUsersSnapshot())
  const usersPage = ref(1)
  const usersSearch = ref('')
  const usersRoleFilter = ref('all')
  const isUserEditDialogOpen = ref(false)
  const isUserDeleteDialogOpen = ref(false)
  const userPendingDelete = ref(null)
  const userEditForm = reactive(createDefaultUserEditForm())
  const documentUploadState = reactive({
    isOpen: false,
    documentType: '',
    fileName: '',
    fileSize: 0,
    expiresAt: '',
  })

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
        getRussianPhoneSearchValue(user.phone),
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

  function syncUserDocumentReviews(user) {
    syncAccountDocumentReviewRecords({
      currentUser: user,
      ownerName: user?.name || '',
      ownerEmail: user?.email || '',
      ownerPhone: user?.phone || '',
      scope: 'user',
      scopeId: user?.id || '',
      participantName: user?.name || '',
      participantBirthDate: '',
      participantClub: '',
      participantKind: 'owner',
      documents: user?.documents || [],
    })
  }

  function handleOpenUserEdit(user) {
    Object.assign(userEditForm, {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      documents: normalizeAccountDocumentsState(user.documents || createAccountDocumentsState()),
    })

    isUserEditDialogOpen.value = true
  }

  function handleCloseUserEdit() {
    isUserEditDialogOpen.value = false
    documentUploadState.isOpen = false
    documentUploadState.documentType = ''
    documentUploadState.fileName = ''
    documentUploadState.fileSize = 0
    documentUploadState.expiresAt = ''
    resetUserEditForm()
  }

  function getUserDocumentState(documentType) {
    return userEditForm.documents.find((document) => document.type === documentType) || null
  }

  function openDocumentUploadDialog(documentType) {
    const target = getUserDocumentState(documentType)

    if (!target) {
      return
    }

    documentUploadState.isOpen = true
    documentUploadState.documentType = documentType
    documentUploadState.fileName = target.fileName || ''
    documentUploadState.fileSize = target.fileSize || 0
    documentUploadState.expiresAt = target.expiresAt || ''
  }

  function closeDocumentUploadDialog() {
    documentUploadState.isOpen = false
    documentUploadState.documentType = ''
    documentUploadState.fileName = ''
    documentUploadState.fileSize = 0
    documentUploadState.expiresAt = ''
  }

  function upsertUserDocument(documentType, patch) {
    const hasDocument = userEditForm.documents.some((document) => document.type === documentType)

    if (!hasDocument) {
      return
    }

    userEditForm.documents = userEditForm.documents.map((document) =>
      document.type === documentType
        ? {
            ...document,
            ...patch,
          }
        : document,
    )
  }

  function handleDocumentUploadSubmit({ file, fileDataUrl = '', fileType = '', expiresAt }) {
    if (!documentUploadState.documentType || !file) {
      return
    }

    upsertUserDocument(documentUploadState.documentType, {
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

    closeDocumentUploadDialog()
  }

  function handleDocumentRemove(documentType) {
    const targetUserDocument = userEditForm.documents.find((document) => document.type === documentType)

    if (!targetUserDocument) {
      return
    }

    void ElMessageBox.confirm(
      `Удалить документ «${targetUserDocument.label}»?`,
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
        upsertUserDocument(documentType, {
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
      })
      .catch(() => {})
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
      phone: formatRussianPhone(userEditForm.phone.trim()),
      role: userEditForm.role,
      status: userEditForm.status,
      documents: normalizeAccountDocumentsState(userEditForm.documents || createAccountDocumentsState()),
    }

    syncUserDocumentReviews(users.value[userIndex])

    if (!writeAccountUsersSnapshot(users.value)) {
      showToast('Не удалось сохранить пользователя', { type: 'error' })
      handleCloseUserEdit()
      return
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

    removeAccountDocumentReviewRecords({
      currentUser: userPendingDelete.value,
      scope: 'user',
      scopeId: userPendingDelete.value.id,
    })

    users.value = users.value.filter((item) => item.id !== userPendingDelete.value.id)

    if (!writeAccountUsersSnapshot(users.value)) {
      showToast('Не удалось сохранить список пользователей', { type: 'error' })
      handleCloseUserDelete()
      return
    }

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
    users,
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
    documentUploadState,
    handleUsersPageChange,
    resetUsersPage,
    handleOpenUserEdit,
    handleCloseUserEdit,
    handleUserEditSubmit,
    handleOpenUserDelete,
    handleCloseUserDelete,
    handleConfirmUserDelete,
    openDocumentUploadDialog,
    closeDocumentUploadDialog,
    handleDocumentUploadSubmit,
    handleDocumentRemove,
  }
}

import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import {
  createDefaultUserEditForm,
  USERS_PAGE_SIZE,
} from '@/pages/account/utils/accountConstants'
import {
  createAccountDocumentsState,
  ACCOUNT_DOCUMENT_STATUS,
  normalizeAccountDocumentsState,
} from '@/pages/account/utils/accountDocumentTypes'
import { formatUserStatus } from '@/pages/account/utils/accountFormatters'
import { getPhoneSearchValue } from '@/utils/phone'
import { getCrmRoleLabel } from '@/utils/crmRoles'
import { showToast } from '@/utils/toast'
import {
  loadAllAccountUsersForAdmin,
  removeAccountUserFromCrmForAdmin,
  saveAccountUserForAdmin,
  subscribeToAccountUsersChanges,
} from '@/domains/account-users/accountUsersRepository'
import {
  subscribeToAccountProfileAthleteChanges,
} from '@/domains/account-data/accountDataRepository'
import {
  reviewAccountDocument,
  subscribeToAccountDocumentChanges,
} from '@/domains/account-documents/documentRepository'
import { subscribeToAccountAdmissionWorkflowChanges } from '@/domains/account-admissions/accountAdmissionRepository'
import { useTriStateTextSort } from '@/pages/account/composables/useTriStateTextSort'

export function useAccountUsers({ currentUser = null } = {}) {
  const users = ref([])
  const usersPage = ref(1)
  const usersSearch = ref('')
  const usersRoleFilter = ref('all')
  const { sortKey: usersSortKey, sortDirection: usersSortDirection, toggleSort: toggleUsersSort, sortItems: sortUsersItems } = useTriStateTextSort('name')
  const isUserEditDialogOpen = ref(false)
  const isUserDeleteDialogOpen = ref(false)
  const userPendingDelete = ref(null)
  const usersError = ref('')
  let usersLoadRequestId = 0
  let unsubscribeFromUsers = null
  let unsubscribeFromAccountData = null
  let unsubscribeFromDocuments = null
  let unsubscribeFromAdmissions = null
  const userEditForm = reactive(createDefaultUserEditForm())
  const documentUploadState = reactive({
    isOpen: false,
    documentType: '',
    fileName: '',
    fileSize: 0,
    expiresAt: '',
  })

  function resolveReviewerName() {
    return currentUser?.value?.name || currentUser?.name || 'Администратор'
  }

  async function loadUsers() {
    const requestId = usersLoadRequestId + 1
    usersLoadRequestId = requestId
    usersError.value = ''

    try {
      const nextUsers = await loadAllAccountUsersForAdmin()

      if (requestId === usersLoadRequestId) {
        users.value = nextUsers
      }
    } catch (error) {
      if (requestId === usersLoadRequestId) {
        users.value = []
        usersError.value = error instanceof Error ? error.message : 'Не удалось загрузить пользователей.'
        showToast(usersError.value, { type: 'error' })
      }
    }
  }

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
        getPhoneSearchValue(user.phone),
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
  const sortedUsers = computed(() =>
    sortUsersItems(filteredUsers.value, {
      name: (user) => user.name || '',
    }),
  )
  const usersPageCount = computed(() =>
    Math.max(1, Math.ceil(sortedUsers.value.length / USERS_PAGE_SIZE)),
  )
  const paginatedUsers = computed(() => {
    const startIndex = (usersPage.value - 1) * USERS_PAGE_SIZE

    return sortedUsers.value.slice(startIndex, startIndex + USERS_PAGE_SIZE)
  })

  function handleUsersPageChange(page) {
    usersPage.value = page
  }

  function resetUsersPage() {
    usersPage.value = 1
  }

  function handleUsersSortChange(columnKey) {
    toggleUsersSort(columnKey)
    resetUsersPage()
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
      registeredAt: user.registeredAt || null,
      documents: normalizeAccountDocumentsState(user.documents || createAccountDocumentsState()),
      athletes: Array.isArray(user.athletes) ? user.athletes : [],
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

  function updateUserDocumentInEditForm(documentId, patch) {
    const updateDocuments = (documents = []) =>
      normalizeAccountDocumentsState(documents).map((document) =>
        document.id === documentId
          ? {
              ...document,
              ...patch,
            }
          : document,
      )

    userEditForm.documents = updateDocuments(userEditForm.documents)
    userEditForm.athletes = userEditForm.athletes.map((athlete) => ({
      ...athlete,
      documents: updateDocuments(athlete.documents),
    }))
  }

  async function handleReviewUserDocument(document, status, reason = '') {
    if (!document?.id) {
      showToast('Документ еще не сохранен в Supabase, его нельзя проверить.', { type: 'error' })
      return
    }

    try {
      const updatedDocument = await reviewAccountDocument(document.id, {
        status,
        rejectionReason: status === ACCOUNT_DOCUMENT_STATUS.VERIFIED ? '' : reason,
        reviewerName: resolveReviewerName(),
      })

      updateUserDocumentInEditForm(document.id, updatedDocument)
      await loadUsers()
      showToast(status === ACCOUNT_DOCUMENT_STATUS.VERIFIED ? 'Документ одобрен' : 'Запрошено обновление документа')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось обновить статус документа', {
        type: 'error',
      })
    }
  }

  function handleApproveUserDocument(document) {
    void handleReviewUserDocument(document, ACCOUNT_DOCUMENT_STATUS.VERIFIED)
  }

  function handleRequestUserDocumentReupload(document) {
    if (!document?.id) {
      showToast('Документ еще не сохранен в Supabase, его нельзя проверить.', { type: 'error' })
      return
    }

    void ElMessageBox.prompt(
      'Комментарий увидит пользователь в личном кабинете.',
      'Запросить обновление документа',
      {
        customClass: 'account__confirm-messagebox',
        confirmButtonText: 'Запросить обновление',
        cancelButtonText: 'Отмена',
        confirmButtonClass: 'account__submit btn-reset',
        cancelButtonClass: 'account__table-action account__table-action--ghost btn-reset',
        inputType: 'textarea',
        inputPlaceholder: 'Что нужно исправить?',
        inputValidator: (value) => Boolean(String(value || '').trim()) || 'Укажите комментарий.',
        closeOnClickModal: false,
        closeOnPressEscape: true,
      },
    )
      .then(({ value }) => {
        void handleReviewUserDocument(
          document,
          ACCOUNT_DOCUMENT_STATUS.NEEDS_REUPLOAD,
          String(value || '').trim(),
        )
      })
      .catch(() => {})
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

  async function handleUserEditSubmit() {
    const userIndex = users.value.findIndex((item) => item.id === userEditForm.id)

    if (userIndex === -1) {
      handleCloseUserEdit()
      return
    }

    try {
      await saveAccountUserForAdmin(userEditForm.id, {
        name: userEditForm.name.trim(),
        role: userEditForm.role,
        status: userEditForm.status,
      })
      await loadUsers()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось сохранить пользователя', {
        type: 'error',
      })
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

  async function handleConfirmUserDelete() {
    if (!userPendingDelete.value) {
      return
    }

    try {
      await removeAccountUserFromCrmForAdmin(userPendingDelete.value.id)
      users.value = users.value.filter((item) => item.id !== userPendingDelete.value.id)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось удалить пользователя из CRM', {
        type: 'error',
      })
      handleCloseUserDelete()
      return
    }

    showToast('Пользователь удалён из CRM')
    handleCloseUserDelete()
  }

  onMounted(() => {
    void loadUsers()
    unsubscribeFromUsers = subscribeToAccountUsersChanges(() => {
      void loadUsers()
    })
    unsubscribeFromAccountData = subscribeToAccountProfileAthleteChanges(() => {
      void loadUsers()
    })
    unsubscribeFromDocuments = subscribeToAccountDocumentChanges(() => {
      void loadUsers()
    })
    unsubscribeFromAdmissions = subscribeToAccountAdmissionWorkflowChanges(() => {
      void loadUsers()
    })
  })

  onBeforeUnmount(() => {
    if (unsubscribeFromUsers) {
      unsubscribeFromUsers()
      unsubscribeFromUsers = null
    }

    if (unsubscribeFromAccountData) {
      unsubscribeFromAccountData()
      unsubscribeFromAccountData = null
    }

    if (unsubscribeFromDocuments) {
      unsubscribeFromDocuments()
      unsubscribeFromDocuments = null
    }

    if (unsubscribeFromAdmissions) {
      unsubscribeFromAdmissions()
      unsubscribeFromAdmissions = null
    }
  })

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
    usersError,
    filteredUsersTotal,
    usersPageCount,
    paginatedUsers,
    usersSortKey,
    usersSortDirection,
    handleUsersSortChange,
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
    handleApproveUserDocument,
    handleRequestUserDocumentReupload,
  }
}

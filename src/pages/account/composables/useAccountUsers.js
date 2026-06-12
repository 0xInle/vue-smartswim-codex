import { computed, onBeforeUnmount, reactive, ref, unref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import {
  createDefaultUserEditForm,
  USERS_PAGE_SIZE,
} from '@/pages/account/utils/accountConstants'
import {
  createAccountDocumentRemovalPatch,
  createAccountDocumentsState,
  createAccountDocumentUploadPatch,
  ACCOUNT_DOCUMENT_STATUS,
  isAccountDocumentExpiryRequired,
  normalizeAccountDocumentsState,
} from '@/pages/account/utils/accountDocumentTypes'
import { formatUserStatus } from '@/pages/account/utils/accountFormatters'
import { getPhoneSearchValue } from '@/utils/phone'
import { CRM_ROLE, getCrmRoleLabel } from '@/utils/crmRoles'
import { showToast } from '@/utils/toast'
import {
  loadAccountUserDetailsForAdmin,
  loadAccountUsersPageForAdmin,
  removeAccountUserFromCrmForAdmin,
  saveAccountUserForAdmin,
  searchAccountUsersListPageForAdmin,
  subscribeToAccountUsersChanges,
} from '@/domains/account-users/accountUsersRepository'
import {
  subscribeToAccountProfileAthleteChanges,
} from '@/domains/account-data/accountDataRepository'
import {
  loadAccountDocumentReviewForAdmin,
  reviewAccountDocument,
  subscribeToAccountDocumentChanges,
} from '@/domains/account-documents/documentRepository'
import { subscribeToAccountAdmissionWorkflowChanges } from '@/domains/account-admissions/accountAdmissionRepository'
import { admitAccountParticipant } from '@/pages/account/utils/accountAdmissions'
import { useTriStateTextSort } from '@/pages/account/composables/useTriStateTextSort'

const USERS_REFRESH_DEBOUNCE_MS = 300
const USER_DETAILS_REFRESH_DEBOUNCE_MS = 300

export function useAccountUsers({
  currentUser = null,
  isEnabled = true,
  shouldRefresh = isEnabled,
} = {}) {
  const users = ref([])
  const usersTotal = ref(0)
  const usersPage = ref(1)
  const usersSearch = ref('')
  const usersRoleFilter = ref('all')
  const { sortKey: usersSortKey, sortDirection: usersSortDirection, toggleSort: toggleUsersSort, sortItems: sortUsersItems } = useTriStateTextSort('name')
  const isUserEditDialogOpen = ref(false)
  const isUserDeleteDialogOpen = ref(false)
  const userPendingDelete = ref(null)
  const usersError = ref('')
  const userEditSubmitting = ref(false)
  const userDeleteSubmitting = ref(false)
  const userDocumentActionId = ref('')
  const userAdmissionActionId = ref('')
  let usersLoadRequestId = 0
  let unsubscribeFromUsers = null
  let unsubscribeFromAccountData = null
  let unsubscribeFromDocuments = null
  let unsubscribeFromAdmissions = null
  let usersRefreshTimer = null
  let isScheduledUsersRefreshRunning = false
  let hasPendingUsersRefresh = false
  let userDetailsRefreshTimer = null
  let isScheduledUserDetailsRefreshRunning = false
  let hasPendingUserDetailsRefresh = false
  let userDetailsRequestId = 0
  const isUsersLoaded = ref(false)
  const userEditForm = reactive(createDefaultUserEditForm())
  const documentUploadState = reactive({
    isOpen: false,
    documentType: '',
    fileName: '',
    fileSize: 0,
    expiresAt: '',
  })
  const isUsersLoading = ref(false)
  const usersDatasetMode = ref('page')

  function resolveReviewerName() {
    return currentUser?.value?.name || currentUser?.name || 'Администратор'
  }

  async function loadUsers() {
    const requestId = usersLoadRequestId + 1
    usersLoadRequestId = requestId
    usersError.value = ''
    isUsersLoading.value = true

    try {
      const shouldUseSimpleServerPage = shouldUseSimpleServerUsersPage()
      const result = shouldUseSimpleServerPage
        ? await loadAccountUsersPageForAdmin({
            page: usersPage.value,
            pageSize: USERS_PAGE_SIZE,
            roleFilter: usersRoleFilter.value,
          })
        : await searchAccountUsersListPageForAdmin({
            page: usersPage.value,
            pageSize: USERS_PAGE_SIZE,
            search: usersSearch.value,
            roleFilter: usersRoleFilter.value,
          })
      const nextUsers = result.users
      const nextTotal = result.total

      if (requestId === usersLoadRequestId) {
        users.value = nextUsers
        usersTotal.value = nextTotal
        usersDatasetMode.value = 'page'
        isUsersLoaded.value = true
      }
    } catch (error) {
      if (requestId === usersLoadRequestId) {
        users.value = []
        usersTotal.value = 0
        usersDatasetMode.value = 'page'
        isUsersLoaded.value = false
        usersError.value = error instanceof Error ? error.message : 'Не удалось загрузить пользователей.'
        showToast(usersError.value, { type: 'error' })
      }
    } finally {
      if (requestId === usersLoadRequestId) {
        isUsersLoading.value = false
      }
    }
  }

  function isAccountUsersEnabled() {
    return Boolean(unref(isEnabled))
  }

  function shouldRefreshUsersImmediately() {
    return Boolean(unref(shouldRefresh))
  }

  function ensureUsersLoaded() {
    if (isUsersLoaded.value || isUsersLoading.value) {
      return Promise.resolve()
    }

    return loadUsers()
  }

  function shouldUseSimpleServerUsersPage() {
    return !usersSearch.value.trim() && usersRoleFilter.value !== CRM_ROLE.ATHLETE
  }

  function shouldUseServerUsersPage() {
    return true
  }

  function handleUsersDataChanged() {
    isUsersLoaded.value = false

    if (shouldRefreshUsersImmediately()) {
      scheduleUsersRefresh()
    }
  }

  function cancelScheduledUsersRefresh() {
    if (usersRefreshTimer) {
      clearTimeout(usersRefreshTimer)
      usersRefreshTimer = null
    }

    hasPendingUsersRefresh = false
  }

  function cancelScheduledUserDetailsRefresh() {
    if (userDetailsRefreshTimer) {
      clearTimeout(userDetailsRefreshTimer)
      userDetailsRefreshTimer = null
    }

    hasPendingUserDetailsRefresh = false
  }

  function flushScheduledUsersRefresh() {
    usersRefreshTimer = null

    if (!isAccountUsersEnabled()) {
      hasPendingUsersRefresh = false
      return
    }

    if (isScheduledUsersRefreshRunning) {
      hasPendingUsersRefresh = true
      return
    }

    hasPendingUsersRefresh = false
    isScheduledUsersRefreshRunning = true

    void loadUsers().finally(() => {
      isScheduledUsersRefreshRunning = false

      if (hasPendingUsersRefresh && isAccountUsersEnabled()) {
        scheduleUsersRefresh()
      }
    })
  }

  function scheduleUsersRefresh() {
    if (!isAccountUsersEnabled()) {
      return
    }

    hasPendingUsersRefresh = true

    if (usersRefreshTimer) {
      return
    }

    usersRefreshTimer = window.setTimeout(flushScheduledUsersRefresh, USERS_REFRESH_DEBOUNCE_MS)
  }

  function getActiveUserEditOwnerId() {
    if (!isUserEditDialogOpen.value) {
      return ''
    }

    return userEditForm.isAthleteRecord ? userEditForm.ownerUserId : userEditForm.id
  }

  function getRealtimePayloadOwnerId(payload) {
    return payload?.new?.owner_user_id || payload?.old?.owner_user_id || ''
  }

  function shouldRefreshActiveUserDetails(payload) {
    const activeOwnerId = getActiveUserEditOwnerId()

    if (!activeOwnerId) {
      return false
    }

    const payloadOwnerId = getRealtimePayloadOwnerId(payload)

    return !payloadOwnerId || payloadOwnerId === activeOwnerId
  }

  function syncUserEditDetailsFromLoadedUser(detailedUser) {
    if (!detailedUser) {
      return
    }

    if (userEditForm.isAthleteRecord) {
      userEditForm.documents = normalizeAccountDocumentsState(
        detailedUser.documents || createAccountDocumentsState(),
      )
      return
    }

    userEditForm.documents = normalizeAccountDocumentsState(
      detailedUser.documents || createAccountDocumentsState(),
    )
    userEditForm.athletes = Array.isArray(detailedUser.athletes) ? detailedUser.athletes : []
  }

  async function refreshActiveUserDetails() {
    const ownerUserId = getActiveUserEditOwnerId()

    if (!ownerUserId) {
      return
    }

    const requestId = userDetailsRequestId + 1
    userDetailsRequestId = requestId
    const detailRows = await loadAccountUserDetailsForAdmin(ownerUserId)

    if (requestId !== userDetailsRequestId) {
      return
    }

    replaceLoadedUserDetailsInUsers(ownerUserId, detailRows)

    const detailedUser = userEditForm.isAthleteRecord
      ? detailRows.find((row) => row.id === userEditForm.id || row.athleteId === userEditForm.athleteId)
      : detailRows.find((row) => row.id === ownerUserId)

    syncUserEditDetailsFromLoadedUser(detailedUser)
  }

  function flushScheduledUserDetailsRefresh() {
    userDetailsRefreshTimer = null

    if (!isAccountUsersEnabled() || !getActiveUserEditOwnerId()) {
      hasPendingUserDetailsRefresh = false
      return
    }

    if (isScheduledUserDetailsRefreshRunning) {
      hasPendingUserDetailsRefresh = true
      return
    }

    hasPendingUserDetailsRefresh = false
    isScheduledUserDetailsRefreshRunning = true

    void refreshActiveUserDetails()
      .catch((error) => {
        showToast(error instanceof Error ? error.message : 'Не удалось обновить карточку пользователя.', {
          type: 'error',
        })
      })
      .finally(() => {
        isScheduledUserDetailsRefreshRunning = false

        if (hasPendingUserDetailsRefresh && isAccountUsersEnabled()) {
          scheduleUserDetailsRefresh()
        }
      })
  }

  function scheduleUserDetailsRefresh() {
    if (!isAccountUsersEnabled() || !getActiveUserEditOwnerId()) {
      return
    }

    hasPendingUserDetailsRefresh = true

    if (userDetailsRefreshTimer) {
      return
    }

    userDetailsRefreshTimer = window.setTimeout(
      flushScheduledUserDetailsRefresh,
      USER_DETAILS_REFRESH_DEBOUNCE_MS,
    )
  }

  function handleUserDetailsDataChanged(payload) {
    if (!shouldRefreshActiveUserDetails(payload)) {
      return
    }

    scheduleUserDetailsRefresh()
  }

  function stopUsersSubscriptions() {
    cancelScheduledUsersRefresh()
    cancelScheduledUserDetailsRefresh()

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
  }

  function startUsersSubscriptions() {
    if (!isAccountUsersEnabled() || !shouldRefreshUsersImmediately() || unsubscribeFromUsers) {
      return
    }

    unsubscribeFromUsers = subscribeToAccountUsersChanges(() => {
      handleUsersDataChanged()
    })
    unsubscribeFromAccountData = subscribeToAccountProfileAthleteChanges(() => {
      handleUsersDataChanged()
    })
    unsubscribeFromDocuments = subscribeToAccountDocumentChanges((payload) => {
      handleUserDetailsDataChanged(payload)
    })
    unsubscribeFromAdmissions = subscribeToAccountAdmissionWorkflowChanges((payload) => {
      handleUserDetailsDataChanged(payload)
    })
  }

  const filteredUsers = computed(() => {
    if (shouldUseServerUsersPage()) {
      return users.value
    }

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
        user.ownerName,
        user.ownerEmail,
        user.club,
        user.rank,
        user.coach,
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

  const filteredUsersTotal = computed(() =>
    shouldUseServerUsersPage()
      ? usersTotal.value
      : filteredUsers.value.length,
  )
  const sortedUsers = computed(() =>
    sortUsersItems(filteredUsers.value, {
      name: (user) => user.name || '',
    }),
  )
  const usersPageCount = computed(() =>
    Math.max(1, Math.ceil(filteredUsersTotal.value / USERS_PAGE_SIZE)),
  )
  const paginatedUsers = computed(() => {
    if (shouldUseServerUsersPage()) {
      return sortedUsers.value
    }

    const startIndex = (usersPage.value - 1) * USERS_PAGE_SIZE

    return sortedUsers.value.slice(startIndex, startIndex + USERS_PAGE_SIZE)
  })

  function handleUsersPageChange(page) {
    usersPage.value = page

    if (isUsersLoaded.value && shouldUseServerUsersPage()) {
      void loadUsers()
    }
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

  function resetDocumentUploadState() {
    documentUploadState.isOpen = false
    documentUploadState.documentType = ''
    documentUploadState.fileName = ''
    documentUploadState.fileSize = 0
    documentUploadState.expiresAt = ''
  }

  function getUserDetailsOwnerId(user) {
    if (!user) {
      return ''
    }

    return user.isAthleteRecord ? user.ownerUserId : user.id
  }

  function replaceLoadedUserDetailsInUsers(ownerUserId, detailRows = []) {
    if (!ownerUserId || !Array.isArray(detailRows) || !detailRows.length) {
      return
    }

    const detailRowsById = new Map(detailRows.map((row) => [row.id, row]))
    const hasOwnerRow = users.value.some((user) => user.id === ownerUserId)

    users.value = users.value
      .map((user) => {
        if (user.id === ownerUserId || user.ownerUserId === ownerUserId) {
          return detailRowsById.get(user.id) || null
        }

        return user
      })
      .filter(Boolean)

    if (!hasOwnerRow) {
      users.value = usersDatasetMode.value === 'page' && shouldUseServerUsersPage()
        ? [detailRows[0], ...users.value].filter(Boolean)
        : [...detailRows, ...users.value]
      return
    }

    if (usersDatasetMode.value === 'page' && shouldUseServerUsersPage()) {
      return
    }

    const existingDetailIds = new Set(users.value.map((user) => user.id))
    const missingDetailRows = detailRows.filter((row) => !existingDetailIds.has(row.id))

    if (missingDetailRows.length) {
      const ownerIndex = users.value.findIndex((user) => user.id === ownerUserId)
      users.value.splice(ownerIndex + 1, 0, ...missingDetailRows)
      users.value = [...users.value]
    }
  }

  async function loadUserDetailsForEdit(user) {
    const ownerUserId = getUserDetailsOwnerId(user)

    if (!ownerUserId) {
      return user
    }

    const requestId = userDetailsRequestId + 1
    userDetailsRequestId = requestId

    try {
      const detailRows = await loadAccountUserDetailsForAdmin(ownerUserId)

      if (requestId !== userDetailsRequestId) {
        return null
      }

      replaceLoadedUserDetailsInUsers(ownerUserId, detailRows)

      if (user.isAthleteRecord) {
        return (
          detailRows.find((row) => row.id === user.id || row.athleteId === user.athleteId) ||
          user
        )
      }

      return detailRows.find((row) => row.id === ownerUserId) || user
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось загрузить карточку пользователя.', {
        type: 'error',
      })
      return user
    }
  }

  async function handleOpenUserEdit(user) {
    const detailedUser = await loadUserDetailsForEdit(user)

    if (!detailedUser) {
      return
    }

    Object.assign(userEditForm, {
      id: detailedUser.id,
      name: detailedUser.name,
      email: detailedUser.email,
      phone: detailedUser.phone,
      isAthleteRecord: Boolean(detailedUser.isAthleteRecord),
      athleteId: detailedUser.athleteId || '',
      ownerUserId: detailedUser.ownerUserId || '',
      ownerName: detailedUser.ownerName || '',
      ownerEmail: detailedUser.ownerEmail || '',
      gender: detailedUser.gender || '',
      rank: detailedUser.rank || '',
      coach: detailedUser.coach || '',
      birthDate: detailedUser.birthDate || '',
      club: detailedUser.club || '',
      role: detailedUser.role,
      status: detailedUser.status,
      registeredAt: detailedUser.registeredAt || null,
      experience: detailedUser.experience || '',
      mainProfile: detailedUser.mainProfile || '',
      availableSeats: detailedUser.availableSeats || '',
      education: detailedUser.education || '',
      sportAchievements: detailedUser.sportAchievements || '',
      worksWith: detailedUser.worksWith || '',
      minAge: detailedUser.minAge || '',
      preparationLevel: detailedUser.preparationLevel || '',
      metro: detailedUser.metro || '',
      documents: normalizeAccountDocumentsState(detailedUser.documents || createAccountDocumentsState()),
      athletes: Array.isArray(detailedUser.athletes) ? detailedUser.athletes : [],
    })

    isUserEditDialogOpen.value = true
  }

  function handleCloseUserEdit() {
    isUserEditDialogOpen.value = false
    documentUploadState.isOpen = false
  }

  function handleUserEditDialogClosed() {
    resetDocumentUploadState()
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

  function updateLoadedUserDocumentInUsers(documentId, patch) {
    const updateDocuments = (documents = []) =>
      normalizeAccountDocumentsState(documents).map((document) =>
        document.id === documentId
          ? {
              ...document,
              ...patch,
            }
          : document,
      )

    users.value = users.value.map((user) => ({
      ...user,
      documents: updateDocuments(user.documents),
      athletes: Array.isArray(user.athletes)
        ? user.athletes.map((athlete) => ({
            ...athlete,
            documents: updateDocuments(athlete.documents),
          }))
        : [],
    }))
  }

  function updateLoadedCrmUserInUsers(updatedUser = {}) {
    if (!updatedUser?.id) {
      return
    }

    users.value = users.value.map((user) => {
      if (user.id === updatedUser.id) {
        return {
          ...user,
          email: updatedUser.email || user.email,
          name: updatedUser.name || user.name,
          role: updatedUser.role || user.role,
          status: updatedUser.status || user.status,
          registeredAt: updatedUser.registeredAt || user.registeredAt,
        }
      }

      if (user.ownerUserId === updatedUser.id) {
        return {
          ...user,
          email: updatedUser.email || user.email,
          ownerEmail: updatedUser.email || user.ownerEmail,
          ownerName: updatedUser.name || user.ownerName,
          status: updatedUser.status || user.status,
        }
      }

      return user
    })
  }

  function findUserDocumentById(documentId) {
    const profileDocument = userEditForm.documents.find((document) => document.id === documentId)

    if (profileDocument) {
      return profileDocument
    }

    for (const athlete of userEditForm.athletes) {
      const athleteDocument = athlete.documents?.find((document) => document.id === documentId)

      if (athleteDocument) {
        return athleteDocument
      }
    }

    return null
  }

  function findLoadedUserDocumentById(documentId) {
    for (const user of users.value) {
      const profileDocument = user.documents?.find((document) => document.id === documentId)

      if (profileDocument) {
        return profileDocument
      }

      for (const athlete of user.athletes || []) {
        const athleteDocument = athlete.documents?.find((document) => document.id === documentId)

        if (athleteDocument) {
          return athleteDocument
        }
      }
    }

    return null
  }

  async function handleReviewUserDocument(document, status, reason = '') {
    if (!document?.id) {
      showToast('Документ еще не сохранен в Supabase, его нельзя проверить.', { type: 'error' })
      return
    }

    userDocumentActionId.value = `${document.id}:${status}`

    try {
      const updatedDocument = await reviewAccountDocument(document.id, {
        status,
        rejectionReason: status === ACCOUNT_DOCUMENT_STATUS.VERIFIED ? '' : reason,
        reviewerName: resolveReviewerName(),
      })

      updateUserDocumentInEditForm(document.id, updatedDocument)
      updateLoadedUserDocumentInUsers(document.id, updatedDocument)
      showToast(status === ACCOUNT_DOCUMENT_STATUS.VERIFIED ? 'Документ одобрен' : 'Запрошено обновление документа')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось обновить статус документа', {
        type: 'error',
      })
    } finally {
      userDocumentActionId.value = ''
    }
  }

  async function handleApproveUserDocument(document) {
    let latestDocument = findLoadedUserDocumentById(document?.id) || findUserDocumentById(document?.id) || document

    if (
      latestDocument?.id &&
      isAccountDocumentExpiryRequired(latestDocument?.type) &&
      !latestDocument?.expiresAt
    ) {
      try {
        latestDocument = await loadAccountDocumentReviewForAdmin(latestDocument.id)
        updateUserDocumentInEditForm(latestDocument.id, latestDocument)
        updateLoadedUserDocumentInUsers(latestDocument.id, latestDocument)
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Не удалось загрузить документ.', {
          type: 'error',
        })
        return
      }
    }

    if (isAccountDocumentExpiryRequired(latestDocument?.type) && !latestDocument?.expiresAt) {
      showToast('У документа не указан срок действия. Попросите пользователя загрузить документ со сроком.', {
        type: 'error',
      })
      return
    }

    await handleReviewUserDocument(latestDocument, ACCOUNT_DOCUMENT_STATUS.VERIFIED)
  }

  function handleRequestUserDocumentReupload(document) {
    if (!document?.id) {
      showToast('Документ еще не сохранен в Supabase, его нельзя проверить.', { type: 'error' })
      return
    }

    void ElMessageBox.prompt(
      'Укажите, что нужно исправить.',
      'Запросить обновление документа',
      {
        customClass: 'account__confirm-messagebox',
        confirmButtonText: 'Запросить обновление',
        cancelButtonText: 'Отмена',
        confirmButtonClass: 'account__table-action account__table-action--delete btn-reset',
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

  async function handleAdmitUserDocumentGroup(group) {
    if (!group || group.statusMeta?.status !== 'ready') {
      return
    }

    userAdmissionActionId.value = group.id

    try {
      await admitAccountParticipant(group, resolveReviewerName())
      showToast('Спортсмен допущен. Email-уведомление подготовлено к отправке.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось сохранить допуск.', {
        type: 'error',
      })
    } finally {
      userAdmissionActionId.value = ''
    }
  }

  function handleDocumentUploadSubmit({ file, fileDataUrl = '', fileType = '', expiresAt }) {
    if (!documentUploadState.documentType || !file) {
      return
    }

    upsertUserDocument(
      documentUploadState.documentType,
      createAccountDocumentUploadPatch({
        fileName: file.name,
        fileSize: file.size,
        file,
        fileDataUrl,
        fileType,
        expiresAt: expiresAt || '',
      }),
    )

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
        upsertUserDocument(documentType, createAccountDocumentRemovalPatch())
      })
      .catch(() => {})
  }

  async function handleUserEditSubmit() {
    if (userEditForm.isAthleteRecord) {
      handleCloseUserEdit()
      return
    }

    const userIndex = users.value.findIndex((item) => item.id === userEditForm.id)

    if (userIndex === -1) {
      handleCloseUserEdit()
      return
    }

    userEditSubmitting.value = true

    try {
      const updatedUser = await saveAccountUserForAdmin(userEditForm.id, {
        name: userEditForm.name.trim(),
        role: userEditForm.role,
        status: userEditForm.status,
      })
      updateLoadedCrmUserInUsers(updatedUser)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось сохранить пользователя', {
        type: 'error',
      })
      handleCloseUserEdit()
      return
    } finally {
      userEditSubmitting.value = false
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

    userDeleteSubmitting.value = true

    try {
      await removeAccountUserFromCrmForAdmin(userPendingDelete.value.id)
      users.value = users.value.filter((item) => item.id !== userPendingDelete.value.id)
      usersTotal.value = Math.max(0, usersTotal.value - 1)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось удалить пользователя из CRM', {
        type: 'error',
      })
      handleCloseUserDelete()
      return
    } finally {
      userDeleteSubmitting.value = false
    }

    showToast('Пользователь удалён из CRM')
    handleCloseUserDelete()
    handleCloseUserEdit()
  }

  watch(
    () => [isAccountUsersEnabled(), shouldRefreshUsersImmediately()],
    ([enabled, shouldRefreshNow]) => {
      if (enabled && shouldRefreshNow) {
        startUsersSubscriptions()
        return
      }

      stopUsersSubscriptions()
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    stopUsersSubscriptions()
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

  watch([usersSearch, usersRoleFilter], () => {
    resetUsersPage()

    if (!isUsersLoaded.value) {
      return
    }

    if (shouldUseServerUsersPage() || usersDatasetMode.value !== 'full') {
      void loadUsers()
    }
  })

  return {
    users,
    usersPage,
    usersSearch,
    usersRoleFilter,
    usersError,
    isUsersLoading,
    isUsersLoaded,
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
    userEditSubmitting,
    userDeleteSubmitting,
    userDocumentActionId,
    userAdmissionActionId,
    handleUsersPageChange,
    ensureUsersLoaded,
    loadUsers,
    resetUsersPage,
    handleOpenUserEdit,
    handleCloseUserEdit,
    handleUserEditDialogClosed,
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
    handleAdmitUserDocumentGroup,
  }
}

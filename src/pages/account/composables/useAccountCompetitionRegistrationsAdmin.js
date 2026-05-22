import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { buildAccountCompetitionStages } from '@/pages/account/accountCompetitionStages.data'
import {
  loadAllCompetitionRegistrationsForAdmin,
  patchCompetitionRegistrationByUserKey,
  subscribeToCompetitionRegistrationChanges,
} from '@/pages/account/utils/accountCompetitionRegistrations'
import { isSupabaseCompetitionApplicationSource } from '@/domains/competition-applications/applicationSource'
import {
  readAccountAthletesSnapshot,
  readAccountProfileSnapshot,
} from '@/pages/account/utils/accountLocalStorage'
import { readAccountUsersSnapshot } from '@/pages/account/utils/accountUsersStorage'
import {
  COMPETITION_REGISTRATION_RECORD_STATUS,
  isCompetitionRegistrationActiveStatus,
} from '@/pages/account/utils/accountConstants'
import {
  getAccountDocumentsAdmissionStatus,
  competitionRegistrationRecordStatusType,
  formatCompetitionRegistrationRecordStatus,
  formatCompactDateTime,
  resolveCompetitionRegistrationLifecycleSummary,
} from '@/pages/account/utils/accountFormatters'
import { getApplicationTransitionOptions } from '@/domains/competition-applications/applicationLifecycle'
import { resolveCompetitionRegistrationState } from '@/utils/competitionRegistration'
import { formatCompetitionDateLabel } from '@/utils/competitionRegistration'
import { showToast } from '@/utils/toast'

function normalizeSearchValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function formatStageOptionLabel(stage) {
  const stageLabel = `Этап ${stage.stage}`
  const dateLabel = formatCompetitionDateLabel(stage.date)

  return `${stage.competitionName} · ${stageLabel} · ${dateLabel}`
}

function resolveCompetitionWindowLabel(stage) {
  const state = resolveCompetitionRegistrationState(stage.registration)

  if (state.mode === 'open') {
    return `Открыта до ${state.closeDateLabel}`
  }

  return `${state.openDateLabel} - ${state.closeDateLabel}`
}

function buildStagePatch(stage) {
  return {
    competitionSlug: stage.competitionSlug || '',
    competitionName: stage.competitionName || '',
    stageId: stage.id || '',
    stageLabel: `Этап ${stage.stage}`,
    competitionDateLabel: formatCompetitionDateLabel(stage.date),
    competitionWindowLabel: resolveCompetitionWindowLabel(stage),
  }
}

export function useAccountCompetitionRegistrationsAdmin() {
  const registrations = ref([])
  const search = ref('')
  const statusFilter = ref('all')
  const selectedRegistrationId = ref('')
  const isDetailsDialogOpen = ref(false)
  const isRegistrationsLoading = ref(false)
  const registrationsError = ref('')
  let loadRequestId = 0
  let unsubscribeFromCompetitionApplications = null

  async function loadRegistrations() {
    const requestId = loadRequestId + 1
    loadRequestId = requestId
    isRegistrationsLoading.value = true
    registrationsError.value = ''

    try {
      const nextRegistrations = await loadAllCompetitionRegistrationsForAdmin()

      if (requestId === loadRequestId) {
        registrations.value = nextRegistrations
      }
    } catch (error) {
      if (requestId === loadRequestId) {
        registrationsError.value =
          error instanceof Error ? error.message : 'Не удалось загрузить заявки.'
      }
    } finally {
      if (requestId === loadRequestId) {
        isRegistrationsLoading.value = false
      }
    }
  }

  const stageOptions = computed(() =>
    buildAccountCompetitionStages()
      .slice()
      .sort((left, right) => {
        const leftCompetition = normalizeSearchValue(left.competitionName)
        const rightCompetition = normalizeSearchValue(right.competitionName)

        if (leftCompetition === rightCompetition) {
          return Number(left.stage) - Number(right.stage)
        }

        return leftCompetition.localeCompare(rightCompetition)
      })
      .map((stage) => ({
        value: stage.id,
        label: formatStageOptionLabel(stage),
      })),
  )

  const selectedRegistration = computed(
    () => registrations.value.find((item) => item.id === selectedRegistrationId.value) || null,
  )

  const selectedRegistrationDocumentsStatus = computed(() => {
    const registration = selectedRegistration.value

    if (!registration?.sourceUserKey) {
      return null
    }

    const sourceUser = readAccountUsersSnapshot().find(
      (item) => item.id === registration.sourceUserKey || item.email === registration.sourceUserKey,
    )

    if (!sourceUser && isSupabaseCompetitionApplicationSource()) {
      return {
        status: 'unknown',
        label: 'Нет данных',
        description: 'Проверьте документы в карточке пользователя.',
        tagType: 'info',
      }
    }

    const sourceUserSnapshot =
      sourceUser || {
        id: registration.sourceUserKey,
        email: registration.ownerEmail || '',
        name: registration.ownerName || '',
        phone: registration.ownerPhone || '',
      }

    if (registration.participantKind === 'athlete') {
      const athlete = readAccountAthletesSnapshot(sourceUserSnapshot).find(
        (item) => item.id === registration.participantId,
      )

      if (athlete) {
        return getAccountDocumentsAdmissionStatus(athlete.documents || [])
      }

      if (isSupabaseCompetitionApplicationSource()) {
        return {
          status: 'unknown',
          label: 'Нет данных',
          description: 'Проверьте документы в карточке пользователя.',
          tagType: 'info',
        }
      }
    }

    const profile = readAccountProfileSnapshot(sourceUserSnapshot)
    const profileDocuments = profile.documents || []
    const sourceUserDocuments = sourceUserSnapshot.documents || []
    const documents = profileDocuments.some((document) => document.status !== 'missing')
      ? profileDocuments
      : sourceUserDocuments

    if (isSupabaseCompetitionApplicationSource() && !documents.length) {
      return {
        status: 'unknown',
        label: 'Нет данных',
        description: 'Проверьте документы в карточке пользователя.',
        tagType: 'info',
      }
    }

    return getAccountDocumentsAdmissionStatus(documents)
  })

  const selectedRegistrationLifecycleSummary = computed(() =>
    getRegistrationLifecycleSummary(selectedRegistration.value),
  )

  const selectedRegistrationStatusOptions = computed(() =>
    getApplicationTransitionOptions(selectedRegistration.value?.status, { includeCurrent: true }),
  )

  const filteredRegistrations = computed(() => {
    const normalizedSearch = normalizeSearchValue(search.value)

    return registrations.value
      .filter((registration) => {
        if (statusFilter.value !== 'all' && registration.status !== statusFilter.value) {
          return false
        }

        if (!normalizedSearch) {
          return true
        }

        const haystack = [
          registration.competitionName,
          registration.stageLabel,
          registration.participantName,
          registration.ownerName,
          registration.ownerEmail,
          registration.comment,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(normalizedSearch)
      })
      .sort((left, right) => {
        const leftTime = Date.parse(left.updatedAt || left.statusChangedAt || left.createdAt || 0) || 0
        const rightTime = Date.parse(right.updatedAt || right.statusChangedAt || right.createdAt || 0) || 0

        return rightTime - leftTime
      })
  })

  const summary = computed(() => ({
    total: registrations.value.length,
    active: registrations.value.filter((registration) => isCompetitionRegistrationActiveStatus(registration.status)).length,
    withdrawn: registrations.value.filter(
      (registration) => registration.status === COMPETITION_REGISTRATION_RECORD_STATUS.WITHDRAWN,
    ).length,
  }))

  function openDetailsDialog(registration) {
    if (!registration) {
      return
    }

    selectedRegistrationId.value = registration.id
    isDetailsDialogOpen.value = true
  }

  function getRegistrationLifecycleSummary(registration) {
    return resolveCompetitionRegistrationLifecycleSummary(registration, {
      audience: 'admin',
      documentsStatus:
        registration?.id === selectedRegistration.value?.id
          ? selectedRegistrationDocumentsStatus.value
          : null,
    })
  }

  function closeDetailsDialog() {
    isDetailsDialogOpen.value = false
  }

  async function updateSelectedRegistration(
    patch = {},
    { closeDialog = false, toastMessage = 'Заявка обновлена' } = {},
  ) {
    const registration = selectedRegistration.value

    if (!registration?.sourceUserKey) {
      return null
    }

    let updatedRegistration = null

    try {
      updatedRegistration = await patchCompetitionRegistrationByUserKey(
        registration.sourceUserKey,
        registration.id,
        patch,
        { statusChangedBy: 'admin' },
      )
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось обновить заявку', {
        type: 'error',
      })
      return null
    }

    if (!updatedRegistration) {
      return null
    }

    await loadRegistrations()

    if (closeDialog) {
      closeDetailsDialog()
    }

    if (toastMessage) {
      showToast(toastMessage)
    }

    return updatedRegistration
  }

  async function handleRegistrationSave(payload) {
    const stageId = typeof payload === 'string' ? payload : payload?.stageId
    const registrationKind = typeof payload === 'object' && payload ? payload.registrationKind : ''
    const status = typeof payload === 'object' && payload ? payload.status : ''
    const patch = {}

    if (stageId) {
      const stage = buildAccountCompetitionStages().find((item) => item.id === stageId)

      if (stage) {
        Object.assign(patch, buildStagePatch(stage))
      }
    }

    if (registrationKind) {
      patch.registrationKind = registrationKind
    }

    if (status) {
      patch.status = status
    }

    if (!Object.keys(patch).length) {
      return
    }

    await updateSelectedRegistration(patch, {
      closeDialog: true,
      toastMessage: 'Заявка обновлена',
    })
  }

  function handleWithdrawSelectedRegistration() {
    const registration = selectedRegistration.value

    if (!registration) {
      return
    }

    if (registration.status !== COMPETITION_REGISTRATION_RECORD_STATUS.SUBMITTED) {
      return
    }

    void ElMessageBox.confirm(
      'Снять участника с соревнований? Заявка останется в истории.',
      'Подтверждение снятия',
      {
        customClass: 'account__confirm-messagebox',
        confirmButtonText: 'Снять',
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
        void updateSelectedRegistration(
          { status: COMPETITION_REGISTRATION_RECORD_STATUS.WITHDRAWN },
          { closeDialog: true, toastMessage: '' },
        ).then((updatedRegistration) => {
          if (updatedRegistration) {
            showToast('Участник снят с соревнований')
          }
        })
      })
      .catch(() => {})
  }

  function handleStorageChange(event) {
    const storageKeyValue = String(event?.key || '')

    if (!storageKeyValue.includes('account-competition-registrations')) {
      return
    }

    void loadRegistrations()
  }

  onMounted(() => {
    void loadRegistrations()

    if (isSupabaseCompetitionApplicationSource()) {
      unsubscribeFromCompetitionApplications = subscribeToCompetitionRegistrationChanges(() => {
        void loadRegistrations()
      })
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('storage', handleStorageChange)
  })

  onBeforeUnmount(() => {
    if (unsubscribeFromCompetitionApplications) {
      unsubscribeFromCompetitionApplications()
      unsubscribeFromCompetitionApplications = null
    }

    if (typeof window === 'undefined') {
      return
    }

    window.removeEventListener('storage', handleStorageChange)
  })

  return {
    registrations,
    search,
    statusFilter,
    filteredRegistrations,
    summary,
    isRegistrationsLoading,
    registrationsError,
    stageOptions,
    selectedRegistration,
    isDetailsDialogOpen,
    openDetailsDialog,
    closeDetailsDialog,
    selectedRegistrationDocumentsStatus,
    selectedRegistrationLifecycleSummary,
    selectedRegistrationStatusOptions,
    getRegistrationLifecycleSummary,
    handleRegistrationSave,
    handleWithdrawSelectedRegistration,
    competitionRegistrationRecordStatusType,
    formatCompetitionRegistrationRecordStatus,
    formatCompactDateTime,
  }
}

import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { buildAccountCompetitionStages } from '@/pages/account/accountCompetitionStages.data'
import {
  readAllCompetitionRegistrations,
  updateCompetitionRegistrationByUserKey,
} from '@/pages/account/utils/accountCompetitionRegistrations'
import {
  readAccountAthletesSnapshot,
  readAccountProfileSnapshot,
} from '@/pages/account/utils/accountLocalStorage'
import { readAccountUsersSnapshot } from '@/pages/account/utils/accountUsersStorage'
import { COMPETITION_REGISTRATION_RECORD_STATUS } from '@/pages/account/utils/accountConstants'
import {
  getAccountDocumentsAdmissionStatus,
  competitionRegistrationRecordStatusType,
  formatCompetitionRegistrationRecordStatus,
  formatCompactDateTime,
} from '@/pages/account/utils/accountFormatters'
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

  function loadRegistrations() {
    registrations.value = readAllCompetitionRegistrations()
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

    const sourceUser =
      readAccountUsersSnapshot().find(
        (item) => item.id === registration.sourceUserKey || item.email === registration.sourceUserKey,
      ) || {
        id: registration.sourceUserKey,
        email: registration.ownerEmail || '',
        name: registration.ownerName || '',
        phone: registration.ownerPhone || '',
      }

    if (!sourceUser) {
      return null
    }

    if (registration.participantKind === 'athlete') {
      const athlete = readAccountAthletesSnapshot(sourceUser).find(
        (item) => item.id === registration.participantId,
      )

      if (athlete) {
        return getAccountDocumentsAdmissionStatus(athlete.documents || [])
      }
    }

    const profile = readAccountProfileSnapshot(sourceUser)
    const profileDocuments = profile.documents || []
    const sourceUserDocuments = sourceUser.documents || []

    return getAccountDocumentsAdmissionStatus(
      profileDocuments.some((document) => document.status !== 'missing')
        ? profileDocuments
        : sourceUserDocuments,
    )
  })

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
    active: registrations.value.filter(
      (registration) => registration.status === COMPETITION_REGISTRATION_RECORD_STATUS.SUBMITTED,
    ).length,
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

  function closeDetailsDialog() {
    isDetailsDialogOpen.value = false
  }

  function updateSelectedRegistration(
    patch = {},
    { closeDialog = false, toastMessage = 'Заявка обновлена' } = {},
  ) {
    const registration = selectedRegistration.value

    if (!registration?.sourceUserKey) {
      return null
    }

    const updatedRegistration = updateCompetitionRegistrationByUserKey(
      registration.sourceUserKey,
      registration.id,
      patch,
      { statusChangedBy: 'admin' },
    )

    if (!updatedRegistration) {
      return null
    }

    loadRegistrations()

    if (closeDialog) {
      closeDetailsDialog()
    }

    if (toastMessage) {
      showToast(toastMessage)
    }

    return updatedRegistration
  }

  function handleStageSave(payload) {
    const stageId = typeof payload === 'string' ? payload : payload?.stageId
    const registrationKind = typeof payload === 'object' && payload ? payload.registrationKind : ''
    const stage = buildAccountCompetitionStages().find((item) => item.id === stageId)

    if (!stage) {
      return
    }

    updateSelectedRegistration(
      {
        ...buildStagePatch(stage),
        ...(registrationKind ? { registrationKind } : {}),
      },
      {
        closeDialog: true,
        toastMessage: 'Заявка обновлена',
      },
    )
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
        const updatedRegistration = updateSelectedRegistration(
          { status: COMPETITION_REGISTRATION_RECORD_STATUS.WITHDRAWN },
          { closeDialog: true, toastMessage: '' },
        )

        if (updatedRegistration) {
          showToast('Участник снят с соревнований')
        }
      })
      .catch(() => {})
  }

  function handleStorageChange(event) {
    const storageKeyValue = String(event?.key || '')

    if (!storageKeyValue.includes('account-competition-registrations')) {
      return
    }

    loadRegistrations()
  }

  onMounted(() => {
    if (typeof window === 'undefined') {
      return
    }

    loadRegistrations()
    window.addEventListener('storage', handleStorageChange)
  })

  onBeforeUnmount(() => {
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
    stageOptions,
    selectedRegistration,
    isDetailsDialogOpen,
    openDetailsDialog,
    closeDetailsDialog,
    selectedRegistrationDocumentsStatus,
    handleStageSave,
    handleWithdrawSelectedRegistration,
    competitionRegistrationRecordStatusType,
    formatCompetitionRegistrationRecordStatus,
    formatCompactDateTime,
  }
}

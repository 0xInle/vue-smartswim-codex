import { computed, reactive, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { buildAccountCompetitionStages } from '@/pages/account/accountCompetitionStages.data'
import {
  createCompetitionRegistration,
  createCompetitionRegistrationRecord,
  loadCompetitionRegistrationsForCurrentUser,
  patchCompetitionRegistration,
} from '@/pages/account/utils/accountCompetitionRegistrations'
import {
  readAccountAthletesSnapshot,
  readAccountProfileSnapshot,
} from '@/pages/account/utils/accountLocalStorage'
import {
  COMPETITION_REGISTRATION_RECORD_STATUS,
  isCompetitionRegistrationActiveStatus,
} from '@/pages/account/utils/accountConstants'
import {
  formatCompetitionDateLabel,
  resolveCompetitionRegistrationState,
} from '@/utils/competitionRegistration'
import { showToast } from '@/utils/toast'
import {
  competitionRegistrationRecordStatusType,
  formatCompetitionRegistrationRecordStatus,
  getAccountDocumentsAdmissionStatus,
  resolveCompetitionRegistrationLifecycleSummary,
} from '@/pages/account/utils/accountFormatters'

const DEFAULT_PARTICIPANT_KIND = 'owner'
const DEFAULT_REGISTRATION_KIND = 'individual'

function createDefaultForm() {
  return {
    participantKind: DEFAULT_PARTICIPANT_KIND,
    participantId: 'owner',
    registrationKind: DEFAULT_REGISTRATION_KIND,
    paymentOptionId: '',
    teamName: '',
    seedTime: '',
    comment: '',
  }
}

function normalizeSearchValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function formatParticipantLabel(participant) {
  if (!participant) {
    return 'Неизвестно'
  }

  return participant.fullName || 'Без имени'
}

export function useAccountCompetitionRegistrations({ currentUser }) {
  const registrations = ref([])
  const isRegistrationsLoading = ref(false)
  const registrationsError = ref('')
  const isRegistrationDialogOpen = ref(false)
  const selectedCompetitionStageId = ref('')
  const ownerSnapshot = ref(readAccountProfileSnapshot(currentUser))
  const athleteSnapshots = ref(readAccountAthletesSnapshot(currentUser))
  const registrationForm = reactive(createDefaultForm())
  const registrationErrors = reactive({
    participantId: '',
    paymentOptionId: '',
    teamName: '',
    seedTime: '',
  })

  const currentUserKey = computed(() => {
    const resolvedUser = currentUser?.value || currentUser || null

    return resolvedUser?.id || resolvedUser?.email || 'anonymous'
  })

  const competitionRows = computed(() =>
    buildAccountCompetitionStages().map((stage) => ({
      ...stage,
      registrationState: resolveCompetitionRegistrationState(stage.registration),
    })),
  )

  const competitionOptions = computed(() => {
    const uniqueCompetitions = new Map()

    competitionRows.value.forEach((row) => {
      if (!uniqueCompetitions.has(row.competitionSlug)) {
        uniqueCompetitions.set(row.competitionSlug, {
          value: row.competitionSlug,
          label: row.competitionName,
        })
      }
    })

    return [{ value: 'all', label: 'Все соревнования' }, ...uniqueCompetitions.values()]
  })

  const filteredCompetitionRows = computed(() => {
    return competitionRows.value.slice().sort((left, right) => {
      const leftValue = Number(left.stage) || 0
      const rightValue = Number(right.stage) || 0

      if (left.competitionSlug === right.competitionSlug) {
        return leftValue - rightValue
      }

      return normalizeSearchValue(left.competitionName).localeCompare(
        normalizeSearchValue(right.competitionName),
      )
    })
  })

  const registrationHistory = computed(() =>
    [...registrations.value].sort((left, right) => {
      const leftTime = Date.parse(left.statusChangedAt || left.createdAt || 0) || 0
      const rightTime = Date.parse(right.statusChangedAt || right.createdAt || 0) || 0

      return rightTime - leftTime
    }),
  )

  const participantOptions = computed(() => {
    const options = [
      {
        value: 'owner',
        label: `${ownerSnapshot.value.fullName || 'Пользователь'}`,
        subtitle: ownerSnapshot.value.email || 'Основной профиль',
        kind: 'owner',
      },
    ]

    athleteSnapshots.value.forEach((athlete) => {
      options.push({
        value: athlete.id,
        label: athlete.fullName || 'Без имени',
        subtitle: athlete.birthDate || athlete.club || 'Спортсмен',
        kind: 'athlete',
      })
    })

    return options
  })

  const selectedStage = computed(
    () => filteredCompetitionRows.value.find((row) => row.id === selectedCompetitionStageId.value) || null,
  )
  const availableStagesCount = computed(
    () =>
      filteredCompetitionRows.value.filter((row) => row.registrationState.mode !== 'closed').length,
  )
  const openStagesCount = computed(
    () => filteredCompetitionRows.value.filter((row) => row.registrationState.mode === 'open').length,
  )
  const registrationsCount = computed(() => registrations.value.length)
  const activeRegistrationsCount = computed(
    () => registrations.value.filter((registration) => isCompetitionRegistrationActiveStatus(registration.status)).length,
  )

  function syncSnapshots() {
    ownerSnapshot.value = readAccountProfileSnapshot(currentUser)
    athleteSnapshots.value = readAccountAthletesSnapshot(currentUser)
  }

  let loadRequestId = 0

  async function loadRegistrations() {
    const requestId = loadRequestId + 1
    loadRequestId = requestId
    isRegistrationsLoading.value = true
    registrationsError.value = ''

    try {
      const nextRegistrations = await loadCompetitionRegistrationsForCurrentUser(currentUser)

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

  function resetRegistrationErrors() {
    registrationErrors.participantId = ''
    registrationErrors.paymentOptionId = ''
    registrationErrors.teamName = ''
    registrationErrors.seedTime = ''
  }

  function resetRegistrationForm() {
    Object.assign(registrationForm, createDefaultForm())
    resetRegistrationErrors()
  }

  function normalizeParticipantById(participantId) {
    if (participantId === 'owner') {
      return {
        id: 'owner',
        kind: 'owner',
        fullName: ownerSnapshot.value.fullName || currentUser?.value?.name || '',
        birthDate: ownerSnapshot.value.birthDate || '',
        club: ownerSnapshot.value.club || '',
        phone: ownerSnapshot.value.phone || '',
        email: ownerSnapshot.value.email || currentUser?.value?.email || '',
      }
    }

    const athlete = athleteSnapshots.value.find((item) => item.id === participantId)

    if (!athlete) {
      return null
    }

    return {
      id: athlete.id,
      kind: 'athlete',
      fullName: athlete.fullName || '',
      birthDate: athlete.birthDate || '',
      club: athlete.club || '',
      phone: ownerSnapshot.value.phone || '',
      email: ownerSnapshot.value.email || '',
    }
  }

  function openRegistrationDialog(stageId) {
    const targetStage = filteredCompetitionRows.value.find((row) => row.id === stageId)

    if (!targetStage) {
      return
    }

    selectedCompetitionStageId.value = stageId
    syncSnapshots()
    resetRegistrationForm()
    isRegistrationDialogOpen.value = true

    const firstParticipant = participantOptions.value[0]
    registrationForm.participantId = firstParticipant?.value || 'owner'
    registrationForm.participantKind = firstParticipant?.kind || 'owner'
  }

  function closeRegistrationDialog() {
    isRegistrationDialogOpen.value = false
    selectedCompetitionStageId.value = ''
    resetRegistrationForm()
  }

  function validateRegistrationForm() {
    resetRegistrationErrors()

    if (!selectedStage.value) {
      return false
    }

    if (!registrationForm.participantId) {
      registrationErrors.participantId = 'Выберите участника.'
    }

    const selectedParticipant = normalizeParticipantById(registrationForm.participantId)

    if (!selectedParticipant) {
      registrationErrors.participantId = 'Выберите участника из списка.'
    }

    if (registrationForm.registrationKind === 'relay' && !registrationForm.teamName.trim()) {
      registrationErrors.teamName = 'Укажите название эстафеты или команды.'
    }

    if (registrationForm.registrationKind === 'long-distance' && !registrationForm.seedTime.trim()) {
      registrationErrors.seedTime = 'Укажите ориентировочное время или комментарий.'
    }

    const hasActiveDuplicate = registrations.value.some(
      (registration) =>
        registration.stageId === selectedStage.value.id &&
        registration.participantId === registrationForm.participantId &&
        isCompetitionRegistrationActiveStatus(registration.status),
    )

    if (hasActiveDuplicate) {
      registrationErrors.participantId = 'У этого участника уже есть активная заявка на этап.'
      showToast('Активная заявка на этот этап уже создана', { type: 'error' })
    }

    return !Object.values(registrationErrors).some(Boolean)
  }

  async function handleRegistrationSubmit() {
    if (!validateRegistrationForm() || !selectedStage.value) {
      return false
    }

    const selectedParticipant = normalizeParticipantById(registrationForm.participantId)
    const record = createCompetitionRegistrationRecord({
      competitionSlug: selectedStage.value.competitionSlug,
      competitionName: selectedStage.value.competitionName,
      stageId: selectedStage.value.id,
      stageLabel: `Этап ${selectedStage.value.stage}`,
      competitionDateLabel: formatCompetitionDateLabel(selectedStage.value.date),
      competitionWindowLabel:
        selectedStage.value.registrationState.mode === 'open'
          ? `Открыта до ${selectedStage.value.registrationState.closeDateLabel}`
          : `${selectedStage.value.registrationState.openDateLabel} - ${selectedStage.value.registrationState.closeDateLabel}`,
      participantKind: registrationForm.participantKind,
      participantId: registrationForm.participantId,
      participantName: selectedParticipant?.fullName || '',
      participantBirthDate: selectedParticipant?.birthDate || '',
      participantClub: selectedParticipant?.club || '',
      participantPhone: selectedParticipant?.phone || '',
      participantEmail: selectedParticipant?.email || '',
      ownerName: ownerSnapshot.value.fullName || currentUser?.value?.name || '',
      ownerEmail: ownerSnapshot.value.email || currentUser?.value?.email || '',
      ownerPhone: ownerSnapshot.value.phone || '',
      registrationKind: registrationForm.registrationKind,
      paymentOptionId: '',
      paymentOptionTitle: '',
      teamName: registrationForm.teamName.trim(),
      seedTime: registrationForm.seedTime.trim(),
      comment: registrationForm.comment.trim(),
      status: 'submitted',
      statusChangedBy: ownerSnapshot.value.fullName || currentUser?.value?.name || 'user',
    })

    try {
      const savedRecord = await createCompetitionRegistration(currentUser, record)

      registrations.value = [
        savedRecord,
        ...registrations.value.filter((registration) => registration.id !== savedRecord.id),
      ]
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось создать заявку', {
        type: 'error',
      })
      return false
    }

    showToast('Заявка на соревнования создана')
    closeRegistrationDialog()
    return true
  }

  async function handleWithdrawRegistration(registrationId) {
    const targetRegistration = registrations.value.find((registration) => registration.id === registrationId)

    if (!targetRegistration || !isCompetitionRegistrationActiveStatus(targetRegistration.status)) {
      return false
    }

    try {
      await ElMessageBox.confirm(
        'Снять спортсмена с соревнований? Заявка останется в истории.',
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
    } catch {
      return false
    }

    let updatedRegistration = null

    try {
      updatedRegistration = await patchCompetitionRegistration(
        currentUser,
        registrationId,
        {
          status: COMPETITION_REGISTRATION_RECORD_STATUS.WITHDRAWN,
        },
        {
          statusChangedBy: ownerSnapshot.value.fullName || currentUser?.value?.name || 'user',
        },
      )
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось снять спортсмена', {
        type: 'error',
      })
      return false
    }

    if (!updatedRegistration) {
      return false
    }

    registrations.value = registrations.value.map((registration) =>
      registration.id === registrationId ? updatedRegistration : registration,
    )

    showToast('Спортсмен снят с соревнований')
    return true
  }

  async function updateSelectedRegistration(registrationId, patch = {}) {
    let updatedRegistration = null

    try {
      updatedRegistration = await patchCompetitionRegistration(
        currentUser,
        registrationId,
        patch,
        {
          statusChangedBy: ownerSnapshot.value.fullName || currentUser?.value?.name || 'user',
        },
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

    registrations.value = registrations.value.map((registration) =>
      registration.id === registrationId ? updatedRegistration : registration,
    )

    return updatedRegistration
  }

  function getRegistrationStatusLabel(status) {
    return formatCompetitionRegistrationRecordStatus(status)
  }

  function getRegistrationStatusTagType(status) {
    return competitionRegistrationRecordStatusType(status)
  }

  function getRegistrationDocumentsStatus(registration) {
    if (!registration) {
      return null
    }

    if (registration.participantKind === 'athlete') {
      const athlete = athleteSnapshots.value.find((item) => item.id === registration.participantId)

      if (athlete) {
        return getAccountDocumentsAdmissionStatus(athlete.documents || [])
      }
    }

    return getAccountDocumentsAdmissionStatus(ownerSnapshot.value.documents || [])
  }

  function getRegistrationLifecycleSummary(registration) {
    return resolveCompetitionRegistrationLifecycleSummary(registration, {
      audience: 'user',
      documentsStatus: getRegistrationDocumentsStatus(registration),
    })
  }

  function formatParticipantName(record) {
    return formatParticipantLabel({
      kind: record.participantKind,
      fullName: record.participantName,
    })
  }

  function formatRegistrationTypeLabel(value) {
    if (value === 'relay') {
      return 'Эстафета'
    }

    if (value === 'long-distance') {
      return 'Длинная дистанция'
    }

    return 'Обычная'
  }

  watch(currentUserKey, () => {
    syncSnapshots()
    void loadRegistrations()
  }, { immediate: true })

  return {
    ownerSnapshot,
    athleteSnapshots,
    competitionRows,
    competitionOptions,
    filteredCompetitionRows,
    registrationHistory,
    participantOptions,
    selectedStage,
    availableStagesCount,
    openStagesCount,
    registrationsCount,
    activeRegistrationsCount,
    isRegistrationsLoading,
    registrationsError,
    registrationForm,
    registrationErrors,
    isRegistrationDialogOpen,
    selectedCompetitionStageId,
    openRegistrationDialog,
    closeRegistrationDialog,
    handleRegistrationSubmit,
    handleWithdrawRegistration,
    updateSelectedRegistration,
    getRegistrationStatusLabel,
    getRegistrationStatusTagType,
    getRegistrationDocumentsStatus,
    getRegistrationLifecycleSummary,
    formatParticipantName,
    formatRegistrationTypeLabel,
  }
}

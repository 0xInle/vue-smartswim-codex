import { computed, reactive, ref, watch } from 'vue'
import { accountMockCompetitionStages } from '@/pages/account/accountCompetitionStages.data'
import {
  createCompetitionRegistrationRecord,
  persistCompetitionRegistrations,
  readCompetitionRegistrations,
} from '@/pages/account/utils/accountCompetitionRegistrations'
import {
  readAccountAthletesSnapshot,
  readAccountProfileSnapshot,
} from '@/pages/account/utils/accountLocalStorage'
import {
  formatCompetitionDateLabel,
  resolveCompetitionRegistrationState,
} from '@/utils/competitionRegistration'
import { showToast } from '@/utils/toast'

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
    accountMockCompetitionStages.map((stage) => ({
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
      const leftTime = Date.parse(left.createdAt || 0) || 0
      const rightTime = Date.parse(right.createdAt || 0) || 0

      return rightTime - leftTime
    }),
  )

  const participantOptions = computed(() => {
    const options = [
      {
        value: 'owner',
        label: `${ownerSnapshot.value.fullName || 'Владелец кабинета'}`,
        subtitle: ownerSnapshot.value.email || 'Основной аккаунт',
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

  const selectedStagePaymentOptions = computed(() => selectedStage.value?.registration?.options || [])
  const availableStagesCount = computed(
    () =>
      filteredCompetitionRows.value.filter((row) => row.registrationState.mode !== 'closed').length,
  )
  const openStagesCount = computed(
    () => filteredCompetitionRows.value.filter((row) => row.registrationState.mode === 'open').length,
  )
  const registrationsCount = computed(() => registrations.value.length)

  function syncSnapshots() {
    ownerSnapshot.value = readAccountProfileSnapshot(currentUser)
    athleteSnapshots.value = readAccountAthletesSnapshot(currentUser)
  }

  function loadRegistrations() {
    registrations.value = readCompetitionRegistrations(currentUser)
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
    registrationForm.paymentOptionId = targetStage.registration?.options?.[0]?.id || ''
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

    if (selectedStagePaymentOptions.value.length && !registrationForm.paymentOptionId) {
      registrationErrors.paymentOptionId = 'Выберите вариант оплаты.'
    }

    if (registrationForm.registrationKind === 'relay' && !registrationForm.teamName.trim()) {
      registrationErrors.teamName = 'Укажите название эстафеты или команды.'
    }

    if (registrationForm.registrationKind === 'long-distance' && !registrationForm.seedTime.trim()) {
      registrationErrors.seedTime = 'Укажите ориентировочное время или комментарий.'
    }

    return !Object.values(registrationErrors).some(Boolean)
  }

  function handleRegistrationSubmit() {
    if (!validateRegistrationForm() || !selectedStage.value) {
      return false
    }

    const selectedParticipant = normalizeParticipantById(registrationForm.participantId)
    const selectedPayment = selectedStagePaymentOptions.value.find(
      (option) => option.id === registrationForm.paymentOptionId,
    )
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
      paymentOptionId: selectedPayment?.id || '',
      paymentOptionTitle: selectedPayment?.title || '',
      teamName: registrationForm.teamName.trim(),
      seedTime: registrationForm.seedTime.trim(),
      comment: registrationForm.comment.trim(),
      status: 'submitted',
    })

    registrations.value = [record, ...registrations.value]
    persistCompetitionRegistrations(currentUser, registrations.value)
    showToast('Заявка на соревнования создана')
    closeRegistrationDialog()
    return true
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
    loadRegistrations()
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
    selectedStagePaymentOptions,
    availableStagesCount,
    openStagesCount,
    registrationsCount,
    registrationForm,
    registrationErrors,
    isRegistrationDialogOpen,
    selectedCompetitionStageId,
    openRegistrationDialog,
    closeRegistrationDialog,
    handleRegistrationSubmit,
    formatParticipantName,
    formatRegistrationTypeLabel,
  }
}

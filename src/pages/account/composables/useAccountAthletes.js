import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { trainers } from '@/pages/trainers/trainersData'
import { ElMessageBox } from 'element-plus'
import { showToast } from '@/utils/toast'
import {
  createAccountDocumentsState,
  normalizeAccountDocumentsState,
} from '@/pages/account/utils/accountDocumentTypes'
import {
  countCompetitionRegistrationsForParticipantFromSource,
  syncCompetitionRegistrationAthleteSnapshotFromSource,
} from '@/pages/account/utils/accountCompetitionRegistrations'
import {
  loadAccountDocumentsForCurrentUser,
  saveAccountDocumentForCurrentUser,
  subscribeToAccountDocumentChanges,
} from '@/domains/account-documents/documentRepository'
import {
  loadAccountAthletesForCurrentUser,
  removeAccountAthleteForCurrentUser,
  saveAccountAthleteForCurrentUser,
  subscribeToAccountProfileAthleteChanges,
} from '@/domains/account-data/accountDataRepository'
import {
  refreshAccountAdmissionWorkflowForCurrentUser,
} from '@/pages/account/utils/accountAdmissions'
import { subscribeToAccountAdmissionWorkflowChanges } from '@/domains/account-admissions/accountAdmissionRepository'

const GENDER_OPTIONS = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
]

function createClientUuid() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (character) =>
    (
      Number(character) ^
      (globalThis.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(character) / 4)))
    ).toString(16),
  )
}

export function useAccountAthletes({ currentUser }) {
  const athletes = ref([])
  const editingAthleteId = ref('')
  let unsubscribeFromSupabaseDocuments = null
  let unsubscribeFromSupabaseAccountData = null
  let unsubscribeFromSupabaseAdmissionWorkflow = null

  const form = reactive({
    fullName: '',
    birthDate: '',
    gender: '',
    club: '',
    rank: '',
    coach: '',
    documents: createAccountDocumentsState(),
  })

  const errors = reactive({
    fullName: '',
    birthDate: '',
    gender: '',
    club: '',
    coach: '',
  })

  const coachPlaceholder = computed(() =>
    trainers.length ? 'Введите ФИО тренера' : 'Тренеры пока не добавлены',
  )

  const trainerSuggestions = computed(() =>
    trainers.map((trainer) => ({
      value: trainer.name,
      id: trainer.id,
    })),
  )

  function resetErrors() {
    errors.fullName = ''
    errors.birthDate = ''
    errors.gender = ''
    errors.club = ''
    errors.coach = ''
  }

  function normalizeAthlete(rawAthlete) {
    return {
      id: rawAthlete?.id || createClientUuid(),
      fullName: rawAthlete?.fullName || '',
      birthDate: rawAthlete?.birthDate || '',
      gender: rawAthlete?.gender || '',
      club: rawAthlete?.club || '',
      rank: rawAthlete?.rank || '',
      coach: rawAthlete?.coach || '',
      documents: normalizeAccountDocumentsState(rawAthlete?.documents),
    }
  }

  async function loadSupabaseDocumentsForAthlete(athlete) {
    const sourceDocuments = await loadAccountDocumentsForCurrentUser({
      scope: 'athlete',
      scopeId: athlete.id,
    })

    return normalizeAccountDocumentsState(sourceDocuments)
  }

  async function syncAthleteDocumentsFromSource() {
    try {
      const nextAthletes = await Promise.all(
        athletes.value.map(async (athlete) => ({
          ...athlete,
          documents: await loadSupabaseDocumentsForAthlete(athlete),
        })),
      )

      athletes.value = nextAthletes

      if (editingAthleteId.value) {
        const editedAthlete = nextAthletes.find((athlete) => athlete.id === editingAthleteId.value)

        if (editedAthlete) {
          form.documents = normalizeAccountDocumentsState(editedAthlete.documents)
        }
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Не удалось загрузить документы спортсменов',
        { type: 'error' },
      )
    }
  }

  async function syncAthletesFromSource() {
    try {
      const [sourceAthletes] = await Promise.all([
        loadAccountAthletesForCurrentUser(),
        refreshAccountAdmissionWorkflowForCurrentUser(),
      ])
      const nextAthletes = sourceAthletes.map(normalizeAthlete)

      athletes.value = nextAthletes.map((athlete) => ({
        ...athlete,
        documents: createAccountDocumentsState(),
      }))
      await syncAthleteDocumentsFromSource()
    } catch (error) {
      athletes.value = []
      showToast(error instanceof Error ? error.message : 'Не удалось загрузить спортсменов', {
        type: 'error',
      })
    }
  }

  async function persistSupabaseAthleteDocument(athlete, document) {
    return saveAccountDocumentForCurrentUser({
      currentUser,
      scope: 'athlete',
      scopeId: athlete.id,
      document: {
        ...document,
        ownerName: currentUser.value?.name || '',
        ownerEmail: currentUser.value?.email || '',
        ownerPhone: currentUser.value?.phone || '',
        participantKind: 'athlete',
        participantId: athlete.id,
        participantName: athlete.fullName,
        participantBirthDate: athlete.birthDate,
        participantClub: athlete.club,
      },
    })
  }

  async function persistSupabaseAthleteDocuments(athlete) {
    const loadedDocuments = normalizeAccountDocumentsState(athlete.documents).filter(
      (document) => document.status !== 'missing',
    )

    await Promise.all(
      loadedDocuments.map((document) => persistSupabaseAthleteDocument(athlete, document)),
    )
  }

  function persistEditedAthleteDocuments() {
    if (!editingAthleteId.value) {
      return true
    }

    let nextAthlete = null

    athletes.value = athletes.value.map((athlete) => {
      if (athlete.id !== editingAthleteId.value) {
        return athlete
      }

      nextAthlete = normalizeAthlete({
        ...athlete,
        documents: form.documents,
      })

      return nextAthlete
    })

    if (!nextAthlete) {
      return false
    }

    athletes.value = athletes.value.map((athlete) =>
      athlete.id === nextAthlete.id ? nextAthlete : athlete,
    )

    void persistSupabaseAthleteDocuments(nextAthlete).catch((error) => {
      showToast(error instanceof Error ? error.message : 'Не удалось сохранить документы', {
        type: 'error',
      })
    })

    return true
  }

  function resetForm() {
    form.fullName = ''
    form.birthDate = ''
    form.gender = ''
    form.club = ''
    form.rank = ''
    form.coach = ''
    form.documents = createAccountDocumentsState()
    editingAthleteId.value = ''
    resetErrors()
  }

  function updateFormField(field, value) {
    if (!Object.prototype.hasOwnProperty.call(form, field)) {
      return
    }

    form[field] = value
  }

  function startEdit(athlete) {
    form.fullName = athlete.fullName
    form.birthDate = athlete.birthDate
    form.gender = athlete.gender
    form.club = athlete.club
    form.rank = athlete.rank
    form.coach = athlete.coach
    form.documents = normalizeAccountDocumentsState(athlete.documents)
    editingAthleteId.value = athlete.id
    resetErrors()
  }

  function cancelEdit() {
    resetForm()
  }

  function deleteAthlete(athleteId) {
    void ElMessageBox.confirm(
      'Удалить спортсмена? Это действие нельзя отменить.',
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
      .then(async () => {
        let activeRegistrationsCount = 0

        try {
          activeRegistrationsCount = await countCompetitionRegistrationsForParticipantFromSource(
            currentUser,
            {
              participantKind: 'athlete',
              participantId: athleteId,
            },
          )
        } catch {
          showToast('Не удалось проверить заявки спортсмена. Спортсмен не удалён.', {
            type: 'error',
          })
          return
        }

        if (activeRegistrationsCount > 0) {
          showToast('Нельзя удалить спортсмена: есть активные заявки на соревнования', {
            type: 'error',
          })
          return
        }

        try {
          await removeAccountAthleteForCurrentUser(athleteId)
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Не удалось удалить спортсмена', {
            type: 'error',
          })
          return
        }

        athletes.value = athletes.value.filter((athlete) => athlete.id !== athleteId)

        if (editingAthleteId.value === athleteId) {
          resetForm()
        }

        showToast('Спортсмен удалён')
      })
      .catch(() => {})
  }

  function validateForm() {
    resetErrors()
    const birthDatePattern = /^\d{2}\.\d{2}\.\d{4}$/
    const normalizedCoach = form.coach.trim().toLowerCase()
    const coachIsKnown = trainerSuggestions.value.some(
      (trainer) => trainer.value.toLowerCase() === normalizedCoach,
    )

    if (!form.fullName) {
      errors.fullName = 'Укажите ФИО спортсмена.'
    }

    if (!form.birthDate) {
      errors.birthDate = 'Укажите дату рождения.'
    } else if (!birthDatePattern.test(form.birthDate)) {
      errors.birthDate = 'Введите дату в формате дд.мм.гггг.'
    }

    if (!form.gender) {
      errors.gender = 'Выберите пол.'
    }

    if (!form.club) {
      errors.club = 'Укажите клуб.'
    }

    if (!form.coach) {
      errors.coach = 'Выберите тренера.'
    } else if (!coachIsKnown) {
      errors.coach = 'Выберите тренера из списка.'
    }

    return !Object.values(errors).some(Boolean)
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return false
    }

    const payload = normalizeAthlete({
      id: editingAthleteId.value,
      fullName: form.fullName,
      birthDate: form.birthDate,
      gender: form.gender,
      club: form.club,
      rank: form.rank,
      coach: form.coach,
      documents: form.documents,
    })

    let savedAthlete = null

    try {
      savedAthlete = await saveAccountAthleteForCurrentUser({ athlete: payload })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось сохранить спортсмена', {
        type: 'error',
      })
      return false
    }

    savedAthlete = {
      ...savedAthlete,
      documents: normalizeAccountDocumentsState(payload.documents),
    }

    if (editingAthleteId.value) {
      athletes.value = athletes.value.map((athlete) =>
        athlete.id === editingAthleteId.value ? savedAthlete : athlete,
      )
    } else {
      athletes.value = [savedAthlete, ...athletes.value]
    }

    void persistSupabaseAthleteDocuments(payload).catch((error) => {
      showToast(error instanceof Error ? error.message : 'Не удалось сохранить документы', {
        type: 'error',
      })
    })

    void syncCompetitionRegistrationAthleteSnapshotFromSource(currentUser, savedAthlete)

    showToast(editingAthleteId.value ? 'Спортсмен сохранён' : 'Спортсмен добавлен')
    resetForm()
    return true
  }

  function genderLabel(value) {
    return GENDER_OPTIONS.find((option) => option.value === value)?.label || 'Не указан'
  }

  function fetchCoachSuggestions(queryString, callback) {
    const normalizedQuery = queryString.trim().toLowerCase()
    const results = normalizedQuery
      ? trainerSuggestions.value.filter((trainer) =>
          trainer.value.toLowerCase().startsWith(normalizedQuery),
        )
      : trainerSuggestions.value

    callback(results.slice(0, 8))
  }

  function handleCoachSelect(item) {
    form.coach = item.value
    errors.coach = ''
  }

  const documentUploadState = reactive({
    isOpen: false,
    documentType: '',
    fileName: '',
    fileSize: 0,
    expiresAt: '',
  })

  function getDocumentState(documentType) {
    return form.documents.find((document) => document.type === documentType) || null
  }

  function openDocumentUploadDialog(documentType) {
    const target = getDocumentState(documentType)

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

  function upsertDocument(documentType, patch) {
    const hasDocument = form.documents.some((document) => document.type === documentType)

    if (!hasDocument) {
      return
    }

    form.documents = form.documents.map((document) =>
      document.type === documentType
        ? {
            ...document,
            ...patch,
          }
        : document,
    )
  }

  function getEditingAthlete() {
    return athletes.value.find((athlete) => athlete.id === editingAthleteId.value) || null
  }

  function handleDocumentUploadSubmit({ file, fileDataUrl = '', fileType = '', expiresAt }) {
    if (!documentUploadState.documentType || !file) {
      return
    }

    upsertDocument(documentUploadState.documentType, {
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

    persistEditedAthleteDocuments()

    if (editingAthleteId.value) {
      const editedAthlete = getEditingAthlete()
      const nextDocument = form.documents.find(
        (document) => document.type === documentUploadState.documentType,
      )

      if (editedAthlete && nextDocument) {
        void persistSupabaseAthleteDocument(
          {
            ...editedAthlete,
            documents: form.documents,
          },
          nextDocument,
        )
          .then(() => syncAthleteDocumentsFromSource())
          .catch((error) => {
            showToast(error instanceof Error ? error.message : 'Не удалось сохранить документ', {
              type: 'error',
            })
          })
      }
    }

    closeDocumentUploadDialog()
  }

  function handleDocumentRemove(documentType) {
    const targetDocument = form.documents.find((document) => document.type === documentType)

    if (!targetDocument) {
      return
    }

    void ElMessageBox.confirm(
      `Удалить документ «${targetDocument.label}»?`,
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
        upsertDocument(documentType, {
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

        persistEditedAthleteDocuments()

        if (editingAthleteId.value) {
          const editedAthlete = getEditingAthlete()
          const nextDocument = form.documents.find((document) => document.type === documentType)

          if (editedAthlete && nextDocument) {
            void persistSupabaseAthleteDocument(
              {
                ...editedAthlete,
                documents: form.documents,
              },
              nextDocument,
            )
              .then(() => syncAthleteDocumentsFromSource())
              .catch((error) => {
                showToast(error instanceof Error ? error.message : 'Не удалось удалить документ', {
                  type: 'error',
                })
              })
          }
        }
      })
      .catch(() => {})
  }

  watch(
    currentUser,
    () => {
      void syncAthletesFromSource()
      resetForm()
    },
    { immediate: true },
  )

  onMounted(() => {
    unsubscribeFromSupabaseDocuments = subscribeToAccountDocumentChanges(() => {
      void syncAthleteDocumentsFromSource()
    })
    unsubscribeFromSupabaseAccountData = subscribeToAccountProfileAthleteChanges(() => {
      void syncAthletesFromSource()
    })
    unsubscribeFromSupabaseAdmissionWorkflow = subscribeToAccountAdmissionWorkflowChanges(() => {
      void syncAthletesFromSource()
    })
  })

  onBeforeUnmount(() => {
    if (unsubscribeFromSupabaseDocuments) {
      unsubscribeFromSupabaseDocuments()
      unsubscribeFromSupabaseDocuments = null
    }

    if (unsubscribeFromSupabaseAccountData) {
      unsubscribeFromSupabaseAccountData()
      unsubscribeFromSupabaseAccountData = null
    }

    if (unsubscribeFromSupabaseAdmissionWorkflow) {
      unsubscribeFromSupabaseAdmissionWorkflow()
      unsubscribeFromSupabaseAdmissionWorkflow = null
    }
  })

  return {
    athletes,
    editingAthleteId,
    form,
    errors,
    genderOptions: GENDER_OPTIONS,
    coachPlaceholder,
    documentUploadState,
    startEdit,
    cancelEdit,
    deleteAthlete,
    resetForm,
    updateFormField,
    handleSubmit,
    genderLabel,
    fetchCoachSuggestions,
    handleCoachSelect,
    openDocumentUploadDialog,
    closeDocumentUploadDialog,
    handleDocumentUploadSubmit,
    handleDocumentRemove,
  }
}

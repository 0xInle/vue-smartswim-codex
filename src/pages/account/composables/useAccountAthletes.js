import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { trainers } from '@/pages/trainers/trainersData'
import { ElMessageBox } from 'element-plus'
import { showToast } from '@/utils/toast'
import { normalizeDateInput } from '@/utils/dateInput'
import { sanitizeDateFieldInput, sanitizePersonNameInput } from '@/utils/inputSanitizers'
import {
  createAccountDocumentRemovalPatch,
  createAccountDocumentUploadPatch,
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
const ATHLETES_REFRESH_DEBOUNCE_MS = 300

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
  const isSubmitting = ref(false)
  const isInitialAthletesLoading = ref(true)
  let unsubscribeFromSupabaseDocuments = null
  let unsubscribeFromSupabaseAccountData = null
  let unsubscribeFromSupabaseAdmissionWorkflow = null
  let athleteDocumentsRefreshTimer = null
  let athletesRefreshTimer = null

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

  function getCurrentOwnerId() {
    return currentUser?.value?.id || currentUser?.id || ''
  }

  function getRealtimePayloadOwnerId(payload) {
    return payload?.new?.owner_user_id || payload?.old?.owner_user_id || ''
  }

  function shouldHandleCurrentOwnerPayload(payload) {
    const ownerId = getRealtimePayloadOwnerId(payload)

    return !ownerId || ownerId === getCurrentOwnerId()
  }

  function scheduleAthleteDocumentsSync() {
    if (athleteDocumentsRefreshTimer) {
      return
    }

    athleteDocumentsRefreshTimer = window.setTimeout(() => {
      athleteDocumentsRefreshTimer = null
      void syncAthleteDocumentsFromSource()
    }, ATHLETES_REFRESH_DEBOUNCE_MS)
  }

  function scheduleAthletesSync() {
    if (athletesRefreshTimer) {
      return
    }

    athletesRefreshTimer = window.setTimeout(() => {
      athletesRefreshTimer = null
      void syncAthletesFromSource()
    }, ATHLETES_REFRESH_DEBOUNCE_MS)
  }

  function cancelAthletesRefreshTimers() {
    if (athleteDocumentsRefreshTimer) {
      clearTimeout(athleteDocumentsRefreshTimer)
      athleteDocumentsRefreshTimer = null
    }

    if (athletesRefreshTimer) {
      clearTimeout(athletesRefreshTimer)
      athletesRefreshTimer = null
    }
  }

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

  async function loadSupabaseDocumentsForAthletes(nextAthletes = []) {
    const athleteIds = nextAthletes.map((athlete) => athlete.id).filter(Boolean)

    if (!athleteIds.length) {
      return new Map()
    }

    const sourceDocuments = await loadAccountDocumentsForCurrentUser({
      scope: 'athlete',
      scopeIds: athleteIds,
    })
    const documentsByAthleteId = new Map(athleteIds.map((athleteId) => [athleteId, []]))

    sourceDocuments.forEach((document) => {
      const athleteId = document.scopeId || document.participantId

      if (!documentsByAthleteId.has(athleteId)) {
        return
      }

      documentsByAthleteId.get(athleteId).push(document)
    })

    return documentsByAthleteId
  }

  async function syncAthleteDocumentsFromSource() {
    try {
      const documentsByAthleteId = await loadSupabaseDocumentsForAthletes(athletes.value)
      athletes.value = athletes.value.map((athlete) => ({
        ...athlete,
        documents: normalizeAccountDocumentsState(documentsByAthleteId.get(athlete.id)),
      }))

      if (editingAthleteId.value) {
        const editedAthlete = athletes.value.find((athlete) => athlete.id === editingAthleteId.value)

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

  async function syncAthletesFromSource({ showLoading = false } = {}) {
    if (showLoading) {
      isInitialAthletesLoading.value = true
    }

    try {
      const [sourceAthletes] = await Promise.all([
        loadAccountAthletesForCurrentUser(),
        refreshAccountAdmissionWorkflowForCurrentUser(),
      ])
      const normalizedAthletes = sourceAthletes.map((sourceAthlete) => normalizeAthlete(sourceAthlete))
      const documentsByAthleteId = await loadSupabaseDocumentsForAthletes(normalizedAthletes)
      const nextAthletes = normalizedAthletes.map((athlete) => ({
        ...athlete,
        documents: normalizeAccountDocumentsState(documentsByAthleteId.get(athlete.id)),
      }))

      athletes.value = nextAthletes

      if (editingAthleteId.value) {
        const editedAthlete = athletes.value.find((athlete) => athlete.id === editingAthleteId.value)

        if (editedAthlete) {
          form.documents = normalizeAccountDocumentsState(editedAthlete.documents)
        }
      }
    } catch (error) {
      athletes.value = []
      showToast(error instanceof Error ? error.message : 'Не удалось загрузить спортсменов', {
        type: 'error',
      })
    } finally {
      if (showLoading) {
        isInitialAthletesLoading.value = false
      }
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

    if (field === 'fullName') {
      form.fullName = sanitizePersonNameInput(value)
      errors.fullName = ''
      return
    }

    if (field === 'birthDate') {
      form.birthDate = sanitizeDateFieldInput(value)
      errors.birthDate = ''
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
        confirmButtonClass: 'account__table-action account__table-action--delete btn-reset',
        cancelButtonClass: 'account__table-action account__table-action--ghost btn-reset',
        type: 'warning',
        autofocus: false,
        closeOnClickModal: false,
        closeOnPressEscape: true,
        beforeClose: async (action, instance, done) => {
          if (action !== 'confirm') {
            done()
            return
          }

          if (instance.confirmButtonLoading) {
            return
          }

          instance.confirmButtonLoading = true

          try {
            const activeRegistrationsCount = await countCompetitionRegistrationsForParticipantFromSource(
              currentUser,
              {
                participantKind: 'athlete',
                participantId: athleteId,
              },
            )

            if (activeRegistrationsCount > 0) {
              showToast('Нельзя удалить спортсмена: есть активные заявки на соревнования', {
                type: 'error',
              })
              return
            }

            await removeAccountAthleteForCurrentUser(athleteId)

            if (editingAthleteId.value === athleteId) {
              resetForm()
            }

            await syncAthletesFromSource()

            showToast('Спортсмен удалён')
            done()
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Не удалось удалить спортсмена', {
              type: 'error',
            })
          } finally {
            instance.confirmButtonLoading = false
          }
        },
      },
    ).catch(() => {})
  }

  function validateForm() {
    resetErrors()
    const birthDatePattern = /^\d{2}\.\d{2}\.\d{4}$/
    const normalizedBirthDate = normalizeDateInput(form.birthDate)

    if (!form.fullName) {
      errors.fullName = 'Укажите ФИО спортсмена.'
    }

    if (!normalizedBirthDate) {
      errors.birthDate = 'Укажите дату рождения.'
    } else if (!birthDatePattern.test(normalizedBirthDate)) {
      errors.birthDate = 'Введите дату в формате дд.мм.гггг.'
    }

    if (!form.gender) {
      errors.gender = 'Выберите пол.'
    }

    if (!form.club) {
      errors.club = 'Укажите клуб.'
    }

    return !Object.values(errors).some(Boolean)
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return false
    }

    const isEditingAthlete = Boolean(editingAthleteId.value)
    const payload = normalizeAthlete({
      id: editingAthleteId.value,
      fullName: form.fullName,
      birthDate: normalizeDateInput(form.birthDate),
      gender: form.gender,
      club: form.club,
      rank: form.rank,
      coach: form.coach,
      documents: form.documents,
    })

    isSubmitting.value = true

    try {
      const savedAthlete = {
        ...(await saveAccountAthleteForCurrentUser({ athlete: payload })),
        documents: normalizeAccountDocumentsState(payload.documents),
      }

      try {
        await persistSupabaseAthleteDocuments(savedAthlete)
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Не удалось сохранить документы', {
          type: 'error',
        })
      }

      void syncCompetitionRegistrationAthleteSnapshotFromSource(currentUser, savedAthlete)
      await syncAthletesFromSource()

      showToast(isEditingAthlete ? 'Спортсмен сохранён' : 'Спортсмен добавлен')
      resetForm()
      return true
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось сохранить спортсмена', {
        type: 'error',
      })
      return false
    } finally {
      isSubmitting.value = false
    }
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
    isSubmitting: false,
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
    if (documentUploadState.isSubmitting) {
      return
    }

    documentUploadState.isOpen = false
    documentUploadState.documentType = ''
    documentUploadState.fileName = ''
    documentUploadState.fileSize = 0
    documentUploadState.expiresAt = ''
    documentUploadState.isSubmitting = false
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

  async function handleDocumentUploadSubmit({ file, fileDataUrl = '', fileType = '', expiresAt }) {
    if (!documentUploadState.documentType || !file || documentUploadState.isSubmitting) {
      return
    }

    documentUploadState.isSubmitting = true

    upsertDocument(
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

    if (editingAthleteId.value) {
      const editedAthlete = getEditingAthlete()
      const nextDocument = form.documents.find(
        (document) => document.type === documentUploadState.documentType,
      )

      if (editedAthlete && nextDocument) {
        try {
          await persistSupabaseAthleteDocument(
            {
              ...editedAthlete,
              documents: form.documents,
            },
            nextDocument,
          )
          await syncAthleteDocumentsFromSource()
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Не удалось сохранить документ', {
            type: 'error',
          })
          documentUploadState.isSubmitting = false
          return
        }
      }
    } else {
      persistEditedAthleteDocuments()
    }

    documentUploadState.isSubmitting = false
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
        confirmButtonClass: 'account__table-action account__table-action--delete btn-reset',
        cancelButtonClass: 'account__table-action account__table-action--ghost btn-reset',
        type: 'warning',
        autofocus: false,
        closeOnClickModal: false,
        closeOnPressEscape: true,
      },
    )
      .then(async () => {
        upsertDocument(documentType, createAccountDocumentRemovalPatch())

        if (editingAthleteId.value) {
          const editedAthlete = getEditingAthlete()
          const nextDocument = form.documents.find((document) => document.type === documentType)

          if (editedAthlete && nextDocument) {
            try {
              await persistSupabaseAthleteDocument(
                {
                  ...editedAthlete,
                  documents: form.documents,
                },
                nextDocument,
              )
              await syncAthleteDocumentsFromSource()
            } catch (error) {
              showToast(error instanceof Error ? error.message : 'Не удалось удалить документ', {
                type: 'error',
              })
            }
          }

          return
        }
      })
      .catch(() => {})
  }

  watch(
    currentUser,
    () => {
      void syncAthletesFromSource({ showLoading: true })
      resetForm()
    },
    { immediate: true },
  )

  onMounted(() => {
    unsubscribeFromSupabaseDocuments = subscribeToAccountDocumentChanges((payload) => {
      if (isSubmitting.value) {
        return
      }

      if (!shouldHandleCurrentOwnerPayload(payload)) {
        return
      }

      scheduleAthleteDocumentsSync()
    })
    unsubscribeFromSupabaseAccountData = subscribeToAccountProfileAthleteChanges((payload) => {
      if (isSubmitting.value) {
        return
      }

      if (!shouldHandleCurrentOwnerPayload(payload)) {
        return
      }

      scheduleAthletesSync()
    })
    unsubscribeFromSupabaseAdmissionWorkflow = subscribeToAccountAdmissionWorkflowChanges((payload) => {
      if (isSubmitting.value) {
        return
      }

      if (!shouldHandleCurrentOwnerPayload(payload)) {
        return
      }

      scheduleAthletesSync()
    })
  })

  onBeforeUnmount(() => {
    cancelAthletesRefreshTimers()

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
    isSubmitting,
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
    isInitialAthletesLoading,
  }
}

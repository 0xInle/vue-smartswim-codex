import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { trainers } from '@/pages/trainers/trainersData'
import { ElMessageBox } from 'element-plus'
import { showToast } from '@/utils/toast'
import {
  createAccountDocumentsState,
  normalizeAccountDocumentsState,
} from '@/pages/account/utils/accountDocumentTypes'
import {
  mergeDocumentsWithReviewRecords,
  seedAccountDocumentReviewRecords,
  removeAccountDocumentReviewRecords,
  syncAccountDocumentReviewRecords,
} from '@/pages/account/utils/accountDocumentRegistry'
import { stripAccountDocumentFileData } from '@/pages/account/utils/accountLocalStorage'

const ATHLETES_STORAGE_KEY = 'smartswim:account-athletes:v1'

const GENDER_OPTIONS = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
]

export function useAccountAthletes({ currentUser }) {
  const athletes = ref([])
  const editingAthleteId = ref('')

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

  const storageKey = computed(() => {
    const userKey = currentUser.value?.id || currentUser.value?.email || 'anonymous'

    return `${ATHLETES_STORAGE_KEY}:${userKey}`
  })

  const anonymousStorageKey = computed(() => `${ATHLETES_STORAGE_KEY}:anonymous`)

  function resetErrors() {
    errors.fullName = ''
    errors.birthDate = ''
    errors.gender = ''
    errors.club = ''
    errors.coach = ''
  }

  function normalizeAthlete(rawAthlete) {
    return {
      id: rawAthlete?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fullName: rawAthlete?.fullName || '',
      birthDate: rawAthlete?.birthDate || '',
      gender: rawAthlete?.gender || '',
      club: rawAthlete?.club || '',
      rank: rawAthlete?.rank || '',
      coach: rawAthlete?.coach || '',
      documents: normalizeAccountDocumentsState(rawAthlete?.documents),
    }
  }

  function syncFromStorage() {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const ownSerializedAthletes = window.localStorage.getItem(storageKey.value)
      const fallbackSerializedAthletes =
        storageKey.value === anonymousStorageKey.value
          ? ''
          : window.localStorage.getItem(anonymousStorageKey.value)
      const serializedAthletes = ownSerializedAthletes || fallbackSerializedAthletes

      if (!serializedAthletes) {
        athletes.value = []
        return
      }

      const parsedAthletes = JSON.parse(serializedAthletes)
      const nextAthletes = Array.isArray(parsedAthletes) ? parsedAthletes.map(normalizeAthlete) : []

      nextAthletes.forEach((athlete) => {
        seedAccountDocumentReviewRecords({
          currentUser,
          ownerName: currentUser.value?.name || '',
          ownerEmail: currentUser.value?.email || '',
          ownerPhone: currentUser.value?.phone || '',
          scope: 'athlete',
          scopeId: athlete.id,
          participantName: athlete.fullName || '',
          participantBirthDate: athlete.birthDate || '',
          participantClub: athlete.club || '',
          participantKind: 'athlete',
          documents: athlete.documents || [],
        })
      })

      athletes.value = nextAthletes.map((athlete) => ({
        ...athlete,
        documents: mergeDocumentsWithReviewRecords({
          currentUser,
          scope: 'athlete',
          scopeId: athlete.id,
          documents: athlete.documents,
        }),
      }))

      if (!ownSerializedAthletes && fallbackSerializedAthletes) {
        persistAthletes()
      }
    } catch {
      athletes.value = []
    }
  }

  function persistAthletes() {
    if (typeof window === 'undefined') {
      return true
    }

    const storageAthletes = athletes.value.map((athlete) => ({
      ...athlete,
      documents: stripAccountDocumentFileData(athlete.documents),
    }))

    try {
      window.localStorage.setItem(storageKey.value, JSON.stringify(storageAthletes))
      return true
    } catch {
      showToast('Не удалось сохранить спортсменов. Проверьте размер загруженных файлов.', {
        type: 'error',
      })
      return false
    }
  }

  function syncAthleteDocumentReviews(athlete) {
    syncAccountDocumentReviewRecords({
      currentUser,
      ownerName: currentUser.value?.name || '',
      ownerEmail: currentUser.value?.email || '',
      ownerPhone: currentUser.value?.phone || '',
      scope: 'athlete',
      scopeId: athlete.id,
      participantName: athlete.fullName,
      participantBirthDate: athlete.birthDate,
      participantClub: athlete.club,
      participantKind: 'athlete',
      documents: athlete.documents,
    })
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

    syncAthleteDocumentReviews(nextAthlete)
    return persistAthletes()
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
      .then(() => {
        removeAccountDocumentReviewRecords({
          currentUser,
          scope: 'athlete',
          scopeId: athleteId,
        })

        athletes.value = athletes.value.filter((athlete) => athlete.id !== athleteId)
        persistAthletes()

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

  function handleSubmit() {
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

    if (editingAthleteId.value) {
      athletes.value = athletes.value.map((athlete) =>
        athlete.id === editingAthleteId.value ? payload : athlete,
      )
    } else {
      athletes.value = [payload, ...athletes.value]
    }

    syncAthleteDocumentReviews(payload)

    if (!persistAthletes()) {
      return false
    }

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
      })
      .catch(() => {})
  }

  watch(
    currentUser,
    () => {
      syncFromStorage()
      resetForm()
    },
    { immediate: true },
  )

  watch(storageKey, () => {
    syncFromStorage()
    resetForm()
  })

  function handleStorageChange(event) {
    const storageKeyValue = String(event?.key || '')

    if (!storageKeyValue.includes(ATHLETES_STORAGE_KEY) && !storageKeyValue.includes('account-document-reviews')) {
      return
    }

    syncFromStorage()
  }

  onMounted(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('storage', handleStorageChange)
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.removeEventListener('storage', handleStorageChange)
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

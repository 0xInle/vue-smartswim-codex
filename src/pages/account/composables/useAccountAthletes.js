import { computed, reactive, ref, watch } from 'vue'
import { trainers } from '@/pages/trainers/trainersData'
import { showToast } from '@/utils/toast'
import {
  createAccountDocumentsState,
  getAccountDocumentsStatusMeta,
  normalizeAccountDocumentsState,
} from '@/pages/account/utils/accountDocumentTypes'

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
      const serializedAthletes = window.localStorage.getItem(storageKey.value)

      if (!serializedAthletes) {
        athletes.value = []
        return
      }

      const parsedAthletes = JSON.parse(serializedAthletes)
      athletes.value = Array.isArray(parsedAthletes) ? parsedAthletes.map(normalizeAthlete) : []
    } catch {
      athletes.value = []
    }
  }

  function persistAthletes() {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(storageKey.value, JSON.stringify(athletes.value))
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
    athletes.value = athletes.value.filter((athlete) => athlete.id !== athleteId)
    persistAthletes()

    if (editingAthleteId.value === athleteId) {
      resetForm()
    }

    showToast('Спортсмен удалён')
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

    persistAthletes()
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

  const documentsStatus = computed(() => getAccountDocumentsStatusMeta(form.documents))
  const documentsStatusLabel = computed(() => documentsStatus.value.label)
  const documentsStatusTagType = computed(() => documentsStatus.value.tagType)

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

  function handleDocumentUploadSubmit({ file, expiresAt }) {
    if (!documentUploadState.documentType || !file) {
      return
    }

    upsertDocument(documentUploadState.documentType, {
      status: 'uploaded',
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      expiresAt: expiresAt || '',
      verifiedAt: '',
      verifiedBy: '',
    })

    closeDocumentUploadDialog()
  }

  function handleDocumentRemove(documentType) {
    upsertDocument(documentType, {
      status: 'missing',
      fileName: '',
      fileSize: 0,
      uploadedAt: '',
      expiresAt: '',
      verifiedAt: '',
      verifiedBy: '',
    })
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

  return {
    athletes,
    editingAthleteId,
    form,
    errors,
    genderOptions: GENDER_OPTIONS,
    coachPlaceholder,
    documentsStatusLabel,
    documentsStatusTagType,
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

<template>
  <ElCard class="account__panel account-profile" shadow="never">
    <div v-if="showSkeleton" class="account-profile__skeleton" aria-busy="true">
      <div class="account__field-grid">
        <article class="account-profile__skeleton-field account-profile__skeleton-field--wide">
          <span class="account-profile__skeleton-line account-profile__skeleton-line--label"></span>
          <span class="account-profile__skeleton-line account-profile__skeleton-line--input"></span>
        </article>

        <article class="account-profile__skeleton-field">
          <span class="account-profile__skeleton-line account-profile__skeleton-line--label"></span>
          <span class="account-profile__skeleton-line account-profile__skeleton-line--input"></span>
        </article>
      </div>

      <div class="account__field-grid">
        <article class="account-profile__skeleton-field">
          <span class="account-profile__skeleton-line account-profile__skeleton-line--label"></span>
          <span class="account-profile__skeleton-line account-profile__skeleton-line--input"></span>
        </article>

        <article class="account-profile__skeleton-field">
          <span class="account-profile__skeleton-line account-profile__skeleton-line--label"></span>
          <span class="account-profile__skeleton-line account-profile__skeleton-line--input"></span>
        </article>
      </div>

      <div class="account__field-grid">
        <article class="account-profile__skeleton-field account-profile__skeleton-field--wide">
          <span class="account-profile__skeleton-line account-profile__skeleton-line--label"></span>
          <span class="account-profile__skeleton-line account-profile__skeleton-line--input"></span>
        </article>
      </div>

      <section class="account-profile__skeleton-documents" aria-label="Документы">
        <div class="account-profile__skeleton-documents-head">
          <span class="account-profile__skeleton-line account-profile__skeleton-line--eyebrow"></span>
          <span class="account-profile__skeleton-line account-profile__skeleton-line--title"></span>
        </div>

        <div class="account-profile__skeleton-documents-list">
          <article
            v-for="index in 4"
            :key="`profile-document-skeleton-${index}`"
            class="account-profile__skeleton-document"
          >
            <span class="account-profile__skeleton-line account-profile__skeleton-line--document"></span>
            <span class="account-profile__skeleton-line account-profile__skeleton-line--meta"></span>
            <span class="account-profile__skeleton-line account-profile__skeleton-line--meta"></span>
          </article>
        </div>
      </section>

      <div class="account-profile__skeleton-actions">
        <span class="account-profile__skeleton-line account-profile__skeleton-line--button"></span>
      </div>
    </div>

    <form v-else class="account-profile__form" @submit.prevent="handleSubmit">
      <div class="account__field-grid">
        <label class="account__field account-profile__field--wide">
          <span class="account__field-label">ФИО</span>
          <input
            :value="profile.fullName"
            class="account__input"
            type="text"
            name="profile-full-name"
            placeholder="Введите ФИО"
            :aria-invalid="Boolean(errors.fullName)"
            @input="handleFullNameInput"
          />
          <span v-if="errors.fullName" class="account__field-error">{{ errors.fullName }}</span>
        </label>

        <label class="account__field">
          <span class="account__field-label">Дата рождения</span>
          <input
            :value="profile.birthDate"
            class="account__input"
            type="text"
            name="profile-birth-date"
            inputmode="numeric"
            placeholder="дд.мм.гггг"
            :aria-invalid="Boolean(errors.birthDate)"
            @input="handleBirthDateInput"
          />
          <span v-if="errors.birthDate" class="account__field-error">{{ errors.birthDate }}</span>
        </label>
      </div>

      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Клуб</span>
          <input
            v-model.trim="profile.club"
            class="account__input"
            type="text"
            name="profile-club"
            placeholder="Введите клуб"
            :aria-invalid="Boolean(errors.club)"
          />
          <span v-if="errors.club" class="account__field-error">{{ errors.club }}</span>
        </label>

        <label class="account__field">
          <span class="account__field-label">Телефон</span>
          <input
            :value="profile.phone"
            class="account__input"
            type="tel"
            name="profile-phone"
            inputmode="tel"
            placeholder="Введите телефон"
            :aria-invalid="Boolean(errors.phone)"
            @input="handlePhoneInput"
          />
          <span v-if="errors.phone" class="account__field-error">{{ errors.phone }}</span>
        </label>
      </div>

      <div class="account__field-grid">
        <label class="account__field account-profile__field--wide">
          <span class="account__field-label">Email</span>
          <input
            v-model.trim="profile.email"
            class="account__input"
            type="email"
            name="profile-email"
            placeholder="Введите email"
            :aria-invalid="Boolean(errors.email)"
          />
          <span v-if="errors.email" class="account__field-error">{{ errors.email }}</span>
        </label>
      </div>

      <AccountDocumentChecklist
        :documents="profile.documents"
        :show-header="false"
        embedded
        @upload="openUploadDialog"
        @remove="handleDocumentRemove"
      />

      <div class="account-profile__actions">
        <button
          type="submit"
          class="account__table-action account__table-action--edit account-profile__submit btn-reset"
          :disabled="isProfileSaving"
          :aria-busy="isProfileSaving"
        >
          <span v-if="isProfileSaving" class="account__button-spinner" aria-hidden="true"></span>
          <span :class="{ 'account__button-label--loading': isProfileSaving }">Сохранить</span>
        </button>
      </div>
    </form>

    <AccountDocumentUploadDialog
      :model-value="uploadDialogState.isOpen"
      :document-type="uploadDialogState.documentType"
      :initial-expires-at="uploadDialogState.expiresAt"
      :is-submitting="isDocumentUploadSubmitting"
      @close="closeUploadDialog"
      @submit="handleUploadSubmit"
    />
  </ElCard>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, toRef, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { ElCard } from 'element-plus'
import { formatRussianPhoneInput, isRussianPhone } from '@/utils/phone'
import { normalizeDateInput } from '@/utils/dateInput'
import { sanitizeDateFieldInput, sanitizePersonNameInput } from '@/utils/inputSanitizers'
import { showToast } from '@/utils/toast'
import AccountDocumentChecklist from '@/pages/account/components/documents/AccountDocumentChecklist.vue'
import AccountDocumentUploadDialog from '@/pages/account/components/documents/AccountDocumentUploadDialog.vue'
import {
  createAccountDocumentRemovalPatch,
  createAccountDocumentUploadPatch,
  createAccountDocumentsState,
  normalizeAccountDocumentsState,
} from '@/pages/account/utils/accountDocumentTypes'
import { syncCompetitionRegistrationOwnerSnapshotFromSource } from '@/pages/account/utils/accountCompetitionRegistrations'
import {
  loadAccountDocumentsForCurrentUser,
  saveAccountDocumentForCurrentUser,
  subscribeToAccountDocumentChanges,
} from '@/domains/account-documents/documentRepository'
import {
  loadAccountProfileForCurrentUser,
  saveAccountProfileForCurrentUser,
  subscribeToAccountProfileAthleteChanges,
} from '@/domains/account-data/accountDataRepository'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
})

const currentUserRef = toRef(props, 'currentUser')
const PROFILE_REFRESH_DEBOUNCE_MS = 300

const profile = reactive({
  fullName: '',
  birthDate: '',
  club: '',
  phone: '',
  email: '',
  documents: createAccountDocumentsState(),
})

const errors = reactive({
  fullName: '',
  birthDate: '',
  club: '',
  phone: '',
  email: '',
})

const uploadDialogState = reactive({
  isOpen: false,
  documentType: '',
  fileName: '',
  fileSize: 0,
  expiresAt: '',
})
const isDocumentUploadSubmitting = ref(false)
const isProfileSaving = ref(false)
const isInitialProfileLoading = ref(true)
let unsubscribeFromSupabaseDocuments = null
let unsubscribeFromSupabaseAccountData = null
let profileDocumentsRefreshTimer = null
let profileRefreshTimer = null

const showSkeleton = computed(() => isInitialProfileLoading.value)

function resetErrors() {
  errors.fullName = ''
  errors.birthDate = ''
  errors.club = ''
  errors.phone = ''
  errors.email = ''
}

function getCurrentOwnerId() {
  return currentUserRef.value?.id || ''
}

function getRealtimePayloadOwnerId(payload) {
  return payload?.new?.owner_user_id || payload?.old?.owner_user_id || ''
}

function shouldHandleCurrentOwnerPayload(payload) {
  const ownerId = getRealtimePayloadOwnerId(payload)

  return !ownerId || ownerId === getCurrentOwnerId()
}

function scheduleProfileDocumentsSync() {
  if (profileDocumentsRefreshTimer) {
    return
  }

  profileDocumentsRefreshTimer = window.setTimeout(() => {
    profileDocumentsRefreshTimer = null
    void syncProfileDocumentsFromSource()
  }, PROFILE_REFRESH_DEBOUNCE_MS)
}

function scheduleProfileSync() {
  if (profileRefreshTimer) {
    return
  }

  profileRefreshTimer = window.setTimeout(() => {
    profileRefreshTimer = null
    void syncProfileFromSource()
  }, PROFILE_REFRESH_DEBOUNCE_MS)
}

function cancelProfileRefreshTimers() {
  if (profileDocumentsRefreshTimer) {
    clearTimeout(profileDocumentsRefreshTimer)
    profileDocumentsRefreshTimer = null
  }

  if (profileRefreshTimer) {
    clearTimeout(profileRefreshTimer)
    profileRefreshTimer = null
  }
}

async function syncProfileDocumentsFromSource() {
  try {
    const sourceDocuments = await loadAccountDocumentsForCurrentUser({
      scope: 'profile',
      scopeId: 'profile',
    })

    profile.documents = normalizeAccountDocumentsState(sourceDocuments)
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : 'Не удалось загрузить документы из Supabase',
      { type: 'error' },
    )
    profile.documents = createAccountDocumentsState()
  }
}

async function syncProfileFromSource({ showLoading = false } = {}) {
  if (showLoading) {
    isInitialProfileLoading.value = true
  }

  try {
    const snapshot = await loadAccountProfileForCurrentUser({ currentUser: currentUserRef })

    profile.fullName = snapshot.fullName || props.currentUser?.name || ''
    profile.birthDate = snapshot.birthDate || ''
    profile.club = snapshot.club || ''
    profile.phone = snapshot.phone || props.currentUser?.phone || ''
    profile.email = snapshot.email || props.currentUser?.email || ''
    await syncProfileDocumentsFromSource()
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Не удалось загрузить профиль', {
      type: 'error',
    })

    profile.fullName = props.currentUser?.name || ''
    profile.birthDate = ''
    profile.club = ''
    profile.phone = props.currentUser?.phone || ''
    profile.email = props.currentUser?.email || ''
    profile.documents = createAccountDocumentsState()
  } finally {
    if (showLoading) {
      isInitialProfileLoading.value = false
    }
  }
}

function validateProfile() {
  resetErrors()
  const birthDatePattern = /^\d{2}\.\d{2}\.\d{4}$/
  const normalizedBirthDate = normalizeDateInput(profile.birthDate)

  if (!profile.fullName) {
    errors.fullName = 'Укажите ФИО.'
  }

  if (!normalizedBirthDate) {
    errors.birthDate = 'Укажите дату рождения.'
  } else if (!birthDatePattern.test(normalizedBirthDate)) {
    errors.birthDate = 'Введите дату в формате дд.мм.гггг.'
  }

  if (!profile.club) {
    errors.club = 'Укажите клуб.'
  }

  if (!profile.phone) {
    errors.phone = 'Укажите телефон.'
  } else if (!isRussianPhone(profile.phone)) {
    errors.phone = 'Укажите российский телефон из 11 цифр, например 89604709999.'
  }

  if (!profile.email) {
    errors.email = 'Укажите email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    errors.email = 'Укажите корректный email.'
  }

  return !Object.values(errors).some(Boolean)
}

function handleFullNameInput(event) {
  profile.fullName = sanitizePersonNameInput(event.target.value)
  errors.fullName = ''
}

function handleBirthDateInput(event) {
  profile.birthDate = sanitizeDateFieldInput(event.target.value)
  errors.birthDate = ''
}

function handlePhoneInput(event) {
  profile.phone = formatRussianPhoneInput(event.target.value)
  errors.phone = ''
}

function openUploadDialog(documentType) {
  const target = profile.documents.find((document) => document.type === documentType)

  if (!target) {
    return
  }

  uploadDialogState.isOpen = true
  uploadDialogState.documentType = documentType
  uploadDialogState.fileName = target.fileName || ''
  uploadDialogState.fileSize = target.fileSize || 0
  uploadDialogState.expiresAt = target.expiresAt || ''
}

function closeUploadDialog() {
  if (isDocumentUploadSubmitting.value) {
    return
  }

  uploadDialogState.isOpen = false
  uploadDialogState.documentType = ''
  uploadDialogState.fileName = ''
  uploadDialogState.fileSize = 0
  uploadDialogState.expiresAt = ''
}

function upsertDocument(documentType, patch) {
  const hasDocument = profile.documents.some((document) => document.type === documentType)

  if (!hasDocument) {
    return
  }

  profile.documents = profile.documents.map((document) =>
    document.type === documentType
      ? {
          ...document,
          ...patch,
        }
      : document,
  )
}

async function persistProfileDocument(document) {
  return saveAccountDocumentForCurrentUser({
    currentUser: currentUserRef,
    scope: 'profile',
    scopeId: 'profile',
    document: {
      ...document,
      ownerName: profile.fullName,
      ownerEmail: profile.email,
      ownerPhone: profile.phone,
      participantKind: 'owner',
      participantId: 'profile',
      participantName: profile.fullName,
      participantBirthDate: profile.birthDate,
      participantClub: profile.club,
    },
  })
}

async function handleUploadSubmit(payload) {
  if (!uploadDialogState.documentType || !payload.file || isDocumentUploadSubmitting.value) {
    return
  }

  isDocumentUploadSubmitting.value = true

  upsertDocument(
    uploadDialogState.documentType,
    createAccountDocumentUploadPatch({
      fileName: payload.file.name,
      fileSize: payload.file.size,
      file: payload.file,
      fileDataUrl: payload.fileDataUrl || '',
      fileType: payload.fileType || '',
      expiresAt: payload.expiresAt || '',
    }),
  )

  const nextDocument = profile.documents.find(
    (document) => document.type === uploadDialogState.documentType,
  )

  try {
    await persistProfileDocument(nextDocument)
    await syncProfileDocumentsFromSource()
    showToast('Документ загружен и отправлен на проверку')
    isDocumentUploadSubmitting.value = false
    closeUploadDialog()
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Не удалось сохранить документ', {
      type: 'error',
    })
  } finally {
    if (isDocumentUploadSubmitting.value) {
      isDocumentUploadSubmitting.value = false
    }
  }
}

function handleDocumentRemove(documentType) {
  const targetDocument = profile.documents.find((document) => document.type === documentType)

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

      const nextDocument = profile.documents.find((document) => document.type === documentType)

      try {
        await persistProfileDocument(nextDocument)
        await syncProfileDocumentsFromSource()
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Не удалось удалить документ', {
          type: 'error',
        })
      }
    })
    .catch(() => {})
}

async function handleSubmit() {
  if (isProfileSaving.value) {
    return
  }

  if (!validateProfile()) {
    return
  }

  isProfileSaving.value = true
  const normalizedBirthDate = normalizeDateInput(profile.birthDate)

  try {
    const savedProfile = await saveAccountProfileForCurrentUser({
      currentUser: currentUserRef,
      profile: {
        ...profile,
        birthDate: normalizedBirthDate,
      },
    })

    profile.fullName = savedProfile.fullName
    profile.birthDate = savedProfile.birthDate
    profile.club = savedProfile.club
    profile.phone = savedProfile.phone
    profile.email = savedProfile.email
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Не удалось сохранить профиль', {
      type: 'error',
    })
    return
  } finally {
    isProfileSaving.value = false
  }

  void syncCompetitionRegistrationOwnerSnapshotFromSource(currentUserRef, profile)
  showToast('Профиль сохранён')
}

watch(
  () => props.currentUser,
  () => {
    void syncProfileFromSource({ showLoading: true })
  },
  { immediate: true },
)

watch(
  () => [profile.fullName, profile.birthDate, profile.club, profile.phone, profile.email],
  () => {
    if (isProfileSaving.value) {
      return
    }

    const loadedDocuments = profile.documents.filter((document) => document.status !== 'missing')

    loadedDocuments.forEach((document) => {
      void persistProfileDocument(document)
    })
  },
)

onMounted(() => {
  unsubscribeFromSupabaseDocuments = subscribeToAccountDocumentChanges((payload) => {
    if (isDocumentUploadSubmitting.value) {
      return
    }

    if (!shouldHandleCurrentOwnerPayload(payload)) {
      return
    }

    scheduleProfileDocumentsSync()
  })
  unsubscribeFromSupabaseAccountData = subscribeToAccountProfileAthleteChanges((payload) => {
    if (!shouldHandleCurrentOwnerPayload(payload)) {
      return
    }

    scheduleProfileSync()
  })
})

onBeforeUnmount(() => {
  cancelProfileRefreshTimers()

  if (unsubscribeFromSupabaseDocuments) {
    unsubscribeFromSupabaseDocuments()
    unsubscribeFromSupabaseDocuments = null
  }

  if (unsubscribeFromSupabaseAccountData) {
    unsubscribeFromSupabaseAccountData()
    unsubscribeFromSupabaseAccountData = null
  }
})
</script>

<style scoped>
.account-profile__skeleton {
  display: grid;
  gap: 16px;
}

.account-profile__skeleton-field {
  display: grid;
  gap: 8px;
}

.account-profile__skeleton-field--wide {
  grid-column: 1 / -1;
}

.account-profile__skeleton-documents {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: linear-gradient(180deg, rgb(246 251 255 / 0.94) 0%, rgb(255 255 255 / 0.82) 100%);
}

.account-profile__skeleton-documents-head {
  display: grid;
  gap: 8px;
}

.account-profile__skeleton-documents-list {
  display: grid;
  gap: 12px;
}

.account-profile__skeleton-document {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.88);
}

.account-profile__skeleton-actions {
  display: flex;
  justify-content: flex-start;
}

.account-profile__skeleton-line {
  position: relative;
  overflow: hidden;
  display: block;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cyan) 12%, white);
}

.account-profile__skeleton-line::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.74), transparent);
  animation: account-profile-skeleton-shimmer 1.2s ease-in-out infinite;
}

.account-profile__skeleton-line--label {
  width: 110px;
  height: 12px;
}

.account-profile__skeleton-line--input {
  width: 100%;
  height: 38px;
}

.account-profile__skeleton-line--eyebrow {
  width: 78px;
  height: 10px;
}

.account-profile__skeleton-line--title {
  width: min(260px, 78%);
  height: 18px;
}

.account-profile__skeleton-line--document {
  width: min(220px, 82%);
  height: 16px;
}

.account-profile__skeleton-line--meta {
  width: min(160px, 70%);
  height: 10px;
}

.account-profile__skeleton-line--button {
  width: 176px;
  height: 38px;
}

.account-profile__form {
  display: grid;
  gap: 16px;
}

.account-profile__field--wide {
  grid-column: 1 / -1;
}

.account-profile__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
}

.account-profile__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

@media (max-width: 640px) {
  .account-profile__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}

@keyframes account-profile-skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>

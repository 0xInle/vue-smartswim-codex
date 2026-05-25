<template>
  <ElCard class="account__panel account-profile" shadow="never">
    <form class="account-profile__form" @submit.prevent="handleSubmit">
      <div class="account__field-grid">
        <label class="account__field account-profile__field--wide">
          <span class="account__field-label">ФИО</span>
          <input
            v-model.trim="profile.fullName"
            class="account__input"
            type="text"
            name="profile-full-name"
            placeholder="Введите ФИО"
            :aria-invalid="Boolean(errors.fullName)"
          />
          <span v-if="errors.fullName" class="account__field-error">{{ errors.fullName }}</span>
        </label>

        <label class="account__field">
          <span class="account__field-label">Дата рождения</span>
          <input
            v-model.trim="profile.birthDate"
            class="account__input"
            type="text"
            name="profile-birth-date"
            inputmode="numeric"
            placeholder="дд.мм.гггг"
            :aria-invalid="Boolean(errors.birthDate)"
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
        <button type="submit" class="account__submit btn-reset">Сохранить</button>
      </div>
    </form>

    <AccountDocumentUploadDialog
      :model-value="uploadDialogState.isOpen"
      :document-type="uploadDialogState.documentType"
      @close="closeUploadDialog"
      @submit="handleUploadSubmit"
    />
  </ElCard>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, toRef, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { ElCard } from 'element-plus'
import { formatRussianPhoneInput, isRussianPhone } from '@/utils/phone'
import { showToast } from '@/utils/toast'
import AccountDocumentChecklist from '@/pages/account/components/documents/AccountDocumentChecklist.vue'
import AccountDocumentUploadDialog from '@/pages/account/components/documents/AccountDocumentUploadDialog.vue'
import {
  createAccountDocumentRemovalPatch,
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
let unsubscribeFromSupabaseDocuments = null
let unsubscribeFromSupabaseAccountData = null

function resetErrors() {
  errors.fullName = ''
  errors.birthDate = ''
  errors.club = ''
  errors.phone = ''
  errors.email = ''
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

async function syncProfileFromSource() {
  try {
    const snapshot = await loadAccountProfileForCurrentUser({ currentUser: currentUserRef })

    profile.fullName = snapshot.fullName || props.currentUser?.name || ''
    profile.birthDate = snapshot.birthDate || ''
    profile.club = snapshot.club || ''
    profile.phone = snapshot.phone || props.currentUser?.phone || ''
    profile.email = snapshot.email || props.currentUser?.email || ''
    profile.documents = createAccountDocumentsState()
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
  }
}

function validateProfile() {
  resetErrors()
  const birthDatePattern = /^\d{2}\.\d{2}\.\d{4}$/

  if (!profile.fullName) {
    errors.fullName = 'Укажите ФИО.'
  }

  if (!profile.birthDate) {
    errors.birthDate = 'Укажите дату рождения.'
  } else if (!birthDatePattern.test(profile.birthDate)) {
    errors.birthDate = 'Введите дату в формате дд.мм.гггг.'
  }

  if (!profile.club) {
    errors.club = 'Укажите клуб.'
  }

  if (!profile.phone) {
    errors.phone = 'Укажите телефон.'
  } else if (!isRussianPhone(profile.phone)) {
    errors.phone = 'Укажите номер в формате +7 (961) 471-33-80.'
  }

  if (!profile.email) {
    errors.email = 'Укажите email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    errors.email = 'Укажите корректный email.'
  }

  return !Object.values(errors).some(Boolean)
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
  if (!uploadDialogState.documentType || !payload.file) {
    return
  }

  upsertDocument(uploadDialogState.documentType, {
    status: 'uploaded',
    fileName: payload.file.name,
    fileSize: payload.file.size,
    fileDataUrl: payload.fileDataUrl || '',
    fileType: payload.fileType || '',
    uploadedAt: new Date().toISOString(),
    expiresAt: payload.expiresAt || '',
    verifiedAt: '',
    verifiedBy: '',
    rejectionReason: '',
  })

  const nextDocument = profile.documents.find(
    (document) => document.type === uploadDialogState.documentType,
  )

  try {
    await persistProfileDocument(nextDocument)
    await syncProfileDocumentsFromSource()
    showToast('Документ загружен и отправлен на проверку')
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Не удалось сохранить документ', {
      type: 'error',
    })
  }

  closeUploadDialog()
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
      confirmButtonClass: 'account__submit btn-reset',
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
  if (!validateProfile()) {
    return
  }

  try {
    const savedProfile = await saveAccountProfileForCurrentUser({
      currentUser: currentUserRef,
      profile,
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
  }

  void syncCompetitionRegistrationOwnerSnapshotFromSource(currentUserRef, profile)
  showToast('Профиль сохранён')
}

watch(
  () => props.currentUser,
  () => {
    void syncProfileFromSource()
  },
  { immediate: true },
)

watch(
  () => [profile.fullName, profile.birthDate, profile.club, profile.phone, profile.email],
  () => {
    const loadedDocuments = profile.documents.filter((document) => document.status !== 'missing')

    loadedDocuments.forEach((document) => {
      void persistProfileDocument(document)
    })
  },
)

onMounted(() => {
  unsubscribeFromSupabaseDocuments = subscribeToAccountDocumentChanges(() => {
    void syncProfileDocumentsFromSource()
  })
  unsubscribeFromSupabaseAccountData = subscribeToAccountProfileAthleteChanges(() => {
    void syncProfileFromSource()
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
})
</script>

<style scoped>
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

@media (max-width: 640px) {
  .account-profile__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>

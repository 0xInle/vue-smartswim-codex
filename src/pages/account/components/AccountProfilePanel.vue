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
      :documents="documents"
      :show-header="false"
      embedded
      @upload="openUploadDialog"
      @remove="handleDocumentRemove"
    />

      <div class="account-profile__actions">
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset"
          @click="resetProfile"
        >
          Сбросить
        </button>
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
import { computed, reactive, toRef, watch } from 'vue'
import { ElCard } from 'element-plus'
import { formatRussianPhoneInput, isRussianPhone } from '@/utils/phone'
import { showToast } from '@/utils/toast'
import AccountDocumentChecklist from '@/pages/account/components/AccountDocumentChecklist.vue'
import AccountDocumentUploadDialog from '@/pages/account/components/AccountDocumentUploadDialog.vue'
import { useAccountDocuments } from '@/pages/account/composables/useAccountDocuments'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
})

const profile = reactive({
  fullName: '',
  birthDate: '',
  club: '',
  phone: '',
  email: '',
})

const errors = reactive({
  fullName: '',
  birthDate: '',
  club: '',
  phone: '',
  email: '',
})

const {
  documents,
  uploadDialogState,
  openUploadDialog,
  closeUploadDialog,
  handleUploadSubmit,
  handleDocumentRemove,
} = useAccountDocuments({
  currentUser: toRef(props, 'currentUser'),
  scope: 'profile',
  scopeId: computed(() => 'profile'),
})

const profileStorageKey = computed(() => {
  const userKey = props.currentUser?.id || props.currentUser?.email || 'anonymous'
  return `smartswim:account-profile:v2:${userKey}`
})

function resetErrors() {
  errors.fullName = ''
  errors.birthDate = ''
  errors.club = ''
  errors.phone = ''
  errors.email = ''
}

function syncFromStorage() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const serializedProfile = window.localStorage.getItem(profileStorageKey.value)

    if (!serializedProfile) {
      return
    }

    const parsedProfile = JSON.parse(serializedProfile)

    if (parsedProfile && typeof parsedProfile === 'object') {
      profile.fullName = parsedProfile.fullName || ''
      profile.birthDate = parsedProfile.birthDate || ''
      profile.club = parsedProfile.club || ''
      profile.phone = parsedProfile.phone || ''
      profile.email = parsedProfile.email || ''
    }
  } catch {
    // Ignore broken storage data and keep the current form state.
  }
}

function syncFromUser() {
  profile.fullName = props.currentUser?.name || profile.fullName
  profile.email = props.currentUser?.email || profile.email
  profile.phone = props.currentUser?.phone || profile.phone
}

function persistProfile() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    profileStorageKey.value,
    JSON.stringify({
      fullName: profile.fullName,
      birthDate: profile.birthDate,
      club: profile.club,
      phone: profile.phone,
      email: profile.email,
    }),
  )
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

function resetProfile() {
  syncFromStorage()
  syncFromUser()
  resetErrors()
}

function handleSubmit() {
  if (!validateProfile()) {
    return
  }

  persistProfile()
  showToast('Профиль сохранён')
}

watch(
  () => props.currentUser,
  () => {
    syncFromStorage()
    syncFromUser()
  },
  { immediate: true },
)

watch(profileStorageKey, () => {
  syncFromStorage()
  syncFromUser()
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
}

@media (max-width: 640px) {
  .account-profile__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>

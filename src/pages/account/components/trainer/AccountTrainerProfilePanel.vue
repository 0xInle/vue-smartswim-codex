<template>
  <ElCard class="account__panel account-trainer-profile" shadow="never">
    <div v-if="showSkeleton" class="account-trainer-profile__skeleton" aria-busy="true">
      <div v-for="index in 6" :key="`trainer-profile-skeleton-${index}`" class="account__field-grid">
        <div class="account__field">
          <span class="account-trainer-profile__skeleton-line account-trainer-profile__skeleton-line--label"></span>
          <span class="account-trainer-profile__skeleton-line account-trainer-profile__skeleton-line--input"></span>
        </div>

        <div class="account__field">
          <span class="account-trainer-profile__skeleton-line account-trainer-profile__skeleton-line--label"></span>
          <span class="account-trainer-profile__skeleton-line account-trainer-profile__skeleton-line--input"></span>
        </div>
      </div>

      <span class="account-trainer-profile__skeleton-line account-trainer-profile__skeleton-line--button"></span>
    </div>

    <form v-else class="account-trainer-profile__form" @submit.prevent="handleSubmit">
      <div class="account__field-grid">
        <label class="account__field account-trainer-profile__field--wide">
          <span class="account__field-label">ФИО</span>
          <input
            :value="profile.fullName"
            class="account__input"
            type="text"
            name="trainer-full-name"
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
            name="trainer-birth-date"
            inputmode="numeric"
            maxlength="10"
            placeholder="дд.мм.гггг"
            :aria-invalid="Boolean(errors.birthDate)"
            @input="handleBirthDateInput"
          />
          <span v-if="errors.birthDate" class="account__field-error">{{ errors.birthDate }}</span>
        </label>
      </div>

      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Телефон</span>
          <input
            :value="profile.phone"
            class="account__input"
            type="tel"
            name="trainer-phone"
            inputmode="tel"
            maxlength="18"
            placeholder="Введите телефон"
            :aria-invalid="Boolean(errors.phone)"
            @input="handlePhoneInput"
          />
          <span v-if="errors.phone" class="account__field-error">{{ errors.phone }}</span>
        </label>

        <label class="account__field">
          <span class="account__field-label">Email</span>
          <input
            :value="profile.email"
            class="account__input"
            type="email"
            name="trainer-email"
            placeholder="Введите email"
            :aria-invalid="Boolean(errors.email)"
            @input="updateTextField('email', $event.target.value, { trim: true })"
          />
          <span v-if="errors.email" class="account__field-error">{{ errors.email }}</span>
        </label>
      </div>

      <div class="account__field-grid">
        <label class="account__field account-trainer-profile__field--wide">
          <span class="account__field-label">Опыт работы</span>
          <input
            :value="profile.experience"
            class="account__input"
            type="text"
            name="trainer-experience"
            placeholder="Опишите опыт работы"
            @input="updateTextField('experience', $event.target.value, { trim: true })"
          />
        </label>

        <label class="account__field account-trainer-profile__field--wide">
          <span class="account__field-label">Основной профиль</span>
          <input
            :value="profile.mainProfile"
            class="account__input"
            type="text"
            name="trainer-main-profile"
            placeholder="Направление работы"
            @input="updateTextField('mainProfile', $event.target.value, { trim: true })"
          />
        </label>
      </div>

      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Свободно мест</span>
          <input
            :value="profile.availableSeats"
            class="account__input"
            type="text"
            name="trainer-available-seats"
            inputmode="numeric"
            placeholder="0"
            @input="handleNumericInput('availableSeats', $event.target.value, 2)"
          />
        </label>

        <label class="account__field account-trainer-profile__field--wide">
          <span class="account__field-label">Образование</span>
          <input
            :value="profile.education"
            class="account__input"
            type="text"
            name="trainer-education"
            placeholder="Профильное образование"
            @input="updateTextField('education', $event.target.value, { trim: true })"
          />
        </label>
      </div>

      <div class="account__field-grid">
        <label class="account__field account-trainer-profile__field--wide">
          <span class="account__field-label">Спортивные достижения</span>
          <input
            :value="profile.sportAchievements"
            class="account__input"
            type="text"
            name="trainer-sport-achievements"
            placeholder="Звания, разряды, результаты"
            @input="updateTextField('sportAchievements', $event.target.value, { trim: true })"
          />
        </label>

        <label class="account__field account-trainer-profile__field--wide">
          <span class="account__field-label">С кем работает</span>
          <input
            :value="profile.worksWith"
            class="account__input"
            type="text"
            name="trainer-works-with"
            placeholder="Дети, взрослые, спортсмены"
            @input="updateTextField('worksWith', $event.target.value, { trim: true })"
          />
        </label>
      </div>

      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Минимальный возраст</span>
          <input
            :value="profile.minAge"
            class="account__input"
            type="text"
            name="trainer-min-age"
            inputmode="numeric"
            placeholder="0"
            @input="handleNumericInput('minAge', $event.target.value, 2)"
          />
        </label>

        <label class="account__field">
          <span class="account__field-label">Уровень подготовки</span>
          <input
            :value="profile.preparationLevel"
            class="account__input"
            type="text"
            name="trainer-preparation-level"
            placeholder="Начальный, средний, продвинутый"
            @input="updateTextField('preparationLevel', $event.target.value, { trim: true })"
          />
        </label>
      </div>

      <div class="account__field-grid">
        <label class="account__field account-trainer-profile__field--wide">
          <span class="account__field-label">Метро</span>
          <input
            :value="profile.metro"
            class="account__input"
            type="text"
            name="trainer-metro"
            placeholder="Ближайшая станция метро"
            @input="updateTextField('metro', $event.target.value, { trim: true })"
          />
        </label>
      </div>

      <div class="account-trainer-profile__actions">
        <button
          type="submit"
          class="account__table-action account__table-action--edit btn-reset account-trainer-profile__submit"
          :disabled="isSaving"
          :aria-busy="isSaving"
        >
          <span v-if="isSaving" class="account__button-spinner" aria-hidden="true"></span>
          <span v-else>Сохранить</span>
        </button>
      </div>
    </form>
  </ElCard>
</template>

<script setup>
import { computed, reactive, ref, toRef, watch } from 'vue'
import { ElCard } from 'element-plus'
import { formatRussianPhoneInput, isRussianPhone } from '@/utils/phone'
import { normalizeDateInput } from '@/utils/dateInput'
import { sanitizeDateFieldInput, sanitizePersonNameInput } from '@/utils/inputSanitizers'
import { showToast } from '@/utils/toast'
import {
  loadAccountProfileForCurrentUser,
  saveAccountProfileForCurrentUser,
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
  phone: '',
  email: '',
  experience: '',
  mainProfile: '',
  availableSeats: '',
  education: '',
  sportAchievements: '',
  worksWith: '',
  minAge: '',
  preparationLevel: '',
  metro: '',
})

const errors = reactive({
  fullName: '',
  birthDate: '',
  phone: '',
  email: '',
})

const isSaving = ref(false)
const isProfileLoading = ref(false)
const hasLoadedProfile = ref(false)
let profileLoadRequestId = 0
const showSkeleton = computed(() => isProfileLoading.value && !hasLoadedProfile.value)

function resetErrors() {
  errors.fullName = ''
  errors.birthDate = ''
  errors.phone = ''
  errors.email = ''
}

async function syncFromSource() {
  const requestId = profileLoadRequestId + 1
  profileLoadRequestId = requestId
  isProfileLoading.value = true

  try {
    const snapshot = await loadAccountProfileForCurrentUser({ currentUser: currentUserRef })

    if (requestId !== profileLoadRequestId) {
      return
    }

    profile.fullName = snapshot.fullName || props.currentUser?.name || ''
    profile.birthDate = snapshot.birthDate || ''
    profile.phone = snapshot.phone || props.currentUser?.phone || ''
    profile.email = snapshot.email || props.currentUser?.email || ''
    profile.experience = snapshot.experience || ''
    profile.mainProfile = snapshot.mainProfile || ''
    profile.availableSeats = snapshot.availableSeats || ''
    profile.education = snapshot.education || ''
    profile.sportAchievements = snapshot.sportAchievements || ''
    profile.worksWith = snapshot.worksWith || ''
    profile.minAge = snapshot.minAge || ''
    profile.preparationLevel = snapshot.preparationLevel || ''
    profile.metro = snapshot.metro || ''
  } catch (error) {
    if (requestId !== profileLoadRequestId) {
      return
    }

    showToast(error instanceof Error ? error.message : 'Не удалось загрузить профиль тренера.', {
      type: 'error',
    })

    profile.fullName = props.currentUser?.name || ''
    profile.birthDate = ''
    profile.phone = props.currentUser?.phone || ''
    profile.email = props.currentUser?.email || ''
    profile.experience = ''
    profile.mainProfile = ''
    profile.availableSeats = ''
    profile.education = ''
    profile.sportAchievements = ''
    profile.worksWith = ''
    profile.minAge = ''
    profile.preparationLevel = ''
    profile.metro = ''
  } finally {
    if (requestId === profileLoadRequestId) {
      isProfileLoading.value = false
      hasLoadedProfile.value = true
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

function updateTextField(field, value, { trim = false } = {}) {
  profile[field] = trim ? String(value || '').trim() : String(value || '')
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

function handleNumericInput(field, value, maxDigits = 3) {
  profile[field] = String(value || '')
    .replace(/\D/g, '')
    .slice(0, maxDigits)
}

async function handleSubmit() {
  if (!validateProfile() || isSaving.value) {
    return
  }

  isSaving.value = true
  const normalizedBirthDate = normalizeDateInput(profile.birthDate)

  try {
    await saveAccountProfileForCurrentUser({
      currentUser: currentUserRef,
      profile: {
        ...profile,
        birthDate: normalizedBirthDate,
      },
    })
    profile.birthDate = normalizedBirthDate
    showToast('Профиль тренера сохранён')
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Не удалось сохранить профиль тренера.', {
      type: 'error',
    })
  } finally {
    isSaving.value = false
  }
}

watch(
  () => props.currentUser,
  () => {
    void syncFromSource()
  },
  { immediate: true },
)
</script>

<style scoped>
.account-trainer-profile__form {
  display: grid;
  gap: 16px;
}

.account-trainer-profile__skeleton {
  display: grid;
  gap: 16px;
}

.account-trainer-profile__skeleton-line {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 10px;
  background: color-mix(in srgb, var(--light-blue) 36%, white);
}

.account-trainer-profile__skeleton-line::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.72), transparent);
  animation: account-trainer-profile-skeleton 1.2s ease-in-out infinite;
}

.account-trainer-profile__skeleton-line--label {
  width: 96px;
  height: 13px;
  margin-bottom: 8px;
}

.account-trainer-profile__skeleton-line--input {
  width: 100%;
  height: 42px;
}

.account-trainer-profile__skeleton-line--button {
  width: 160px;
  height: 40px;
}

.account-trainer-profile__field--wide {
  grid-column: 1 / -1;
}

.account-trainer-profile__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
}

.account-trainer-profile__submit {
  justify-self: start;
  width: auto;
  min-width: 160px;
}

@media (max-width: 640px) {
  .account-trainer-profile__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .account-trainer-profile__submit {
    width: 100%;
  }
}

@keyframes account-trainer-profile-skeleton {
  100% {
    transform: translateX(100%);
  }
}
</style>

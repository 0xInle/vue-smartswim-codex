<template>
  <ElCard class="account__panel account-trainer-profile" shadow="never">
    <form class="account-trainer-profile__form" @submit.prevent="handleSubmit">
      <div class="account__field-grid">
        <label class="account__field account-trainer-profile__field--wide">
          <span class="account__field-label">ФИО</span>
          <input
            v-model.trim="profile.fullName"
            class="account__input"
            type="text"
            name="trainer-full-name"
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
            name="trainer-birth-date"
            inputmode="numeric"
            placeholder="дд.мм.гггг"
            :aria-invalid="Boolean(errors.birthDate)"
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
            placeholder="Введите телефон"
            :aria-invalid="Boolean(errors.phone)"
            @input="handlePhoneInput"
          />
          <span v-if="errors.phone" class="account__field-error">{{ errors.phone }}</span>
        </label>

        <label class="account__field">
          <span class="account__field-label">Email</span>
          <input
            v-model.trim="profile.email"
            class="account__input"
            type="email"
            name="trainer-email"
            placeholder="Введите email"
            :aria-invalid="Boolean(errors.email)"
          />
          <span v-if="errors.email" class="account__field-error">{{ errors.email }}</span>
        </label>
      </div>

      <div class="account-trainer-profile__actions">
        <button type="submit" class="account__submit btn-reset">Сохранить</button>
      </div>
    </form>
  </ElCard>
</template>

<script setup>
import { reactive, toRef, watch } from 'vue'
import { ElCard } from 'element-plus'
import { formatRussianPhoneInput, isRussianPhone } from '@/utils/phone'
import { showToast } from '@/utils/toast'
import {
  readTrainerProfileSnapshot,
  writeTrainerProfileSnapshot,
} from '@/pages/account/utils/accountTrainerProfileStorage'

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
})

const errors = reactive({
  fullName: '',
  birthDate: '',
  phone: '',
  email: '',
})

function resetErrors() {
  errors.fullName = ''
  errors.birthDate = ''
  errors.phone = ''
  errors.email = ''
}

function syncFromStorage() {
  const snapshot = readTrainerProfileSnapshot(currentUserRef)

  profile.fullName = snapshot.fullName || props.currentUser?.name || ''
  profile.birthDate = snapshot.birthDate || ''
  profile.phone = snapshot.phone || props.currentUser?.phone || ''
  profile.email = snapshot.email || props.currentUser?.email || ''
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

function handleSubmit() {
  if (!validateProfile()) {
    return
  }

  if (!writeTrainerProfileSnapshot(currentUserRef, profile)) {
    showToast('Не удалось сохранить профиль тренера.', { type: 'error' })
    return
  }

  showToast('Профиль тренера сохранён')
}

watch(
  () => props.currentUser,
  () => {
    syncFromStorage()
  },
  { immediate: true },
)
</script>

<style scoped>
.account-trainer-profile__form {
  display: grid;
  gap: 16px;
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

@media (max-width: 640px) {
  .account-trainer-profile__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>

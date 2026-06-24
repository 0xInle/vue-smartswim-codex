<template>
  <ElCard class="account__panel account-trainer-request" shadow="never">
    <template #header>
      <div class="account__panel-head">
        <div>
          <h3 class="account__panel-title">Запись к тренеру</h3>
        </div>
      </div>
    </template>

    <div v-if="showSkeleton" class="account-trainer-request__skeleton" aria-busy="true">
      <section class="account-trainer-request__skeleton-section">
        <span class="account-trainer-request__skeleton-title"></span>
        <div class="account-trainer-request__skeleton-grid account-trainer-request__skeleton-grid--single">
          <article class="account-trainer-request__skeleton-field account-trainer-request__skeleton-field--wide">
            <span class="account-trainer-request__skeleton-label"></span>
            <span class="account-trainer-request__skeleton-input"></span>
          </article>
        </div>
      </section>

      <section class="account-trainer-request__skeleton-section">
        <span class="account-trainer-request__skeleton-title"></span>
        <div class="account-trainer-request__skeleton-grid">
          <article
            v-for="index in 3"
            :key="`trainer-request-skeleton-contact-${index}`"
            class="account-trainer-request__skeleton-field"
          >
            <span class="account-trainer-request__skeleton-label"></span>
            <span class="account-trainer-request__skeleton-input"></span>
          </article>
        </div>
      </section>

      <section class="account-trainer-request__skeleton-section">
        <span class="account-trainer-request__skeleton-title"></span>
        <div class="account-trainer-request__skeleton-grid">
          <article
            v-for="index in 8"
            :key="`trainer-request-skeleton-profile-${index}`"
            class="account-trainer-request__skeleton-field"
          >
            <span class="account-trainer-request__skeleton-label"></span>
            <span class="account-trainer-request__skeleton-input"></span>
          </article>
        </div>
      </section>

      <section class="account-trainer-request__skeleton-section">
        <span class="account-trainer-request__skeleton-title"></span>
        <article class="account-trainer-request__skeleton-field account-trainer-request__skeleton-field--wide">
          <span class="account-trainer-request__skeleton-label"></span>
          <span class="account-trainer-request__skeleton-textarea"></span>
        </article>
      </section>

      <div class="account-trainer-request__skeleton-actions">
        <span class="account-trainer-request__skeleton-button"></span>
      </div>
    </div>

    <form v-else class="account-trainer-request__form" @submit.prevent="handleSubmit">
      <section class="account-trainer-request__section">
        <div class="account-trainer-request__field-row">
          <label class="account__field">
            <span class="account__field-label">Тренер</span>
            <ElSelect
              v-model="form.trainerId"
              class="account-trainer-request__select"
              placeholder="Выберите тренера"
              filterable
              clearable
              no-match-text="Нет результатов"
              no-data-text="Нет результатов"
              :aria-invalid="Boolean(errors.trainerId)"
            >
              <ElOption
                v-for="trainer in trainers"
                :key="trainer.id"
                :label="trainer.name"
                :value="trainer.id"
              />
            </ElSelect>
            <span v-if="errors.trainerId" class="account__field-error">
              {{ errors.trainerId }}
            </span>
          </label>
        </div>
      </section>

      <section class="account-trainer-request__section">
        <p class="account-trainer-request__section-title">Контакты</p>
        <div class="account-trainer-request__field-row">
          <label class="account__field">
            <span class="account__field-label">ФИО</span>
            <ElSelect
              v-model="form.participantId"
              class="account-trainer-request__select"
              placeholder="Выберите участника"
              filterable
              clearable
              no-match-text="Нет результатов"
              no-data-text="Нет результатов"
              :aria-invalid="Boolean(errors.fullName)"
              @change="handleParticipantSelect"
              @visible-change="handleParticipantDropdownVisibleChange"
            >
              <ElOption
                v-for="participant in participantOptions"
                :key="participant.id"
                :label="participant.fullName"
                :value="participant.id"
              />
            </ElSelect>
            <span v-if="errors.fullName" class="account__field-error">{{ errors.fullName }}</span>
          </label>

          <label class="account__field">
            <span class="account__field-label">Телефон</span>
            <input
              :value="form.phone"
              class="account__input"
              type="tel"
              name="trainer-request-phone"
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
              v-model.trim="form.email"
              class="account__input"
              type="email"
              name="trainer-request-email"
              placeholder="Введите email"
              :aria-invalid="Boolean(errors.email)"
            />
            <span v-if="errors.email" class="account__field-error">{{ errors.email }}</span>
          </label>
        </div>
      </section>

      <section class="account-trainer-request__section">
        <p class="account-trainer-request__section-title">Информация о пловце</p>
        <div class="account__field-grid">
          <label class="account__field">
            <span class="account__field-label">Пол</span>
            <ElSelect
              v-model="form.gender"
              class="account-trainer-request__select"
              placeholder="Выберите пол"
              :aria-invalid="Boolean(errors.gender)"
            >
              <ElOption
                v-for="option in genderOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
            <span v-if="errors.gender" class="account__field-error">{{ errors.gender }}</span>
          </label>

          <label class="account__field">
            <span class="account__field-label">Возраст</span>
            <input
              :value="form.age"
              class="account__input"
              type="text"
              name="trainer-request-age"
              inputmode="numeric"
              placeholder="Введите возраст"
              :aria-invalid="Boolean(errors.age)"
              @input="handleAgeInput"
            />
            <span v-if="errors.age" class="account__field-error">{{ errors.age }}</span>
          </label>

          <label class="account__field">
            <span class="account__field-label">Клуб</span>
            <input
              v-model.trim="form.club"
              class="account__input"
              type="text"
              name="trainer-request-club"
              placeholder="Если есть"
            />
          </label>

          <label class="account__field">
            <span class="account__field-label">Разряд</span>
            <input
              v-model.trim="form.rank"
              class="account__input"
              type="text"
              name="trainer-request-rank"
              placeholder="Если есть"
            />
          </label>

          <label class="account__field">
            <span class="account__field-label">Основной стиль</span>
            <ElSelect
              v-model="form.swimStyle"
              class="account-trainer-request__select"
              placeholder="Выберите стиль"
              clearable
            >
              <ElOption
                v-for="option in swimStyleOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </ElSelect>
          </label>

          <label class="account__field">
            <span class="account__field-label">Цель занятий</span>
            <ElSelect
              v-model="form.trainingGoal"
              class="account-trainer-request__select"
              placeholder="Выберите цель"
              clearable
            >
              <ElOption
                v-for="option in trainingGoalOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </ElSelect>
          </label>

          <label class="account__field">
            <span class="account__field-label">Желаемый формат</span>
            <ElSelect
              v-model="form.trainingFormat"
              class="account-trainer-request__select"
              placeholder="Выберите формат"
              clearable
            >
              <ElOption
                v-for="option in trainingFormatOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </ElSelect>
          </label>

          <label class="account__field">
            <span class="account__field-label">Удобное время</span>
            <div ref="timeDropdownRef" class="account-trainer-request__time-dropdown">
              <button
                type="button"
                class="account-trainer-request__time-trigger btn-reset"
                :class="{
                  'account-trainer-request__time-trigger--open': isTimeDropdownOpen,
                  'account-trainer-request__time-trigger--error': errors.preferredTime,
                }"
                :aria-invalid="Boolean(errors.preferredTime)"
                @click="toggleTimeDropdown"
              >
                <span
                  class="account-trainer-request__time-value"
                  :class="{ 'account-trainer-request__time-value--placeholder': !form.preferredTime }"
                >
                  {{ form.preferredTime || 'Выберите время' }}
                </span>
                <span class="account-trainer-request__time-icon" aria-hidden="true"></span>
              </button>

              <transition name="account-trainer-request-dropdown">
                <div
                  v-if="isTimeDropdownOpen"
                  class="account-trainer-request__time-panel"
                >
                  <button
                    v-for="time in timeOptions"
                    :key="time"
                    type="button"
                    class="account-trainer-request__time-chip btn-reset"
                    :class="{ 'account-trainer-request__time-chip--selected': form.preferredTime === time }"
                    @click="selectTime(time)"
                  >
                    {{ time }}
                  </button>
                </div>
              </transition>
            </div>
            <span v-if="errors.preferredTime" class="account__field-error">
              {{ errors.preferredTime }}
            </span>
          </label>

          <label class="account__field account-trainer-request__field--wide">
            <span class="account__field-label">Комментарий</span>
            <textarea
              v-model.trim="form.comment"
              class="account__input account-trainer-request__textarea"
              name="trainer-request-comment"
              rows="4"
              placeholder="Опыт, дистанции, ограничения по здоровью, пожелания к тренировкам"
            ></textarea>
          </label>
        </div>
      </section>

      <p
        v-if="submitStatus.message"
        class="account__form-status"
        :class="`account__form-status--${submitStatus.type}`"
      >
        {{ submitStatus.message }}
      </p>

      <div class="account-trainer-request__actions">
        <button
          type="submit"
          class="account__table-action account__table-action--edit btn-reset account-trainer-request__submit"
          :disabled="isSubmitting"
          :aria-busy="isSubmitting"
        >
          <span v-if="isSubmitting" class="account__button-spinner" aria-hidden="true"></span>
          <span v-else>Отправить заявку</span>
        </button>
      </div>
    </form>
  </ElCard>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, toRef, watch } from 'vue'
import { ElCard, ElOption, ElSelect } from 'element-plus'
import { trainers } from '@/pages/trainers/trainersData'
import {
  loadAccountAthletesForCurrentUser,
  loadAccountProfileForCurrentUser,
} from '@/domains/account-data/accountDataRepository'
import { createTrainerBooking } from '@/utils/supabaseDatabase'
import { formatRussianPhone, formatRussianPhoneInput, isRussianPhone } from '@/utils/phone'
import { sanitizeIntegerInput } from '@/utils/inputSanitizers'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
})

const currentUserRef = toRef(props, 'currentUser')

const genderOptions = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
]

const swimStyleOptions = ['Кроль', 'Брасс', 'Баттерфляй', 'На спине', 'Комплекс', 'Пока не знаю']

const trainingGoalOptions = [
  'Техника',
  'Подготовка к соревнованиям',
  'Выносливость',
  'Открытая вода',
  'Восстановление',
  'Общий прогресс',
]

const trainingFormatOptions = ['Индивидуально', 'Мини-группа', 'Группа', 'Онлайн-план']

const form = reactive({
  trainerId: '',
  participantId: '',
  fullName: '',
  phone: '',
  email: '',
  gender: '',
  age: '',
  club: '',
  rank: '',
  swimStyle: '',
  trainingGoal: '',
  trainingFormat: '',
  preferredTime: '',
  comment: '',
})

const errors = reactive({
  trainerId: '',
  fullName: '',
  phone: '',
  email: '',
  gender: '',
  age: '',
  preferredTime: '',
})

const submitStatus = reactive({
  type: 'success',
  message: '',
})
const initializedForUserKey = ref('')
const isInitialLoading = ref(true)
const profileSnapshot = ref(null)
const athleteSnapshots = ref([])
const isSubmitting = ref(false)
const isTimeDropdownOpen = ref(false)
const timeDropdownRef = ref(null)
const todayIsoDate = computed(() => new Date().toISOString().slice(0, 10))

const currentUserKey = computed(() => props.currentUser?.id || props.currentUser?.email || '')
const showSkeleton = computed(() => isInitialLoading.value)
const timeOptions = computed(() => {
  const times = []

  for (let hour = 9; hour <= 18; hour++) {
    times.push(`${String(hour).padStart(2, '0')}:00`)
  }

  return times
})

const participantOptions = computed(() => {
  const options = []
  const owner = createOwnerParticipant(profileSnapshot.value)

  if (owner.fullName) {
    options.push(owner)
  }

  return [
    ...options,
    ...athleteSnapshots.value
      .filter((athlete) => athlete.fullName)
      .map((athlete) => ({
        id: `athlete:${athlete.id}`,
        kind: 'athlete',
        fullName: athlete.fullName,
        phone: '',
        email: '',
        gender: athlete.gender || '',
        age: getAgeFromBirthDate(athlete.birthDate),
        club: athlete.club || '',
        rank: athlete.rank || '',
      })),
  ]
})

function resetErrors() {
  errors.trainerId = ''
  errors.fullName = ''
  errors.phone = ''
  errors.email = ''
  errors.gender = ''
  errors.age = ''
  errors.preferredTime = ''
}

function validateForm() {
  resetErrors()
  const normalizedFullName = form.fullName.trim()
  const normalizedPhone = form.phone.trim()
  const normalizedEmail = form.email.trim()
  const normalizedAge = String(form.age || '').trim()
  const normalizedPreferredTime = form.preferredTime.trim()
  const age = Number(normalizedAge)

  if (!form.trainerId) {
    errors.trainerId = 'Выберите тренера.'
  }

  if (!normalizedFullName) {
    errors.fullName = 'Укажите ФИО.'
  }

  if (!normalizedPhone) {
    errors.phone = 'Укажите телефон.'
  } else if (!isRussianPhone(normalizedPhone)) {
    errors.phone = 'Укажите российский телефон из 11 цифр, например 89604709999.'
  }

  if (!normalizedEmail) {
    errors.email = 'Укажите email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = 'Укажите корректный email.'
  }

  if (!form.gender) {
    errors.gender = 'Укажите пол.'
  }

  if (!normalizedAge) {
    errors.age = 'Укажите возраст.'
  } else if (!Number.isInteger(age) || age < 1 || age > 100) {
    errors.age = 'Введите возраст от 1 до 100.'
  }

  if (!normalizedPreferredTime) {
    errors.preferredTime = 'Укажите время.'
  }

  return !Object.values(errors).some(Boolean)
}

function createOwnerParticipant(snapshot = null) {
  return {
    id: 'owner',
    kind: 'owner',
    fullName: snapshot?.fullName || props.currentUser?.name || '',
    phone: snapshot?.phone || props.currentUser?.phone || '',
    email: snapshot?.email || props.currentUser?.email || '',
    gender: '',
    age: getAgeFromBirthDate(snapshot?.birthDate),
    club: snapshot?.club || '',
    rank: '',
  }
}

function getAgeFromBirthDate(value) {
  if (!value) {
    return ''
  }

  const match = String(value).match(/^(\d{2})\.(\d{2})\.(\d{4})$/)

  if (!match) {
    return ''
  }

  const birthDate = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))

  if (Number.isNaN(birthDate.getTime())) {
    return ''
  }

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())

  if (!hasBirthdayPassed) {
    age -= 1
  }

  return age > 0 ? String(age) : ''
}

function applyParticipantSnapshot(participant) {
  if (!participant) {
    return
  }

  form.participantId = participant.id
  form.fullName = participant.fullName || form.fullName
  form.phone = participant.phone || form.phone
  form.email = participant.email || form.email
  form.gender = participant.gender || ''
  form.age = participant.age || ''
  form.club = participant.club || ''
  form.rank = participant.rank || ''
  submitStatus.message = ''
}

function fillFromCurrentUser() {
  profileSnapshot.value = createOwnerParticipant()
  applyParticipantSnapshot(profileSnapshot.value)
}

async function fillFromProfile() {
  fillFromCurrentUser()
  isInitialLoading.value = true

  try {
    const [profile, athletes] = await Promise.all([
      loadAccountProfileForCurrentUser({ currentUser: currentUserRef }),
      loadAccountAthletesForCurrentUser(),
    ])

    profileSnapshot.value = profile
    athleteSnapshots.value = athletes
    applyParticipantSnapshot(createOwnerParticipant(profile))
  } catch {
    fillFromCurrentUser()
    athleteSnapshots.value = []
  } finally {
    isInitialLoading.value = false
  }
}

async function syncParticipantsFromSource() {
  try {
    const [profile, athletes] = await Promise.all([
      loadAccountProfileForCurrentUser({ currentUser: currentUserRef }),
      loadAccountAthletesForCurrentUser(),
    ])

    profileSnapshot.value = profile
    athleteSnapshots.value = athletes
  } catch {
    athleteSnapshots.value = []
  }
}

function handleParticipantSelect(value) {
  const participant = participantOptions.value.find((option) => option.id === value)

  if (participant) {
    applyParticipantSnapshot(participant)
    return
  }

  form.participantId = ''
  form.fullName = ''
  form.gender = ''
  form.age = ''
  form.club = ''
  form.rank = ''
  errors.fullName = 'Выберите участника из списка.'
  submitStatus.message = ''
}

function handlePhoneInput(event) {
  form.phone = formatRussianPhoneInput(event.target.value)
  errors.phone = ''
}

function handleAgeInput(event) {
  form.age = sanitizeIntegerInput(event.target.value, { maxLength: 3 })
  errors.age = ''
}

function handleParticipantDropdownVisibleChange(isVisible) {
  if (isVisible) {
    void syncParticipantsFromSource()
  }
}

function toggleTimeDropdown() {
  isTimeDropdownOpen.value = !isTimeDropdownOpen.value
}

function selectTime(time) {
  form.preferredTime = time
  errors.preferredTime = ''
  isTimeDropdownOpen.value = false
}

function handleDocumentPointerDown(event) {
  if (timeDropdownRef.value && !timeDropdownRef.value.contains(event.target)) {
    isTimeDropdownOpen.value = false
  }
}

function handleDocumentKeyDown(event) {
  if (event.key === 'Escape') {
    isTimeDropdownOpen.value = false
  }
}

function splitFullName(value) {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return {
    lastName: parts[0] || '',
    firstName: parts.slice(1).join(' ') || parts[0] || '',
  }
}

function getGenderLabel(value) {
  return genderOptions.find((option) => option.value === value)?.label || value || ''
}

function buildBookingComment() {
  const normalizedClub = form.club.trim()
  const normalizedRank = form.rank.trim()
  const normalizedSwimStyle = form.swimStyle.trim()
  const normalizedTrainingGoal = form.trainingGoal.trim()
  const normalizedTrainingFormat = form.trainingFormat.trim()
  const lines = [
    'Данные пловца:',
    `ФИО: ${form.fullName.trim()}`,
    `Пол: ${getGenderLabel(form.gender)}`,
    `Возраст: ${String(form.age || '').trim()}`,
    `Клуб: ${normalizedClub || 'Не указан'}`,
    `Разряд: ${normalizedRank || 'Не указан'}`,
    `Основной стиль: ${normalizedSwimStyle || 'Не указан'}`,
    `Цель занятий: ${normalizedTrainingGoal || 'Не указана'}`,
    `Желаемый формат: ${normalizedTrainingFormat || 'Не указан'}`,
  ]

  if (form.comment.trim()) {
    lines.push('', 'Комментарий пользователя:', form.comment.trim())
  }

  return lines.join('\n')
}

async function handleSubmit() {
  if (isSubmitting.value) {
    return
  }

  submitStatus.message = ''

  if (!validateForm()) {
    submitStatus.type = 'error'
    submitStatus.message = 'Заполните обязательные поля.'
    return
  }

  const selectedTrainer = trainers.find((trainer) => trainer.id === form.trainerId)

  if (!selectedTrainer) {
    errors.trainerId = 'Выберите тренера.'
    return
  }

  const normalizedFullName = form.fullName.trim()
  const normalizedEmail = form.email.trim()
  const normalizedPreferredTime = form.preferredTime.trim()
  const { firstName, lastName } = splitFullName(normalizedFullName)

  isSubmitting.value = true

  try {
    await createTrainerBooking({
      trainerId: selectedTrainer.id,
      trainerName: selectedTrainer.name,
      firstName,
      lastName,
      phone: formatRussianPhone(form.phone),
      email: normalizedEmail,
      preferredDate: todayIsoDate.value,
      preferredTime: normalizedPreferredTime,
      comment: buildBookingComment(),
    })

    submitStatus.type = 'success'
    submitStatus.message = ''
  } catch (error) {
    submitStatus.type = 'error'
    submitStatus.message = error instanceof Error ? error.message : 'Не удалось отправить заявку.'
  } finally {
    isSubmitting.value = false
  }
}

watch(
  currentUserKey,
  (userKey) => {
    if (!userKey || initializedForUserKey.value === userKey) {
      return
    }

    initializedForUserKey.value = userKey
    void fillFromProfile()
  },
  { immediate: true },
)

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeyDown)

  if (!initializedForUserKey.value) {
    initializedForUserKey.value = currentUserKey.value
    void fillFromProfile()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeyDown)
})
</script>

<style scoped>
.account-trainer-request__form {
  display: grid;
  gap: 18px;
}

.account-trainer-request__section {
  display: grid;
  gap: 12px;
}

.account-trainer-request__section-title {
  margin: 0;
  font-family: Oswald, sans-serif;
  font-size: 18px;
  line-height: 1.1;
  text-transform: uppercase;
  color: var(--black);
}

.account-trainer-request__skeleton {
  display: grid;
  gap: 18px;
}

.account-trainer-request__skeleton-section {
  display: grid;
  gap: 12px;
}

.account-trainer-request__skeleton-title {
  width: 176px;
  height: 18px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cyan) 12%, white);
}

.account-trainer-request__skeleton-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.account-trainer-request__skeleton-grid--single {
  grid-template-columns: 1fr;
}

.account-trainer-request__skeleton-field {
  display: grid;
  gap: 8px;
}

.account-trainer-request__skeleton-field--wide {
  grid-column: 1 / -1;
}

.account-trainer-request__skeleton-label,
.account-trainer-request__skeleton-input,
.account-trainer-request__skeleton-textarea,
.account-trainer-request__skeleton-button {
  position: relative;
  overflow: hidden;
  display: block;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cyan) 12%, white);
}

.account-trainer-request__skeleton-label::after,
.account-trainer-request__skeleton-input::after,
.account-trainer-request__skeleton-textarea::after,
.account-trainer-request__skeleton-button::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.74), transparent);
  animation: account-trainer-request-skeleton-shimmer 1.2s ease-in-out infinite;
}

.account-trainer-request__skeleton-label {
  width: 96px;
  height: 11px;
}

.account-trainer-request__skeleton-input {
  width: 100%;
  height: 38px;
}

.account-trainer-request__skeleton-textarea {
  width: 100%;
  height: 112px;
  border-radius: 10px;
}

.account-trainer-request__skeleton-actions {
  display: flex;
  justify-content: flex-start;
}

.account-trainer-request__skeleton-button {
  width: 188px;
  height: 38px;
  border-radius: 10px;
}

.account-trainer-request__field--wide {
  grid-column: 1 / -1;
}

.account-trainer-request__field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.account-trainer-request__select {
  width: 100%;
}

.account-trainer-request__select :deep(.el-select__wrapper) {
  box-sizing: border-box;
  height: 38px;
  min-height: 38px;
  max-height: 38px;
  border-radius: 10px;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--cyan) 24%, white) inset;
}

.account-trainer-request__select :deep(.el-select__wrapper.is-focused) {
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--cyan) 54%, white) inset,
    0 0 0 4px color-mix(in srgb, var(--cyan) 16%, transparent);
}

.account-trainer-request__time-dropdown {
  position: relative;
}

.account-trainer-request__time-trigger {
  position: relative;
  display: flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  height: 38px;
  min-height: 38px;
  max-height: 38px;
  padding: 0 44px 0 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 24%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.9);
  font: inherit;
  font-size: 15px;
  font-weight: 800;
  color: var(--black);
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.account-trainer-request__time-trigger:hover,
.account-trainer-request__time-trigger--open,
.account-trainer-request__time-trigger:focus-visible {
  border-color: color-mix(in srgb, var(--cyan) 54%, white);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--cyan) 16%, transparent);
  outline: none;
}

.account-trainer-request__time-trigger--error {
  border-color: color-mix(in srgb, var(--orange) 72%, transparent);
}

.account-trainer-request__time-value {
  min-width: 0;
  overflow: hidden;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--black);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-trainer-request__time-value--placeholder {
  color: #a8abb2;
}

.account-trainer-request__time-icon {
  position: absolute;
  right: 18px;
  top: 50%;
  width: 10px;
  height: 10px;
  border-right: 2px solid color-mix(in srgb, var(--black) 58%, white);
  border-bottom: 2px solid color-mix(in srgb, var(--black) 58%, white);
  transform: translateY(-62%) rotate(45deg);
  transition: transform 0.2s ease;
}

.account-trainer-request__time-trigger--open .account-trainer-request__time-icon {
  transform: translateY(-20%) rotate(-135deg);
}

.account-trainer-request__time-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  width: min(280px, 100%);
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--cyan) 18%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.98);
  box-shadow: 0 18px 40px rgb(15 23 42 / 0.14);
}

.account-trainer-request__time-chip {
  min-height: 36px;
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, var(--cyan) 18%, white);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 84%, transparent);
  font-size: 13px;
  font-weight: 900;
  color: var(--black);
  text-align: center;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.account-trainer-request__time-chip:hover,
.account-trainer-request__time-chip--selected {
  border-color: color-mix(in srgb, var(--cyan) 64%, white);
  background: color-mix(in srgb, var(--cyan) 72%, white);
  color: var(--white);
}

.account-trainer-request-dropdown-enter-active,
.account-trainer-request-dropdown-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.account-trainer-request-dropdown-enter-from,
.account-trainer-request-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.account-trainer-request__textarea {
  width: 100%;
  max-width: 100%;
  height: 112px;
  min-height: 112px;
  max-height: 112px;
  padding-block: 12px;
  resize: none;
}

.account-trainer-request__actions {
  display: flex;
  justify-content: flex-start;
}

.account-trainer-request__submit {
  min-height: 38px;
  padding: 8px 14px;
}

@media (max-width: 760px) {
  .account-trainer-request__field-row {
    grid-template-columns: 1fr;
  }

  .account-trainer-request__skeleton-grid {
    grid-template-columns: 1fr;
  }

  .account-trainer-request__skeleton-title {
    width: 140px;
  }
}

@keyframes account-trainer-request-skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>

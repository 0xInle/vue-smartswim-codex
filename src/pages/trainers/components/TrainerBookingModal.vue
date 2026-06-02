<template>
  <Teleport to="body">
    <Transition name="trainers-booking-modal">
      <div v-if="isOpen" class="trainers-booking" @click.self="emit('close')">
        <div
          class="trainers-booking__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trainers-booking-title"
        >
          <div class="trainers-booking__trainer-card">
            <h2 id="trainers-booking-title" class="trainers-booking__trainer-name">
              {{ trainer?.name || 'Не выбран' }}
            </h2>
          </div>

          <form class="trainers-booking__form" @submit.prevent="emit('submit')">
            <input
              v-model.trim="form.website"
              type="text"
              name="website"
              autocomplete="off"
              class="trainers-booking__honeypot"
              tabindex="-1"
            />

            <label class="trainers-booking__field">
              <span class="trainers-booking__label">ФИО</span>
              <input
                v-model.trim="form.fullName"
                class="trainers-booking__input"
                type="text"
                name="fullName"
                placeholder="Иванов Иван Иванович"
                :aria-invalid="Boolean(errors.fullName)"
              />
              <span v-if="errors.fullName" class="trainers-booking__error">
                {{ errors.fullName }}
              </span>
            </label>

            <div class="trainers-booking__grid">
              <label class="trainers-booking__field">
                <span class="trainers-booking__label">Email</span>
                <input
                  v-model.trim="form.email"
                  class="trainers-booking__input"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  :aria-invalid="Boolean(errors.email)"
                />
                <span v-if="errors.email" class="trainers-booking__error">
                  {{ errors.email }}
                </span>
              </label>

              <label class="trainers-booking__field">
                <span class="trainers-booking__label">Телефон</span>
                <input
                  :value="form.phone"
                  class="trainers-booking__input"
                  type="tel"
                  name="phone"
                  inputmode="tel"
                  placeholder="+7 (961) 471-33-80"
                  :aria-invalid="Boolean(errors.phone)"
                  @input="handlePhoneInput"
                />
                <span v-if="errors.phone" class="trainers-booking__error">
                  {{ errors.phone }}
                </span>
              </label>
            </div>

            <div class="trainers-booking__datetime">
              <div
                ref="dateDropdownRef"
                class="trainers-booking__dropdown trainers-booking__dropdown--date"
              >
                <button
                  type="button"
                  class="trainers-booking__dropdown-trigger btn-reset"
                  :class="{
                    'trainers-booking__dropdown-trigger--open': isDateOpen,
                    'trainers-booking__dropdown-trigger--error': errors.preferredDate,
                  }"
                  :aria-invalid="Boolean(errors.preferredDate)"
                  @click="toggleDateDropdown"
                >
                  <span class="trainers-booking__dropdown-label">Дата</span>
                  <span class="trainers-booking__dropdown-value">
                    {{ formatTriggerDate(selectedDate) }}
                  </span>
                  <span class="trainers-booking__dropdown-icon" aria-hidden="true"></span>
                </button>
                <transition name="trainers-booking-dropdown">
                  <div
                    v-if="isDateOpen"
                    class="trainers-booking__dropdown-panel trainers-booking__dropdown-panel--date"
                  >
                    <div class="trainers-booking__dropdown-head">
                      <div class="trainers-booking__calendar-nav">
                        <button
                          type="button"
                          class="trainers-booking__calendar-arrow btn-reset"
                          @click.stop="changeCalendarMonth(-1)"
                        >
                          <span class="trainers-booking__calendar-arrow-icon" aria-hidden="true"
                            >‹</span
                          >
                        </button>
                        <div class="trainers-booking__calendar-title-wrap">
                          <span class="trainers-booking__dropdown-title">{{ calendarTitle }}</span>
                          <span class="trainers-booking__dropdown-caption"
                            >Выберите дату тренировки</span
                          >
                        </div>
                        <button
                          type="button"
                          class="trainers-booking__calendar-arrow btn-reset"
                          @click.stop="changeCalendarMonth(1)"
                        >
                          <span class="trainers-booking__calendar-arrow-icon" aria-hidden="true"
                            >›</span
                          >
                        </button>
                      </div>
                    </div>
                    <div class="trainers-booking__calendar-weekdays">
                      <span
                        v-for="weekday in weekDays"
                        :key="weekday"
                        class="trainers-booking__calendar-weekday"
                      >
                        {{ weekday }}
                      </span>
                    </div>
                    <div class="trainers-booking__calendar-grid">
                      <template v-for="day in calendarDays" :key="day.key">
                        <span
                          v-if="day.isPlaceholder"
                          class="trainers-booking__calendar-day-placeholder"
                        ></span>
                        <button
                          v-else
                          type="button"
                          class="trainers-booking__calendar-day btn-reset"
                          :class="{
                            'trainers-booking__calendar-day--disabled': day.isDisabled,
                            'trainers-booking__calendar-day--today': day.isToday,
                            'trainers-booking__calendar-day--selected': day.isSelected,
                          }"
                          :disabled="day.isDisabled"
                          @click="selectDate(day.date)"
                        >
                          {{ day.label }}
                        </button>
                      </template>
                    </div>
                  </div>
                </transition>
              </div>

              <div
                ref="timeDropdownRef"
                class="trainers-booking__dropdown trainers-booking__dropdown--time"
              >
                <button
                  type="button"
                  class="trainers-booking__dropdown-trigger btn-reset"
                  :class="{
                    'trainers-booking__dropdown-trigger--open': isTimeOpen,
                    'trainers-booking__dropdown-trigger--error': errors.preferredTime,
                  }"
                  :aria-invalid="Boolean(errors.preferredTime)"
                  @click="toggleTimeDropdown"
                >
                  <span class="trainers-booking__dropdown-label">Время</span>
                  <span class="trainers-booking__dropdown-value">
                    {{ selectedTime }}
                  </span>
                  <span class="trainers-booking__dropdown-icon" aria-hidden="true"></span>
                </button>
                <transition name="trainers-booking-dropdown">
                  <div
                    v-if="isTimeOpen"
                    class="trainers-booking__dropdown-panel trainers-booking__dropdown-panel--time"
                  >
                    <div class="trainers-booking__time-grid">
                      <button
                        v-for="time in timeOptions"
                        :key="time"
                        type="button"
                        class="trainers-booking__time-chip btn-reset"
                        :class="{ 'trainers-booking__time-chip--selected': selectedTime === time }"
                        @click="selectTime(time)"
                      >
                        {{ time }}
                      </button>
                    </div>
                  </div>
                </transition>
              </div>
            </div>

            <p
              v-if="errors.preferredDate || errors.preferredTime"
              class="trainers-booking__error trainers-booking__error--inline"
            >
              {{ errors.preferredDate || errors.preferredTime }}
            </p>

            <label class="trainers-booking__field">
              <span class="trainers-booking__label">Комментарий</span>
              <textarea
                v-model.trim="form.comment"
                class="trainers-booking__input trainers-booking__input--textarea"
                name="comment"
                rows="3"
                placeholder="Например: хочу утренние тренировки или подготовку к старту"
              ></textarea>
            </label>

            <div v-if="isIdentityLoading" class="trainers-booking__hint">
              Загружаем ваши данные для записи...
            </div>

            <div v-else-if="isAuthenticated" class="trainers-booking__hint">
              Вы авторизованы. После отправки запись появится в личном кабинете.
            </div>

            <p
              v-if="feedback?.message"
              class="trainers-booking__status"
              :class="{ 'trainers-booking__status--error': feedback.type === 'error' }"
            >
              {{ feedback.message }}
            </p>

            <div v-else class="trainers-booking__auth-box">
              <label class="trainers-booking__checkbox">
                <input v-model="form.createAccount" type="checkbox" />
                <span>
                  Создать аккаунт вместе с записью, чтобы потом смотреть статус в личном кабинете
                </span>
              </label>

              <p class="trainers-booking__hint">
                Если не создавать аккаунт сейчас, запись все равно отправится, но в кабинет она не
                попадет, пока вы не зарегистрируетесь на ту же почту.
              </p>

              <div v-if="form.createAccount" class="trainers-booking__grid">
                <label class="trainers-booking__field">
                  <span class="trainers-booking__label">Пароль</span>
                  <input
                    v-model="form.password"
                    class="trainers-booking__input"
                    type="password"
                    name="password"
                    :aria-invalid="Boolean(errors.password)"
                    placeholder="Минимум 6 символов"
                  />
                  <span v-if="errors.password" class="trainers-booking__error">
                    {{ errors.password }}
                  </span>
                </label>

                <label class="trainers-booking__field">
                  <span class="trainers-booking__label">Повторите пароль</span>
                  <input
                    v-model="form.confirmPassword"
                    class="trainers-booking__input"
                    type="password"
                    name="confirmPassword"
                    :aria-invalid="Boolean(errors.confirmPassword)"
                    placeholder="Повторите пароль"
                  />
                  <span v-if="errors.confirmPassword" class="trainers-booking__error">
                    {{ errors.confirmPassword }}
                  </span>
                </label>
              </div>
            </div>

            <div class="trainers-booking__actions">
              <button
                type="button"
                class="trainers-booking__secondary btn-reset"
                @click="emit('close')"
              >
                Отмена
              </button>

              <button
                type="submit"
                class="trainers-booking__submit btn-reset"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? 'Отправляем...' : 'Отправить запись' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, toRefs, watch } from 'vue'
import { formatPhoneInput } from '@/utils/phone'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  trainer: {
    type: Object,
    default: null,
  },
  form: {
    type: Object,
    required: true,
  },
  errors: {
    type: Object,
    required: true,
  },
  feedback: {
    type: Object,
    default: () => ({
      type: 'idle',
      message: '',
    }),
  },
  todayIsoDate: {
    type: String,
    required: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  isIdentityLoading: {
    type: Boolean,
    default: false,
  },
  isAuthenticated: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'submit'])
const {
  isOpen,
  trainer,
  form,
  errors,
  isSubmitting,
  isIdentityLoading,
  isAuthenticated,
} = toRefs(props)

const isDateOpen = ref(false)
const isTimeOpen = ref(false)
const dateDropdownRef = ref(null)
const timeDropdownRef = ref(null)
const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const today = new Date()
today.setHours(0, 0, 0, 0)

const BOOKING_MODAL_BODY_CLASS = 'trainers-booking-modal-open'

function handlePhoneInput(event) {
  form.value.phone = formatPhoneInput(event.target.value)
  errors.value.phone = ''
}

const timeOptions = computed(() => {
  const times = []

  for (let hour = 9; hour <= 19; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 19 && minute > 0) {
        break
      }

      times.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
    }
  }

  return times
})

const selectedDate = computed(() => {
  if (!form.value.preferredDate) {
    return new Date(today)
  }

  const [year, month, day] = form.value.preferredDate.split('-').map(Number)
  const parsedDate = new Date(year, month - 1, day)
  parsedDate.setHours(0, 0, 0, 0)
  return parsedDate
})

const selectedTime = computed(() => form.value.preferredTime || getInitialTime())

const calendarMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))

const calendarTitle = computed(() =>
  new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(calendarMonth.value),
)

const calendarDays = computed(() => {
  const firstDayOfMonth = new Date(
    calendarMonth.value.getFullYear(),
    calendarMonth.value.getMonth(),
    1,
  )
  const lastDayOfMonth = new Date(
    calendarMonth.value.getFullYear(),
    calendarMonth.value.getMonth() + 1,
    0,
  )
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7
  const days = []

  for (let index = 0; index < startOffset; index++) {
    days.push({
      key: `empty-start-${index}`,
      isPlaceholder: true,
    })
  }

  for (let dayNumber = 1; dayNumber <= lastDayOfMonth.getDate(); dayNumber++) {
    const date = new Date(
      calendarMonth.value.getFullYear(),
      calendarMonth.value.getMonth(),
      dayNumber,
    )
    date.setHours(0, 0, 0, 0)

    days.push({
      key: date.toISOString(),
      date,
      label: dayNumber,
      isPlaceholder: false,
      isDisabled: isDateInPast(date),
      isToday: date.getTime() === today.getTime(),
      isSelected: selectedDate.value.getTime() === date.getTime(),
    })
  }

  return days
})

function isDateInPast(date) {
  return date.getTime() < today.getTime()
}

function formatTriggerDate(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}`
}

function toIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getInitialTime() {
  const now = new Date()
  const roundedMinutes = now.getMinutes() <= 30 ? 30 : 0
  const roundedHour = now.getMinutes() <= 30 ? now.getHours() : now.getHours() + 1
  const normalizedHour = Math.min(Math.max(roundedHour, 9), 19)
  const normalizedMinutes = normalizedHour === 19 ? 0 : roundedMinutes
  const initialTime = `${String(normalizedHour).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}`

  return timeOptions.value.includes(initialTime) ? initialTime : timeOptions.value[0]
}

function toggleDateDropdown() {
  isDateOpen.value = !isDateOpen.value
  isTimeOpen.value = false
}

function toggleTimeDropdown() {
  isTimeOpen.value = !isTimeOpen.value
  isDateOpen.value = false
}

function selectDate(date) {
  if (isDateInPast(date)) {
    return
  }

  form.value.preferredDate = toIsoDate(date)
  errors.value.preferredDate = ''
  isDateOpen.value = false
}

function selectTime(time) {
  form.value.preferredTime = time
  errors.value.preferredTime = ''
  isTimeOpen.value = false
}

function changeCalendarMonth(direction) {
  const nextMonth = new Date(
    calendarMonth.value.getFullYear(),
    calendarMonth.value.getMonth() + direction,
    1,
  )

  if (nextMonth < new Date(today.getFullYear(), today.getMonth(), 1)) {
    return
  }

  calendarMonth.value = nextMonth
}

function handleOutsideClick(event) {
  if (dateDropdownRef.value && !dateDropdownRef.value.contains(event.target)) {
    isDateOpen.value = false
  }

  if (timeDropdownRef.value && !timeDropdownRef.value.contains(event.target)) {
    isTimeOpen.value = false
  }
}

watch(
  isOpen,
  (isOpen) => {
    document.body.classList.toggle(BOOKING_MODAL_BODY_CLASS, isOpen)
    document.body.style.overflow = isOpen ? 'hidden' : ''

    if (isOpen) {
      if (!form.value.preferredDate) {
        form.value.preferredDate = toIsoDate(today)
      }

      if (!form.value.preferredTime) {
        form.value.preferredTime = getInitialTime()
      }

      calendarMonth.value = new Date(
        selectedDate.value.getFullYear(),
        selectedDate.value.getMonth(),
        1,
      )
      return
    }

    isDateOpen.value = false
    isTimeOpen.value = false
  },
  { immediate: true },
)

watch(
  () => form.value.preferredDate,
  (value) => {
    if (!value) {
      return
    }

    calendarMonth.value = new Date(
      selectedDate.value.getFullYear(),
      selectedDate.value.getMonth(),
      1,
    )
  },
)

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  document.body.classList.remove(BOOKING_MODAL_BODY_CLASS)
  document.body.style.overflow = ''
})
</script>

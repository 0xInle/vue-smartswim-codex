<template>
  <div ref="dropdownRef" class="account-date-picker">
    <button
      type="button"
      class="account-date-picker__trigger btn-reset"
      :class="{
        'account-date-picker__trigger--open': isOpen,
        'account-date-picker__trigger--empty': !modelValue,
      }"
      :aria-invalid="ariaInvalid ? 'true' : undefined"
      @click="toggleDropdown"
    >
      <span class="account-date-picker__value">{{ triggerLabel }}</span>
      <span class="account-date-picker__icon" aria-hidden="true"></span>
    </button>

    <Transition name="account-date-picker-dropdown">
      <div v-if="isOpen" class="account-date-picker__panel">
        <div class="account-date-picker__head">
          <div class="account-date-picker__calendar-nav">
            <button
              type="button"
              class="account-date-picker__calendar-arrow btn-reset"
              @click.stop="changeCalendarMonth(-1)"
            >
              <span class="account-date-picker__calendar-arrow-icon" aria-hidden="true">‹</span>
            </button>

            <div class="account-date-picker__calendar-title-wrap">
              <span class="account-date-picker__title">
                {{ calendarTitle }}
              </span>
              <span class="account-date-picker__caption">
                {{ caption }}
              </span>
            </div>

            <button
              type="button"
              class="account-date-picker__calendar-arrow btn-reset"
              @click.stop="changeCalendarMonth(1)"
            >
              <span class="account-date-picker__calendar-arrow-icon" aria-hidden="true">›</span>
            </button>
          </div>
        </div>

        <div class="account-date-picker__calendar-weekdays">
          <span
            v-for="weekday in weekDays"
            :key="weekday"
            class="account-date-picker__calendar-weekday"
          >
            {{ weekday }}
          </span>
        </div>

        <div class="account-date-picker__calendar-grid">
          <template v-for="day in calendarDays" :key="day.key">
            <span
              v-if="day.isPlaceholder"
              class="account-date-picker__calendar-day-placeholder"
            ></span>
            <button
              v-else
              type="button"
              class="account-date-picker__calendar-day btn-reset"
              :class="{
                'account-date-picker__calendar-day--today': day.isToday,
                'account-date-picker__calendar-day--selected': day.isSelected,
              }"
              @click="selectDate(day.date)"
            >
              {{ day.label }}
            </button>
          </template>
        </div>
      </div>
    </Transition>

    <ElDialog
      v-model="isConfirmOpen"
      append-to-body
      align-center
      destroy-on-close
      class="account-date-picker__confirm-dialog account__dialog--confirm"
      width="420px"
      title="Подтвердите изменение даты"
      :close-icon="Close"
    >
      <div class="account-date-picker__confirm-copy">
        <p class="account-date-picker__confirm-text">
          {{ confirmText }}
        </p>
      </div>

      <template #footer>
        <div class="account-date-picker__confirm-actions">
          <button
            type="button"
            class="account__table-action account__table-action--ghost btn-reset"
            @click="cancelPendingDate"
          >
            Отмена
          </button>
          <button type="button" class="account__submit btn-reset" @click="applyPendingDate">
            Заменить
          </button>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { ElDialog } from 'element-plus'
import { formatCompetitionCalendarDateShort } from '@/pages/account/utils/accountFormatters'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  caption: {
    type: String,
    default: 'Выберите дату',
  },
  placeholder: {
    type: String,
    default: 'Выберите дату',
  },
  ariaInvalid: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const dropdownRef = ref(null)
const isOpen = ref(false)
const isConfirmOpen = ref(false)
const pendingDate = ref('')
const today = new Date()
today.setHours(0, 0, 0, 0)
const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const calendarMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))

const triggerLabel = computed(() =>
  props.modelValue ? formatCompetitionCalendarDateShort(props.modelValue) : props.placeholder,
)

const selectedDate = computed(() => {
  if (!props.modelValue) {
    return new Date(today)
  }

  const [year, month, day] = props.modelValue.split('-').map(Number)
  const parsedDate = new Date(year, month - 1, day)
  parsedDate.setHours(0, 0, 0, 0)
  return parsedDate
})

const calendarTitle = computed(() =>
  new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(calendarMonth.value),
)

const confirmText = computed(() => {
  if (!pendingDate.value) {
    return ''
  }

  const currentDate = props.modelValue ? formatCompetitionCalendarDateShort(props.modelValue) : '—'
  const nextDate = formatCompetitionCalendarDateShort(pendingDate.value)

  return `Заменить дату с ${currentDate} на ${nextDate}?`
})

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
      isToday: date.getTime() === today.getTime(),
      isSelected: selectedDate.value.getTime() === date.getTime(),
    })
  }

  return days
})

function toIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function openDropdown() {
  isOpen.value = true
  calendarMonth.value = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), 1)
}

function closeDropdown() {
  isOpen.value = false
}

function toggleDropdown() {
  if (isOpen.value) {
    closeDropdown()
    return
  }

  openDropdown()
}

function selectDate(date) {
  const nextValue = toIsoDate(date)

  if (props.modelValue && props.modelValue !== nextValue) {
    pendingDate.value = nextValue
    isConfirmOpen.value = true
    return
  }

  emit('update:modelValue', nextValue)
  closeDropdown()
}

function applyPendingDate() {
  if (!pendingDate.value) {
    return
  }

  emit('update:modelValue', pendingDate.value)
  pendingDate.value = ''
  isConfirmOpen.value = false
  closeDropdown()
}

function cancelPendingDate() {
  pendingDate.value = ''
  isConfirmOpen.value = false
}

function changeCalendarMonth(direction) {
  const nextMonth = new Date(
    calendarMonth.value.getFullYear(),
    calendarMonth.value.getMonth() + direction,
    1,
  )

  calendarMonth.value = nextMonth
}

function handleOutsideClick(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (!value || !isOpen.value) {
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
})
</script>

<style scoped>
.account-date-picker {
  position: relative;
}

.account-date-picker__trigger {
  display: flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  height: 38px;
  min-height: 38px;
  max-height: 38px;
  padding: 0 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 24%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.9);
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  color: var(--black);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.account-date-picker__trigger--empty {
  color: color-mix(in srgb, var(--black) 42%, white);
}

.account-date-picker__trigger--open {
  border-color: color-mix(in srgb, var(--cyan) 54%, white);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--cyan) 16%, transparent);
}

.account-date-picker__trigger:focus-visible {
  outline: none;
}

.account-date-picker__value {
  min-width: 0;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-date-picker__icon {
  flex: 0 0 auto;
  width: 9px;
  height: 9px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: translateY(-2px) rotate(45deg);
  transition: transform 0.2s ease;
}

.account-date-picker__trigger--open .account-date-picker__icon {
  transform: translateY(1px) rotate(225deg);
}

.account-date-picker__panel {
  position: absolute;
  bottom: calc(100% + 10px);
  right: 0;
  left: 0;
  z-index: 20;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 92%, transparent);
  box-shadow: 0 18px 40px rgb(from var(--black) r g b / 14%);
}

.account-date-picker__head {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 12px;
}

.account-date-picker__calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.account-date-picker__calendar-title-wrap {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.account-date-picker__title {
  font-size: 15px;
  font-weight: 800;
  color: var(--cyan);
}

.account-date-picker__caption {
  font-size: 12px;
  font-weight: 700;
  color: color-mix(in srgb, var(--black) 58%, var(--white));
}

.account-date-picker__calendar-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 36%, transparent);
  font-size: 24px;
  line-height: 36px;
  color: var(--black);
}

.account-date-picker__calendar-arrow-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  line-height: 1;
  transform: translateY(-1px);
}

.account-date-picker__calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 8px;
}

.account-date-picker__calendar-weekday {
  display: flex;
  justify-content: center;
  padding: 4px 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 52%, var(--white));
}

.account-date-picker__calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.account-date-picker__calendar-day,
.account-date-picker__calendar-day-placeholder {
  aspect-ratio: 1;
}

.account-date-picker__calendar-day {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(from var(--white) r g b / 18%);
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 18%);
  background-clip: padding-box;
  font-size: 13px;
  font-weight: 800;
  color: var(--black);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.account-date-picker__calendar-day:hover {
  border-color: color-mix(in srgb, var(--cyan) 64%, var(--white));
  background: color-mix(in srgb, var(--cyan) 60%, transparent);
  color: var(--white);
}

.account-date-picker__calendar-day--today {
  border-color: color-mix(in srgb, var(--cyan) 58%, var(--white));
}

.account-date-picker__calendar-day--selected {
  background: rgb(from var(--cyan) r g b / 76%);
  border-color: rgb(from var(--cyan) r g b / 72%);
  color: var(--white);
}

.account-date-picker__calendar-day-placeholder {
  display: block;
}

.account-date-picker-dropdown-enter-active,
.account-date-picker-dropdown-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.account-date-picker-dropdown-enter-from,
.account-date-picker-dropdown-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.account-date-picker__confirm-dialog :global(.el-dialog__body) {
  padding-top: 8px;
}

.account-date-picker__confirm-copy {
  display: grid;
  gap: 8px;
}

.account-date-picker__confirm-text {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
  color: var(--black);
}

.account-date-picker__confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

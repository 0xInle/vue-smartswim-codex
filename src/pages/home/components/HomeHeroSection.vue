<template>
  <section class="home" :class="{ 'home--intro-ready': isIntroReady }">
    <video autoplay muted loop playsinline preload="metadata" class="home__video-player">
      <source :src="heroVideo" type="video/mp4" />
      Ваш браузер не поддерживает видео.
    </video>

    <div class="home__backdrop"></div>

    <div class="home__overlay">
      <div class="home__shell container">
        <div class="home__grid">
          <div class="home__content">
            <div class="home__brand">
              <span class="home__brand-icon">
                <IconSwimmer class="home__icon home__icon--swimmer" />
              </span>
              <div class="home__brand-copy">
                <p class="home__eyebrow">Smart Swim</p>
                <p class="home__brand-subtitle">Школа плавания для детей и взрослых</p>
              </div>
            </div>

            <div class="home__heading">
              <h1 class="home__title home__intro-item" style="--intro-delay: 0.08s">
                Быстрый старт
              </h1>
              <p class="home__title-line home__intro-item" style="--intro-delay: 0.18s">
                в воде и на соревнованиях
              </p>
            </div>

            <p class="home__description home__intro-item" style="--intro-delay: 0.3s">
              Помогаем освоиться в воде, выстроить технику и уверенно выходить на первые старты в
              атмосфере системной подготовки и бережной поддержки.
            </p>

            <div class="home__meta">
              <div class="home__meta-card">
                <span class="home__meta-label">Тренировки</span>
                <span class="home__meta-value">для детей и взрослых</span>
              </div>
              <div class="home__meta-card">
                <span class="home__meta-label">Подготовка</span>
                <span class="home__meta-value">к стартам и разрядам</span>
              </div>
            </div>
          </div>

          <form class="home__form">
            <div class="home__form-header">
              <div class="home__form-title">Запланировать консультацию</div>
              <p class="home__form-text">
                Подберем удобное время и поможем выбрать формат занятий.
              </p>
            </div>

            <label class="home__label" for="name">Имя</label>
            <input class="home__input" type="text" id="name" placeholder="Введите имя" />

            <label class="home__label" for="phone">Телефон</label>
            <input class="home__input" type="tel" id="phone" placeholder="Введите номер телефона" />

            <div class="home__datetime">
              <div ref="dateDropdownRef" class="home__dropdown home__dropdown--date">
                <button
                  type="button"
                  class="home__dropdown-trigger home__dropdown-trigger--date btn-reset"
                  :class="{ 'home__dropdown-trigger--open': isDateOpen }"
                  @click="toggleDateDropdown"
                >
                  <span class="home__dropdown-label">Дата</span>
                  <span class="home__dropdown-value">
                    {{ formatTriggerDate(selectedDate) }}
                  </span>
                  <span class="home__dropdown-icon" aria-hidden="true"></span>
                </button>
                <transition name="home-dropdown">
                  <div v-if="isDateOpen" class="home__dropdown-panel home__dropdown-panel--date">
                    <div class="home__dropdown-head">
                      <div class="home__calendar-nav">
                        <button
                          type="button"
                          class="home__calendar-arrow btn-reset"
                          @click.stop="changeCalendarMonth(-1)"
                        >
                          <span class="home__calendar-arrow-icon" aria-hidden="true">‹</span>
                        </button>
                        <div class="home__calendar-title-wrap">
                          <span class="home__dropdown-title">{{ calendarTitle }}</span>
                          <span class="home__dropdown-caption">Выберите удобную дату</span>
                        </div>
                        <button
                          type="button"
                          class="home__calendar-arrow btn-reset"
                          @click.stop="changeCalendarMonth(1)"
                        >
                          <span class="home__calendar-arrow-icon" aria-hidden="true">›</span>
                        </button>
                      </div>
                    </div>
                    <div class="home__calendar-weekdays">
                      <span
                        v-for="weekday in weekDays"
                        :key="weekday"
                        class="home__calendar-weekday"
                      >
                        {{ weekday }}
                      </span>
                    </div>
                    <div class="home__calendar-grid">
                      <template v-for="day in calendarDays" :key="day.key">
                        <span
                          v-if="day.isPlaceholder"
                          class="home__calendar-day-placeholder"
                        ></span>
                        <button
                          v-else
                          type="button"
                          class="home__calendar-day btn-reset"
                          :class="{
                            'home__calendar-day--today': day.isToday,
                            'home__calendar-day--selected': day.isSelected,
                          }"
                          @click="selectDate(day.date)"
                        >
                          {{ day.label }}
                        </button>
                      </template>
                    </div>
                  </div>
                </transition>
              </div>

              <div ref="timeDropdownRef" class="home__dropdown home__dropdown--time">
                <button
                  type="button"
                  class="home__dropdown-trigger home__dropdown-trigger--time btn-reset"
                  :class="{ 'home__dropdown-trigger--open': isTimeOpen }"
                  @click="toggleTimeDropdown"
                >
                  <span class="home__dropdown-label">Время</span>
                  <span class="home__dropdown-value">
                    {{ selectedTime }}
                  </span>
                  <span class="home__dropdown-icon" aria-hidden="true"></span>
                </button>
                <transition name="home-dropdown">
                  <div v-if="isTimeOpen" class="home__dropdown-panel home__dropdown-panel--time">
                    <div class="home__time-grid">
                      <button
                        v-for="time in timeOptions"
                        :key="time"
                        type="button"
                        class="home__time-chip btn-reset"
                        :class="{ 'home__time-chip--selected': selectedTime === time }"
                        @click="selectTime(time)"
                      >
                        {{ time }}
                      </button>
                    </div>
                  </div>
                </transition>
              </div>
            </div>

            <button class="home__submit-button btn-reset">Отправить</button>

            <div class="home__contact">
              <IconPhone class="home__icon home__icon--phone" />
              <span>Свяжемся и ответим на вопросы по тренировкам и соревнованиям</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import IconPhone from '@/assets/images/icon-phone.svg'
import IconSwimmer from '@/assets/images/icon-swimmer.svg'
import { publicAsset } from '@/utils/publicAsset'

const isDateOpen = ref(false)
const isTimeOpen = ref(false)
const isIntroReady = ref(false)
const heroVideo = publicAsset('/videos/01-video.mp4')
const dateDropdownRef = ref(null)
const timeDropdownRef = ref(null)
let introAnimationFrame = 0
const today = new Date()
today.setHours(0, 0, 0, 0)
const calendarMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const timeOptions = computed(() => {
  const times = []

  for (let i = 9; i <= 19; i++) {
    for (let j = 0; j < 60; j += 30) {
      if (i === 19 && j > 0) {
        break
      }

      const hour = String(i).padStart(2, '0')
      const minute = String(j).padStart(2, '0')
      times.push(`${hour}:${minute}`)
    }
  }

  return times
})

const selectedDate = ref(new Date(today))
selectedDate.value.setHours(0, 0, 0, 0)
const selectedTime = ref(getInitialTime())

function formatTriggerDate(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}`
}

function getInitialTime() {
  const now = new Date()
  const roundedMinutes = now.getMinutes() <= 30 ? 30 : 0
  const roundedHour = now.getMinutes() <= 30 ? now.getHours() : now.getHours() + 1
  const normalizedHour = Math.min(Math.max(roundedHour, 8), 20)
  const normalizedMinutes = normalizedHour === 20 ? 0 : roundedMinutes
  const initialTime = `${String(normalizedHour).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}`

  return timeOptions.value.includes(initialTime) ? initialTime : timeOptions.value[0]
}

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
      isToday: date.getTime() === today.getTime(),
      isSelected: selectedDate.value?.getTime() === date.getTime(),
    })
  }

  return days
})

function toggleDateDropdown() {
  isDateOpen.value = !isDateOpen.value
  isTimeOpen.value = false
}

function toggleTimeDropdown() {
  isTimeOpen.value = !isTimeOpen.value
  isDateOpen.value = false
}

function selectDate(date) {
  selectedDate.value = new Date(date)
  selectedDate.value.setHours(0, 0, 0, 0)
  isDateOpen.value = false
}

function selectTime(time) {
  selectedTime.value = time
  isTimeOpen.value = false
}

function changeCalendarMonth(direction) {
  calendarMonth.value = new Date(
    calendarMonth.value.getFullYear(),
    calendarMonth.value.getMonth() + direction,
    1,
  )
}

function handleOutsideClick(event) {
  if (dateDropdownRef.value && !dateDropdownRef.value.contains(event.target)) {
    isDateOpen.value = false
  }

  if (timeDropdownRef.value && !timeDropdownRef.value.contains(event.target)) {
    isTimeOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  introAnimationFrame = window.requestAnimationFrame(() => {
    introAnimationFrame = window.requestAnimationFrame(() => {
      isIntroReady.value = true
    })
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)

  if (introAnimationFrame) {
    window.cancelAnimationFrame(introAnimationFrame)
  }
})
</script>

<style scoped>
.home {
  --intro-duration: 1s;
  --intro-ease: cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  left: 50%;
  width: 100vw;
  min-height: var(--app-screen-height);
  margin-left: -50vw;
  overflow: hidden;
  isolation: isolate;
  content-visibility: auto;
  contain: layout paint style;
  contain-intrinsic-size: 920px;
}

.home__video-player,
.home__backdrop,
.home__overlay {
  position: absolute;
  inset: 0;
}

.home__video-player {
  top: 50%;
  left: 50%;
  width: max(100vw, 100%);
  height: max(var(--app-screen-height), 100%);
  min-width: 112%;
  min-height: 112%;
  object-fit: cover;
  transform: translate(-50%, -50%);
}

.home__backdrop {
  background: color-mix(in srgb, var(--black) 48%, transparent);
  z-index: 0;
}

.home__overlay {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: stretch;
  width: 100%;
  min-height: var(--app-screen-height);
  padding: 0px 0 50px;
}

.home__shell {
  display: flex;
  align-items: stretch;
}

.home__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 380px);
  align-items: center;
  gap: 28px;
  width: 100%;
}

.home__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  min-height: min(660px, calc(var(--app-screen-height) - 156px));
  padding: 20px 0;
  color: var(--white);
}

.home__intro-item {
  opacity: 0;
  transform: translate3d(0, 34px, 0) scale(0.985);
  filter: blur(12px);
  will-change: transform, opacity, filter;
  transition:
    opacity var(--intro-duration) var(--intro-ease),
    transform var(--intro-duration) var(--intro-ease),
    filter calc(var(--intro-duration) * 0.85) ease;
  transition-delay: var(--intro-delay, 0s);
}

.home--intro-ready .home__intro-item {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
  filter: blur(0);
}

.home__brand {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  width: fit-content;
  max-width: 100%;
  padding: 12px 16px;
  margin-bottom: 5px;
  border: 1px solid color-mix(in srgb, var(--white) 18%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 10%, transparent);
}

.home__brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 12%, transparent);
}

.home__brand-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.home__eyebrow,
.home__brand-subtitle,
.home__description,
.home__meta-label,
.home__meta-value,
.home__form-eyebrow,
.home__form-text,
.home__label,
.home__dropdown-label,
.home__contact {
  margin: 0;
}

.home__eyebrow,
.home__form-eyebrow {
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.home__eyebrow {
  color: color-mix(in srgb, var(--aqua) 78%, var(--white));
}

.home__brand-subtitle {
  color: color-mix(in srgb, var(--white) 72%, transparent);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
}

.home__heading {
  display: flex;
  flex-direction: column;
  /* gap: 8px; */
  max-width: 620px;
}

.home__title,
.home__title-line {
  margin: 0;
  font-family: Oswald;
  font-weight: 700;
  line-height: 0.94;
  text-transform: uppercase;
  text-wrap: balance;
}

.home__title {
  font-size: clamp(48px, 7.2vw, 94px);
  color: var(--white);
  transform-origin: left center;
}

.home__title-line {
  font-size: clamp(26px, 3.6vw, 48px);
  color: color-mix(in srgb, var(--aqua) 82%, var(--white));
  transform-origin: left center;
}

.home__description {
  max-width: 540px;
  font-size: clamp(15px, 1.3vw, 18px);
  font-weight: 700;
  line-height: 1.55;
  color: color-mix(in srgb, var(--white) 84%, transparent);
}

.home__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.home__meta-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 200px;
  padding: 16px 18px;
  border: 1px solid color-mix(in srgb, var(--white) 16%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 10%, transparent);
}

.home__meta-label {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--white) 66%, transparent);
}

.home__meta-value {
  font-size: 17px;
  font-weight: 900;
  line-height: 1.2;
  color: var(--white);
}

.home__form {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  box-shadow: 0 24px 60px color-mix(in srgb, var(--black) 18%, transparent);
  z-index: 10;
}

.home__form-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 4px;
}

.home__form-eyebrow {
  color: color-mix(in srgb, var(--cyan) 72%, var(--black));
}

.home__form-title {
  margin: 0;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.05;
  color: var(--cyan);
  text-wrap: balance;
}

.home__form-text {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  color: color-mix(in srgb, var(--black) 62%, var(--white));
}

.home__label {
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 60%, var(--white));
}

.home__input {
  width: 100%;
  min-height: 48px;
  padding: 0 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 24%, var(--white));
  border-radius: 10px;
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  color: var(--black);
  background: color-mix(in srgb, var(--white) 84%, transparent);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.home__input::placeholder {
  color: color-mix(in srgb, var(--black) 42%, var(--white));
}

.home__input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--cyan) 54%, var(--white));
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--cyan) 18%, transparent);
}

.home__datetime {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.home__dropdown {
  position: relative;
}

.home__dropdown--date,
.home__dropdown--time {
  position: static;
}

.home__dropdown-trigger {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  min-height: 110px;
  padding: 14px 16px 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 24%, var(--white));
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 82%, transparent);
  color: var(--black);
  text-align: left;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.home__dropdown-trigger:hover,
.home__dropdown-trigger--open {
  border-color: color-mix(in srgb, var(--cyan) 64%, var(--white));
}

.home__dropdown-label {
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 54%, var(--white));
}

.home__dropdown-value {
  font-family: Oswald, sans-serif;
  font-size: clamp(28px, 2.4vw, 40px);
  font-weight: 700;
  line-height: 1;
  color: var(--black);
}

.home__dropdown-icon {
  position: absolute;
  right: 18px;
  bottom: 20px;
  width: 12px;
  height: 12px;
  border-right: 2px solid var(--black);
  border-bottom: 2px solid var(--black);
  transform: rotate(45deg);
  transition: transform 0.2s ease;
  pointer-events: none;
}

.home__dropdown-trigger--open .home__dropdown-icon {
  transform: rotate(-135deg) translateY(-2px);
}

.home__dropdown-panel {
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  right: 0;
  padding: 20px;

  border: 1px solid color-mix(in srgb, var(--white) 34%, transparent);
  border-radius: 10px;
  box-shadow: 0 18px 40px color-mix(in srgb, var(--black) 14%, transparent);
  overflow-y: auto;
  z-index: 30;
}

.home__dropdown-panel--date {
  top: 0;
  left: auto;
  right: calc(100% + 16px);
  width: 340px;
  max-width: none;
  max-height: none;
}

.home__dropdown-panel--time {
  top: 0;
  left: auto;
  right: calc(100% + 16px);
  width: max-content;
  max-width: none;
  max-height: none;
}

.home__dropdown-head {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 12px;
}

.home__dropdown-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--cyan);
}

.home__dropdown-caption {
  font-size: 12px;
  font-weight: 700;
  color: color-mix(in srgb, var(--black) 58%, var(--white));
}

.home__calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.home__calendar-title-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  gap: 4px;
  text-align: center;
}

.home__calendar-arrow {
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
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.home__calendar-arrow:hover {
  background: color-mix(in srgb, var(--white) 48%, transparent);
}

.home__calendar-arrow-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  line-height: 1;
  transform: translateY(-1px);
}

.home__calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 8px;
}

.home__calendar-weekday {
  display: flex;
  justify-content: center;
  padding: 4px 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 52%, var(--white));
}

.home__calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.home__calendar-day {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
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

.home__calendar-day:hover {
  border-color: color-mix(in srgb, var(--cyan) 64%, var(--white));
  background: color-mix(in srgb, var(--cyan) 60%, transparent);
  color: var(--white);
}

.home__calendar-day-placeholder {
  aspect-ratio: 1;
}

.home__calendar-day--today {
  border-color: color-mix(in srgb, var(--cyan) 58%, var(--white));
}

.home__calendar-day--selected {
  background: rgb(from var(--cyan) r g b / 76%);
  border-color: rgb(from var(--cyan) r g b / 72%);
  color: var(--white);
}

.home__time-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.home__time-chip {
  min-height: 36px;
  padding: 8px 10px;
  border: 1px solid rgb(from var(--white) r g b / 18%);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 18%, transparent);
  background-clip: padding-box;
  font-size: 13px;
  font-weight: 800;
  color: var(--black);
  text-align: center;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.home__time-chip:hover {
  border-color: color-mix(in srgb, var(--cyan) 64%, var(--white));
  background: color-mix(in srgb, var(--cyan) 60%, transparent);
  color: var(--white);
}

.home__time-chip--selected {
  background: rgb(from var(--cyan) r g b / 76%);
  border-color: rgb(from var(--cyan) r g b / 72%);
  color: var(--white);
}

.home__submit-button {
  --button-bg: var(--button-orange-bg);
  --button-hover-bg: var(--button-orange-hover-bg);
  --button-focus-color: var(--orange);
  --button-text: var(--black);
  margin-top: 8px;
  min-height: 52px;
  padding: 12px 18px;
  border-radius: 10px;
  background-color: var(--button-current-bg, var(--button-bg));
  border: none;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--button-text);
}

.home__contact {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.45;
  color: color-mix(in srgb, var(--black) 68%, var(--white));
}

.home__icon {
  flex-shrink: 0;
  color: var(--orange);
}

.home__icon--phone {
  transform: none;
}

.home__icon--swimmer {
  width: 28px;
  height: 28px;
  stroke: var(--orange);
}

.home-dropdown-enter-active,
.home-dropdown-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.home-dropdown-enter-from,
.home-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (prefers-reduced-motion: reduce) {
  .home__intro-item,
  .home--intro-ready .home__intro-item {
    opacity: 1;
    filter: none;
    transform: none;
    transition: none;
  }
}

@media (max-width: 1316px) {
  .home__dropdown-trigger {
    background: color-mix(in srgb, var(--white) 96%, var(--very-light-blue) 4%);
  }

  .home__dropdown-panel {
    background: color-mix(in srgb, var(--white) 98%, var(--very-light-blue) 2%);
  }
}

@media (max-width: 768px) {
  .home {
    --intro-duration: 0.72s;
  }

  .home__input {
    font-size: 16px;
  }

  .home__overlay {
    padding: 20px 0 30px;
  }

  .home__grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .home__content {
    min-height: auto;
    gap: 20px;
    padding: 0;
  }

  .home__brand {
    width: 100%;
    padding: 14px 16px;
  }

  .home__title {
    font-size: clamp(42px, 14vw, 70px);
  }

  .home__title-line {
    font-size: clamp(22px, 7vw, 38px);
  }

  .home__description {
    font-size: 16px;
  }

  .home__meta {
    display: grid;
    grid-template-columns: 1fr;
  }

  .home__form {
    padding: 20px 18px;
    border-radius: 10px;
  }

  .home__datetime {
    grid-template-columns: 1fr;
  }

  .home__dropdown--date,
  .home__dropdown--time {
    position: relative;
  }

  .home__dropdown-panel {
    top: auto;
    bottom: calc(100% + 12px);
    left: 0;
    right: 0;
    z-index: 20;
  }

  .home__dropdown-panel--date,
  .home__dropdown-panel--time {
    top: auto;
    bottom: calc(100% + 12px);
    left: 0;
    right: 0;
    width: 100%;
    max-width: 100%;
  }

  .home__time-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>

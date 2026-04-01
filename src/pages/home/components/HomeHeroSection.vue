<template>
  <section ref="homeSectionRef" class="home container flex">
    <div class="home__intro flex">
      <div class="home__logo">
        <IconSwimmer class="home__icon home__icon--swimmer" />
      </div>
      <div class="home__heading flex">
        <h1 class="home__title">Smart Swim</h1>
        <h2 class="home__subtitle">Школа плаванья для детей и взрослых</h2>
      </div>
      <div class="home__contacts">
        <IconPhone class="home__icon home__icon--phone" />
      </div>
    </div>
    <div class="home__main flex">
      <div class="home__video">
        <video autoplay muted loop playsinline preload="metadata" class="home__video-player">
          <source src="/videos/01-video.mp4" type="video/mp4" />
          Ваш браузер не поддерживает видео.
        </video>
      </div>
      <form class="home__form flex">
        <div class="home__form-title">Запланировать консультацию</div>
        <label class="home__label" for="name">Имя:</label>
        <input class="home__input" type="text" id="name" placeholder="Введите имя" />
        <label class="home__label" for="phone">Телефон:</label>
        <input class="home__input" type="tel" id="phone" placeholder="Введите номер телефона" />
        <div class="home__datetime flex">
          <div ref="dateDropdownRef" class="home__dropdown home__dropdown--date">
            <button
              type="button"
              class="home__dropdown-trigger home__dropdown-trigger--date btn-reset"
              :class="{ 'home__dropdown-trigger--open': isDateOpen }"
              @click="toggleDateDropdown"
            >
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
                  <span v-for="weekday in weekDays" :key="weekday" class="home__calendar-weekday">
                    {{ weekday }}
                  </span>
                </div>
                <div class="home__calendar-grid">
                  <template v-for="day in calendarDays" :key="day.key">
                    <span v-if="day.isPlaceholder" class="home__calendar-day-placeholder"></span>
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
      </form>
    </div>
    <div class="home__header-wrapper">
      <header
        ref="headerRef"
        class="home__header flex"
        :class="{ 'home__header--stopped': isHeaderStopped }"
        :style="headerStyle"
      >
        <div class="home__nav-brand" :class="{ 'home__nav-brand--visible': isHeaderFloating }">
          <button
            type="button"
            class="home__nav-home btn-reset"
            :tabindex="isHeaderFloating ? 0 : -1"
            @click="scrollToTop"
          >
            Главная
          </button>
        </div>
        <ul class="home__nav-menu list-reset flex">
          <li class="home__nav-item">
            <RouterLink class="home__nav-link link-reset" to="/competitions"
              >Соревнования</RouterLink
            >
          </li>
          <li class="home__nav-item">
            <RouterLink class="home__nav-link link-reset" to="/fees">Сборы</RouterLink>
          </li>
          <li class="home__nav-item">
            <RouterLink class="home__nav-link link-reset" to="/documents">Документы</RouterLink>
          </li>
          <li class="home__nav-item">
            <RouterLink class="home__nav-link link-reset" to="/trainers">Тренеры</RouterLink>
          </li>
          <li class="home__nav-item">
            <RouterLink class="home__nav-link link-reset" to="/contacts">Контакты</RouterLink>
          </li>
        </ul>
        <button class="home__login-button btn-reset">Личный кабинет</button>
      </header>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import IconPhone from '@/assets/images/icon-phone.svg'
import IconSwimmer from '@/assets/images/icon-swimmer.svg'

const isDateOpen = ref(false)
const isTimeOpen = ref(false)
const isHeaderFloating = ref(false)
const homeSectionRef = ref(null)
const headerRef = ref(null)
const dateDropdownRef = ref(null)
const timeDropdownRef = ref(null)
const isHeaderStopped = ref(false)
const headerStyle = ref({
  top: 'auto',
  bottom: '20px',
})
const headerMetrics = {
  revealPoint: 0,
  stopScrollY: Number.POSITIVE_INFINITY,
  maxHeaderTop: 0,
}
let reviewsSectionRef = null
let scrollFrameId = 0
let resizeFrameId = 0
let resizeObserver = null
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

function handleScroll() {
  if (scrollFrameId) {
    return
  }

  scrollFrameId = window.requestAnimationFrame(() => {
    scrollFrameId = 0
    updateHeaderPosition()
  })
}

function updateHeaderPosition() {
  if (!homeSectionRef.value) {
    isHeaderFloating.value = false
    return
  }

  const scrollY = window.scrollY
  isHeaderFloating.value = scrollY >= headerMetrics.revealPoint

  const shouldStopHeader =
    reviewsSectionRef && Number.isFinite(headerMetrics.stopScrollY)
      ? scrollY >= headerMetrics.stopScrollY
      : false

  if (shouldStopHeader === isHeaderStopped.value) {
    return
  }

  isHeaderStopped.value = shouldStopHeader

  const nextStyle = shouldStopHeader
    ? {
        top: `${headerMetrics.maxHeaderTop}px`,
        bottom: 'auto',
      }
    : {
        top: 'auto',
        bottom: '20px',
      }

  if (headerStyle.value.top !== nextStyle.top || headerStyle.value.bottom !== nextStyle.bottom) {
    headerStyle.value = nextStyle
  }
}

function recalculateHeaderMetrics() {
  if (!homeSectionRef.value || !headerRef.value) {
    return
  }

  if (!reviewsSectionRef) {
    reviewsSectionRef = document.querySelector('.reviews')
  }

  if (!reviewsSectionRef) {
    headerMetrics.revealPoint =
      homeSectionRef.value.offsetTop + homeSectionRef.value.offsetHeight * 0.75
    headerMetrics.stopScrollY = Number.POSITIVE_INFINITY
    headerMetrics.maxHeaderTop = 0
    isHeaderStopped.value = false
    return
  }

  const headerHeight = headerRef.value.offsetHeight
  const reviewsBottom = reviewsSectionRef.offsetTop + reviewsSectionRef.offsetHeight

  headerMetrics.revealPoint =
    homeSectionRef.value.offsetTop + homeSectionRef.value.offsetHeight * 0.75
  headerMetrics.stopScrollY = reviewsBottom - window.innerHeight
  headerMetrics.maxHeaderTop = reviewsBottom - headerHeight - 20
  isHeaderStopped.value = false
}

function handleResize() {
  if (resizeFrameId) {
    return
  }

  resizeFrameId = window.requestAnimationFrame(() => {
    resizeFrameId = 0
    recalculateHeaderMetrics()
    updateHeaderPosition()
  })
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

onMounted(() => {
  reviewsSectionRef = document.querySelector('.reviews')
  document.addEventListener('click', handleOutsideClick)
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize)

  if (window.ResizeObserver) {
    resizeObserver = new window.ResizeObserver(() => {
      handleResize()
    })

    if (homeSectionRef.value) {
      resizeObserver.observe(homeSectionRef.value)
    }

    if (headerRef.value) {
      resizeObserver.observe(headerRef.value)
    }

    if (reviewsSectionRef) {
      resizeObserver.observe(reviewsSectionRef)
    }
  }

  nextTick(() => {
    handleResize()
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)

  if (scrollFrameId) {
    window.cancelAnimationFrame(scrollFrameId)
  }

  if (resizeFrameId) {
    window.cancelAnimationFrame(resizeFrameId)
  }

  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<style scoped>
.home {
  height: 100vh;
  flex-direction: column;
  justify-content: space-between;
}

.home__intro {
  align-items: center;
  justify-content: space-between;
}

.home__logo {
  max-width: 50px;
}

.home__heading {
  margin-bottom: 20px;
  flex-direction: column;
  align-items: center;
}

.home__title {
  font-size: 36px;
  margin: 0;
  font-weight: 900;
}

.home__subtitle {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.home__icon {
  color: var(--orange);
}

.home__icon--phone {
  transform: scaleX(-1);
}

.home__icon--swimmer {
  stroke: var(--orange);
}

.home__main {
  margin-bottom: 50px;
  max-width: 100%;
  justify-content: center;
  position: relative;
  align-items: center;
}

.home__video {
  position: relative;
  max-height: 480px;
  border-radius: 10px;
  overflow: hidden;
}

.home__video::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.home__video-player {
  max-height: 480px;
  border-radius: 10px;
}

.home__form {
  position: absolute;
  top: 27.5px;
  right: -110px;
  flex-direction: column;
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--white) 72%, transparent) 0%,
    color-mix(in srgb, var(--very-light-blue) 66%, transparent) 100%
  );
  border-radius: 10px;
  padding: 20px;
  border: 1px solid color-mix(in srgb, var(--cyan) 34%, var(--white));
  backdrop-filter: blur(14px);
  box-shadow: none;
}

.home__form-title {
  margin: 0 0 15px;
  font-size: 18px;
  font-weight: 800;
  color: var(--black);
}

.home__label {
  font-size: 12px;
  margin-bottom: 5px;
  color: var(--black);
}

.home__input {
  padding: 5px;
  margin-bottom: 15px;
  border: 1px solid color-mix(in srgb, var(--cyan) 24%, var(--white));
  border-radius: 5px;
  font-size: 14px;
  background: color-mix(in srgb, var(--white) 82%, transparent);
  backdrop-filter: blur(10px);
}

.home__input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--cyan) 54%, var(--white));
  box-shadow: none;
}

.home__datetime {
  gap: 10px;
}

.home__dropdown {
  position: relative;
}

.home__dropdown--date,
.home__dropdown--time {
  position: static;
  flex: 1;
}

.home__dropdown-trigger {
  position: relative;
  width: 100%;
  height: 133.83px;
  padding: 20px 0;
  background: color-mix(in srgb, var(--white) 82%, transparent);
  border: 1px solid color-mix(in srgb, var(--cyan) 24%, var(--white));
  border-radius: 10px;
  backdrop-filter: blur(10px);
  color: var(--black);
  cursor: pointer;
  text-align: center;
  transition: border-color 0.2s ease;
}

.home__dropdown-trigger:hover,
.home__dropdown-trigger--open {
  border-color: color-mix(in srgb, var(--cyan) 60%, transparent);
}

.home__dropdown-trigger--time {
  font-size: 22px;
}

.home__dropdown-value {
  font-family: Oswald;
  max-width: 58px;
  font-size: 50px;
  font-weight: 700;
  color: var(--black);
}

.home__dropdown-icon {
  position: absolute;
  bottom: 16px;
  right: 50%;
  width: 10px;
  height: 10px;
  border-right: 2px solid var(--black);
  border-bottom: 2px solid var(--black);
  transform: rotate(45deg) translateX(50%);
  transition: transform 0.2s ease;
  pointer-events: none;
}

.home__dropdown-trigger--open .home__dropdown-icon {
  transform: rotate(-135deg);
}

.home__dropdown-panel {
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--white) 70%, transparent) 0%,
    color-mix(in srgb, var(--very-light-blue) 52%, transparent) 100%
  );
  border: 1px solid color-mix(in srgb, var(--white) 28%, transparent);
  border-radius: 10px;
  backdrop-filter: blur(14px);
  overflow-y: auto;
  z-index: 15;
}

.home__dropdown-panel--date {
  top: 0;
  left: auto;
  right: calc(100% + 20px);
  width: 340px;
  max-height: none;
}

.home__dropdown-panel--time {
  width: max-content;
  top: 0;
  left: auto;
  right: calc(100% + 20px);
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
  color: var(--black);
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
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--white) 34%, transparent) 0%,
    color-mix(in srgb, var(--very-light-blue) 28%, transparent) 100%
  );
  backdrop-filter: blur(10px);
  font-size: 24px;
  line-height: 36px;
  color: var(--black);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.home__calendar-arrow:hover {
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--white) 42%, transparent) 0%,
    color-mix(in srgb, var(--very-light-blue) 34%, transparent) 100%
  );
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
  font-size: 14px;
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
  max-width: max-content;
  min-height: 30px;
  padding: 10px;
  border: 1px solid rgb(from var(--white) r g b / 18%);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 18%, transparent);
  background-clip: padding-box;
  overflow: hidden;
  font-size: 14px;
  font-weight: 800;
  color: var(--black);
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
  margin-top: 20px;
  padding: 15px 20px;
  background: color-mix(in srgb, var(--cyan) 82%, var(--white));
  border: none;
  border-radius: 10px;
  font-size: 15px;
  color: var(--white);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.home__submit-button:hover {
  background-color: color-mix(in srgb, var(--cyan) 94%, var(--white));
}

.home__header {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
  width: max-content;
  padding: 5px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--white) 18%, transparent) 0%,
    color-mix(in srgb, var(--cyan) 18%, transparent) 100%
  );
  backdrop-filter: blur(10px);
  box-shadow: none;
  gap: 20px;
  z-index: 100;
}

.home__header--stopped {
  position: absolute;
}

.home__nav-brand {
  flex-shrink: 0;
  max-width: 0;
  padding: 15px 0;
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--cyan) 34%, transparent) 0%,
    color-mix(in srgb, var(--light-blue) 24%, transparent) 100%
  );
  border-radius: 10px;
  overflow: hidden;
  box-shadow: none;
  transform-origin: right center;
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
  transition:
    max-width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    padding 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    opacity 0.35s ease,
    transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform: scaleX(0.01);
}

.home__nav-brand--visible {
  max-width: 160px;
  padding: 15px 30px;
  opacity: 1;
  pointer-events: auto;
  transform: scaleX(1);
}

.home__nav-home {
  display: block;
  width: 100%;
  font-size: 15px;
  font-weight: 500;
  color: var(--black);
  white-space: nowrap;
}

.home__nav-menu {
  height: 100%;
  align-items: center;
  gap: 20px;
  padding: 0 30px;
  background: transparent;
  border-radius: 10px;
  box-shadow: none;
}

.home__nav-link {
  position: relative;
  font-size: 15px;
  font-weight: 500;
  color: var(--black);
  transition: opacity 0.2s ease;
}

.home__nav-link::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -4px;
  left: 0;
  height: 1px;
  background-color: var(--black);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.2s ease;
}

.home__nav-link:hover {
  color: var(--black);
}

.home__nav-link:hover::after {
  transform: scaleX(1);
}

.home__login-button {
  appearance: none;
  -webkit-appearance: none;
  padding: 15px 30px;
  background-color: color-mix(in srgb, var(--orange) 78%, transparent);
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  color: var(--black);
  cursor: pointer;
  outline: none;
  filter: none;
  box-shadow: none;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.home__login-button:hover {
  background-color: color-mix(in srgb, var(--orange) 88%, transparent);
  color: var(--white);
}

.home__login-button:focus,
.home__login-button:focus-visible,
.home__login-button:active {
  outline: none;
  filter: none;
  box-shadow: none;
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

@media (max-width: 768px) {
  .home__datetime {
    flex-direction: column;
  }

  .home__dropdown {
    flex-basis: 100%;
  }

  .home__dropdown-trigger {
    width: 100%;
  }

  .home__dropdown-panel--date,
  .home__dropdown-panel--time {
    right: 0;
    width: 100%;
  }

  .home__time-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home__header-wrapper {
    position: sticky;
    bottom: 20px;
  }

  .home__header {
    position: relative;
  }

  .home__header--stopped {
    position: relative;
  }
}
</style>

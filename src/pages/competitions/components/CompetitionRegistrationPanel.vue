<template>
  <Teleport to="body">
    <Transition name="competition-registration-modal">
      <div
        v-if="open && card"
        class="competition-registration"
        :class="`competition-registration--${state.mode}`"
        @click.self="emit('close')"
      >
        <div
          ref="dialogRef"
          class="competition-registration__dialog"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
        >
          <button
            type="button"
            class="competition-registration__close btn-reset"
            aria-label="Закрыть окно регистрации"
            @click="emit('close')"
          >
            <span></span>
            <span></span>
          </button>

          <div class="competition-registration__shell">
            <div class="competition-registration__main">
              <div class="competition-registration__head">
                <span class="competition-registration__eyebrow">Регистрация этапа</span>
                <h2 class="competition-registration__title">{{ card.title }}</h2>
                <p class="competition-registration__subtitle">
                  {{ card.date }}<span v-if="card.place"> · {{ card.place }}</span>
                </p>
              </div>

              <div class="competition-registration__status">
                <template v-if="state.mode === 'upcoming'">
                  <p class="competition-registration__status-copy">
                    Регистрация на соревнования откроется через
                  </p>

                  <div
                    class="competition-registration__timer"
                    aria-label="Таймер до открытия регистрации"
                  >
                    <div
                      v-for="part in countdownParts"
                      :key="part.label"
                      class="competition-registration__timer-block"
                    >
                      <span class="competition-registration__timer-number">{{ part.value }}</span>
                      <span class="competition-registration__timer-label">{{ part.label }}</span>
                    </div>
                  </div>

                  <p class="competition-registration__meta">
                    Регистрация откроется <span>{{ state.openDateLabel }}</span>
                  </p>
                  <p class="competition-registration__meta">
                    Соревнования состоятся <span>{{ state.competitionDateLabel }}</span>
                  </p>
                  <p v-if="state.closeNote" class="competition-registration__badge">
                    {{ state.closeNote }}
                  </p>
                </template>

                <template v-else-if="state.mode === 'open'">
                  <p class="competition-registration__status-copy">Регистрация открыта</p>
                  <p class="competition-registration__meta">
                    Соревнования состоятся <span>{{ state.competitionDateLabel }}</span>
                  </p>
                  <p v-if="state.closeNote" class="competition-registration__badge">
                    {{ state.closeNote }}
                  </p>
                </template>

                <template v-else>
                  <p class="competition-registration__status-copy">
                    {{ state.closedTitle }}
                  </p>
                  <p class="competition-registration__meta">{{ state.competitionDateLabel }}</p>
                  <p v-if="state.closedText" class="competition-registration__badge">
                    {{ state.closedText }}
                  </p>
                </template>
              </div>

              <div class="competition-registration__actions">
                <a
                  v-if="positionUrl"
                  class="competition-registration__action competition-registration__action--position"
                  :href="positionUrl"
                  target="_blank"
                  rel="noreferrer"
                >
                  Положение
                </a>

                <RouterLink
                  v-if="documentsRoute"
                  class="competition-registration__action competition-registration__action--documents"
                  :to="documentsRoute"
                >
                  Документы
                </RouterLink>

                <button
                  v-if="state.mode === 'open'"
                  type="button"
                  class="competition-registration__action competition-registration__action--register btn-reset"
                >
                  Зарегистрироваться
                </button>
              </div>
            </div>

            <div v-if="accordionSections.length" class="competition-registration__faq">
              <CompetitionFaqAccordion variant="registration" :sections="accordionSections" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import CompetitionFaqAccordion from './CompetitionFaqAccordion.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  card: {
    type: Object,
    default: null,
  },
  competitionRegistration: {
    type: Object,
    default: () => ({}),
  },
  competitionFaqSections: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close'])

const now = ref(Date.now())
const dialogRef = ref(null)
let timerId = 0
let previousBodyOverflow = ''
let escapeListenerAttached = false

const DEFAULT_DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function parseTimestamp(value) {
  if (!value) {
    return null
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatDateLabel(value) {
  if (!value) {
    return ''
  }

  const timestamp = parseTimestamp(value)

  if (!timestamp) {
    return value
  }

  return DEFAULT_DATE_FORMAT.format(new Date(timestamp))
}

function resolveRegistration() {
  const cardRegistration = props.card?.registration ?? {}
  const sharedRegistration = props.competitionRegistration ?? {}

  const registration = {
    ...sharedRegistration,
    ...cardRegistration,
  }

  const competitionDateLabel =
    registration.competitionDateLabel || props.card?.date || formatDateLabel(registration.openAt)

  if (registration.status === 'closed') {
    return {
      mode: 'closed',
      openAt: registration.openAt || '',
      competitionDateLabel,
      closedText: registration.closedText || '',
      closedTitle: registration.closedTitle || 'Регистрация закрыта',
      openDateLabel: registration.openDateLabel || '',
      closeNote: registration.closeNote || '',
    }
  }

  if (registration.status === 'open') {
    return {
      mode: 'open',
      openAt: registration.openAt || '',
      competitionDateLabel,
      closedText: registration.closedText || '',
      openDateLabel: registration.openDateLabel || formatDateLabel(registration.openAt),
      closeNote: registration.closeNote || '',
    }
  }

  const openAt = parseTimestamp(registration.openAt)
  const closeAt = parseTimestamp(registration.closeAt)

  if (!openAt || now.value >= openAt) {
    if (closeAt && now.value >= closeAt) {
      return {
        mode: 'closed',
        openAt: registration.openAt || '',
        competitionDateLabel,
        closedText: registration.closedText || 'Регистрация завершена.',
        closedTitle: registration.closedTitle || 'Регистрация закрыта',
        openDateLabel: registration.openDateLabel || formatDateLabel(registration.openAt),
        closeNote: registration.closeNote || '',
      }
    }

    return {
      mode: 'open',
      openAt: registration.openAt || '',
      competitionDateLabel,
      closedText: registration.closedText || '',
      openDateLabel: registration.openDateLabel || formatDateLabel(registration.openAt),
      closeNote: registration.closeNote || '',
    }
  }

  return {
    mode: 'upcoming',
    openAt: registration.openAt || '',
    competitionDateLabel,
    closedText: registration.closedText || '',
    openDateLabel: registration.openDateLabel || formatDateLabel(registration.openAt),
    closeNote: registration.closeNote || '',
    countdown: buildCountdown(openAt),
  }
}

function buildCountdown(openAt) {
  const diff = Math.max(openAt - now.value, 0)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return {
    days,
    hours,
    minutes,
    seconds,
  }
}

const state = computed(() => resolveRegistration())

const countdownParts = computed(() => {
  const countdown = state.value.countdown || buildCountdown(parseTimestamp(state.value.openAt) || now.value)

  return [
    { label: 'Дней', value: pad(countdown.days) },
    { label: 'Часов', value: pad(countdown.hours) },
    { label: 'Минут', value: pad(countdown.minutes) },
    { label: 'Секунд', value: pad(countdown.seconds) },
  ]
})

const positionUrl = computed(() => props.competitionRegistration?.positionUrl || '')
const documentsRoute = computed(() => props.competitionRegistration?.documentsRoute || '/documents')
const accordionSections = computed(
  () => props.competitionRegistration?.faqSections || props.competitionFaqSections || [],
)

function syncBodyScrollLock(isLocked) {
  if (typeof document === 'undefined') {
    return
  }

  if (isLocked) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return
  }

  document.body.style.overflow = previousBodyOverflow
  previousBodyOverflow = ''
}

function handleKeydown(event) {
  if (event.key === 'Escape' && props.open) {
    emit('close')
  }
}

watch(
  () => props.open,
  (isOpen) => {
    syncBodyScrollLock(isOpen)

    if (isOpen) {
      now.value = Date.now()
      window.requestAnimationFrame(() => {
        dialogRef.value?.focus?.()
      })
    }
  },
  { immediate: true },
)

onMounted(() => {
  timerId = window.setInterval(() => {
    if (props.open) {
      now.value = Date.now()
    }
  }, 1000)

  window.addEventListener('keydown', handleKeydown)
  escapeListenerAttached = true
})

onBeforeUnmount(() => {
  if (timerId) {
    window.clearInterval(timerId)
    timerId = 0
  }

  if (escapeListenerAttached) {
    window.removeEventListener('keydown', handleKeydown)
    escapeListenerAttached = false
  }

  syncBodyScrollLock(false)
})
</script>

<style scoped>
.competition-registration {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(180deg, #0d1e303d, #0d1e3070), color-mix(in srgb, var(--light-blue) 18%, transparent);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  z-index: 260;
}

.competition-registration__dialog {
  position: relative;
  width: min(80vw, 1120px);
  height: min(80vh, 820px);
  padding: 22px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 10%, transparent);
  box-shadow: 0 24px 60px color-mix(in srgb, var(--black) 18%, transparent);
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
  overflow: hidden;
  outline: none;
}

.competition-registration__close {
  position: absolute;
  top: 18px;
  right: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 10px;
  background: var(--white);
  box-shadow: 0 8px 20px rgb(from var(--black) r g b / 10%);
  z-index: 2;
}

.competition-registration__close span {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--black);
}

.competition-registration__close span:first-child {
  transform: translate(-50%, -50%) rotate(45deg);
}

.competition-registration__close span:last-child {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.competition-registration__shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  gap: 22px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 6px 8px;
}

.competition-registration__main {
  display: grid;
  gap: 18px;
  width: min(100%, 75%);
  margin-inline: auto;
  padding-top: 20px;
}

.competition-registration__head {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding-right: 56px;
  padding-left: 56px;
  text-align: center;
}

.competition-registration__eyebrow {
  display: inline-flex;
  align-self: center;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 56%, var(--white));
}

.competition-registration__title {
  margin: 0;
  font-family: Oswald;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 0.94;
  text-transform: uppercase;
  text-align: center;
}

.competition-registration__subtitle {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

.competition-registration__status {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  min-height: clamp(190px, 26vh, 300px);
  padding: clamp(28px, 4vh, 42px) 18px;
  border: 1px solid color-mix(in srgb, var(--white) 28%, transparent);
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 42%);
  text-align: center;
}

.competition-registration__status-copy {
  margin: 0;
  font-family: Oswald;
  font-size: clamp(22px, 3vw, 30px);
  line-height: 1;
  text-transform: uppercase;
  text-align: center;
}

.competition-registration__timer {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  width: min(100%, 560px);
}

.competition-registration__timer-block {
  display: grid;
  gap: 6px;
  padding: 14px 10px;
  border: 1px solid color-mix(in srgb, var(--cyan) 28%, var(--white));
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 68%, transparent);
  text-align: center;
}

.competition-registration__timer-number {
  font-family: Oswald;
  font-size: clamp(24px, 4vw, 34px);
  line-height: 1;
}

.competition-registration__timer-label {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 58%, var(--white));
}

.competition-registration__meta {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
  text-align: center;
}

.competition-registration__meta span {
  font-weight: 900;
}

.competition-registration__badge {
  margin: 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--orange) 16%, var(--white));
  font-size: 14px;
  font-weight: 800;
  line-height: 1.5;
  text-align: center;
}

.competition-registration__actions {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.competition-registration__faq {
  display: grid;
  gap: 16px;
  width: min(100%, 75%);
  margin-top: 4px;
  padding: 18px 0 8px;
  border-top: 1px solid color-mix(in srgb, var(--white) 22%, transparent);
}

.competition-registration__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: auto;
  max-width: max-content;
  min-height: 47px;
  padding: 11px 24px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: center;
  text-decoration: none;
  white-space: nowrap;
}

.competition-registration__action--position {
  --button-bg: var(--button-cyan-bg);
  --button-hover-bg: var(--button-cyan-hover-bg);
  --button-focus-color: var(--cyan);
  --button-text: var(--black);
  background-color: var(--button-current-bg, var(--button-bg));
  color: var(--button-text);
}

.competition-registration__action--documents {
  --button-bg: var(--button-light-blue-bg);
  --button-hover-bg: var(--button-light-blue-hover-bg);
  --button-focus-color: var(--light-blue);
  --button-text: var(--black);
  background-color: var(--button-current-bg, var(--button-bg));
  color: var(--button-text);
}

.competition-registration__action--register {
  --button-bg: var(--button-orange-bg);
  --button-hover-bg: var(--button-orange-hover-bg);
  --button-focus-color: var(--orange);
  --button-text: var(--black);
  background-color: var(--button-current-bg, var(--button-bg));
  color: var(--button-text);
}

.competition-registration-modal-enter-active,
.competition-registration-modal-leave-active {
  transition: opacity 0.24s ease;
}

.competition-registration-modal-enter-active .competition-registration__dialog,
.competition-registration-modal-leave-active .competition-registration__dialog {
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.competition-registration-modal-enter-from,
.competition-registration-modal-leave-to {
  opacity: 0;
}

.competition-registration-modal-enter-from .competition-registration__dialog,
.competition-registration-modal-leave-to .competition-registration__dialog {
  opacity: 0;
  transform: translateY(22px) scale(0.98);
}

@media (max-width: 768px) {
  .competition-registration {
    padding: 12px;
  }

  .competition-registration__dialog {
    width: min(92vw, 100%);
    height: min(90vh, 100%);
    padding: 18px;
  }

  .competition-registration__timer {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .competition-registration__actions {
    flex-direction: column;
  }

  .competition-registration__action {
    width: 100%;
    max-width: none;
  }

  .competition-registration__main {
    width: 100%;
    padding-top: 18px;
  }

  .competition-registration__faq {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .competition-registration__status {
    padding: 16px;
  }

  .competition-registration__timer {
    grid-template-columns: 1fr;
  }
}
</style>

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const DEFAULT_DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function useCompetitionRegistrationPanel(props, emit) {
  const now = ref(Date.now())
  const dialogRef = ref(null)
  let timerId = 0
  let previousBodyOverflow = ''
  let escapeListenerAttached = false

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

  return {
    accordionSections,
    countdownParts,
    dialogRef,
    documentsRoute,
    positionUrl,
    state,
  }
}

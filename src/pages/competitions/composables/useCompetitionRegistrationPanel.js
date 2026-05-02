import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  formatCompetitionDateLabel,
  resolveCompetitionRegistrationState,
} from '@/utils/competitionRegistration'

export function useCompetitionRegistrationPanel(props, emit) {
  const now = ref(Date.now())
  const dialogRef = ref(null)
  let timerId = 0
  let previousBodyOverflow = ''
  let escapeListenerAttached = false

  function pad(value) {
    return String(value).padStart(2, '0')
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

  function resolveCompetitionDateLabel(registration) {
    return registration.competitionDateLabel && registration.competitionDateLabel !== '—'
      ? registration.competitionDateLabel
      : props.card?.date || formatCompetitionDateLabel(registration.openAt)
  }

  function resolveRegistration() {
    const cardRegistration = props.card?.registration ?? {}
    const sharedRegistration = props.competitionRegistration ?? {}
    const registration = {
      ...sharedRegistration,
      ...cardRegistration,
    }
    const resolvedRegistration = resolveCompetitionRegistrationState(registration)

    if (resolvedRegistration.mode === 'open') {
      return {
        ...resolvedRegistration,
        competitionDateLabel: resolveCompetitionDateLabel(resolvedRegistration),
      }
    }

    if (resolvedRegistration.mode === 'closed') {
      return {
        ...resolvedRegistration,
        competitionDateLabel: resolveCompetitionDateLabel(resolvedRegistration),
      }
    }

    const openAt = Date.parse(resolvedRegistration.openAt)

    return {
      ...resolvedRegistration,
      competitionDateLabel: resolveCompetitionDateLabel(resolvedRegistration),
      countdown: buildCountdown(Number.isNaN(openAt) ? now.value : openAt),
    }
  }

  const state = computed(() => resolveRegistration())

  const countdownParts = computed(() => {
    const countdown =
      state.value.countdown || buildCountdown(Date.parse(state.value.openAt) || now.value)

    return [
      { label: 'Дней', value: pad(countdown.days) },
      { label: 'Часов', value: pad(countdown.hours) },
      { label: 'Минут', value: pad(countdown.minutes) },
      { label: 'Секунд', value: pad(countdown.seconds) },
    ]
  })

  const positionUrl = computed(() => props.competitionRegistration?.positionUrl || '')
  const documentsRoute = computed(
    () => props.competitionRegistration?.documentsRoute || '/documents',
  )
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
        return
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

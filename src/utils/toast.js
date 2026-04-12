import { readonly, ref } from 'vue'

const DEFAULT_DURATION = 3200

const toastState = ref({
  id: 0,
  message: '',
  type: 'success',
  isVisible: false,
})

let toastTimeoutId = 0

function clearToastTimer() {
  if (!toastTimeoutId) {
    return
  }

  window.clearTimeout(toastTimeoutId)
  toastTimeoutId = 0
}

export function showToast(message, options = {}) {
  if (!message) {
    return
  }

  clearToastTimer()

  toastState.value = {
    id: Date.now(),
    message,
    type: options.type === 'error' ? 'error' : 'success',
    isVisible: true,
  }

  const duration =
    typeof options.duration === 'number' && options.duration > 0
      ? options.duration
      : DEFAULT_DURATION

  toastTimeoutId = window.setTimeout(() => {
    toastState.value = {
      ...toastState.value,
      isVisible: false,
    }
    toastTimeoutId = 0
  }, duration)
}

export function hideToast() {
  clearToastTimer()
  toastState.value = {
    ...toastState.value,
    isVisible: false,
  }
}

export function useToastState() {
  return readonly(toastState)
}

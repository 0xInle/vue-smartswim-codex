import { readonly, ref } from 'vue'
import { getUserFacingErrorMessage } from '@/utils/userFacingErrors'

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

  const isError = options.type === 'error'

  toastState.value = {
    id: Date.now(),
    message: isError ? getUserFacingErrorMessage(message) : message,
    type: isError ? 'error' : 'success',
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

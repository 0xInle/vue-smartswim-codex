export function showToast(message, options = {}) {
  void message
  void options
}

export function hideToast() {
  return undefined
}

export function useToastState() {
  return {
    value: {
      id: 0,
      message: '',
      type: 'success',
      isVisible: false,
    },
  }
}

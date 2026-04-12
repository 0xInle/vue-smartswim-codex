import { reactive, ref, watch } from 'vue'
import { signInWithPassword, updateCurrentUserPassword } from '@/utils/supabaseAuth'
import { showToast } from '@/utils/toast'
import {
  createDefaultPasswordChangeErrors,
  createDefaultPasswordChangeForm,
  createDefaultPasswordVisibility,
  MIN_PASSWORD_LENGTH,
} from '@/pages/account/utils/accountConstants'

export function useAccountPasswordChange({ currentUser }) {
  const passwordChangeStatus = ref('idle')
  const passwordChangeMessage = ref('')
  const passwordChangeForm = reactive(createDefaultPasswordChangeForm())
  const passwordChangeErrors = reactive(createDefaultPasswordChangeErrors())
  const passwordVisibility = reactive(createDefaultPasswordVisibility())

  watch(
    currentUser,
    (user) => {
      passwordChangeForm.email = user?.email || ''
    },
    { immediate: true },
  )

  function resetPasswordVisibility() {
    passwordVisibility.currentPassword = false
    passwordVisibility.newPassword = false
    passwordVisibility.confirmPassword = false
  }

  function resetPasswordChangeFeedback() {
    passwordChangeStatus.value = 'idle'
    passwordChangeMessage.value = ''
    passwordChangeErrors.email = ''
    passwordChangeErrors.currentPassword = ''
    passwordChangeErrors.newPassword = ''
    passwordChangeErrors.confirmPassword = ''
  }

  function resetPasswordChangeForm({ preserveEmail = true } = {}) {
    const nextEmail = preserveEmail ? passwordChangeForm.email : ''

    passwordChangeForm.email = nextEmail
    passwordChangeForm.currentPassword = ''
    passwordChangeForm.newPassword = ''
    passwordChangeForm.confirmPassword = ''
    resetPasswordVisibility()
    resetPasswordChangeFeedback()
  }

  function passwordFieldType(field) {
    return passwordVisibility[field] ? 'text' : 'password'
  }

  function togglePasswordVisibility(field) {
    passwordVisibility[field] = !passwordVisibility[field]
  }

  function validatePasswordChangeForm() {
    resetPasswordChangeFeedback()

    if (!passwordChangeForm.email) {
      passwordChangeErrors.email = 'Введите почту.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passwordChangeForm.email)) {
      passwordChangeErrors.email = 'Укажите корректную почту.'
    } else if (
      currentUser.value?.email &&
      passwordChangeForm.email.toLowerCase() !== currentUser.value.email.toLowerCase()
    ) {
      passwordChangeErrors.email = 'Используйте почту текущего аккаунта.'
    }

    if (!passwordChangeForm.currentPassword) {
      passwordChangeErrors.currentPassword = 'Введите текущий пароль.'
    }

    if (!passwordChangeForm.newPassword) {
      passwordChangeErrors.newPassword = 'Введите новый пароль.'
    } else if (passwordChangeForm.newPassword.length < MIN_PASSWORD_LENGTH) {
      passwordChangeErrors.newPassword = `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов.`
    }

    if (!passwordChangeForm.confirmPassword) {
      passwordChangeErrors.confirmPassword = 'Подтвердите новый пароль.'
    } else if (passwordChangeForm.newPassword !== passwordChangeForm.confirmPassword) {
      passwordChangeErrors.confirmPassword = 'Пароли не совпадают.'
    }

    if (
      passwordChangeForm.currentPassword &&
      passwordChangeForm.newPassword &&
      passwordChangeForm.currentPassword === passwordChangeForm.newPassword
    ) {
      passwordChangeErrors.newPassword = 'Новый пароль должен отличаться от текущего.'
    }

    return !Object.values(passwordChangeErrors).some(Boolean)
  }

  async function handlePasswordChange() {
    if (!validatePasswordChangeForm()) {
      return
    }

    passwordChangeStatus.value = 'loading'
    passwordChangeMessage.value = ''

    try {
      await signInWithPassword({
        email: passwordChangeForm.email,
        password: passwordChangeForm.currentPassword,
      })

      await updateCurrentUserPassword({
        password: passwordChangeForm.newPassword,
      })

      passwordChangeStatus.value = 'success'
      passwordChangeMessage.value = 'Пароль обновлён.'
      showToast('Пароль обновлён')
      resetPasswordChangeForm()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось обновить пароль. Попробуйте снова.'

      passwordChangeStatus.value = 'error'
      passwordChangeMessage.value = /invalid login credentials/i.test(message)
        ? 'Текущий пароль указан неверно.'
        : message
    }
  }

  return {
    passwordChangeStatus,
    passwordChangeMessage,
    passwordChangeForm,
    passwordChangeErrors,
    passwordVisibility,
    passwordFieldType,
    togglePasswordVisibility,
    handlePasswordChange,
    resetPasswordChangeForm,
    minPasswordLength: MIN_PASSWORD_LENGTH,
  }
}

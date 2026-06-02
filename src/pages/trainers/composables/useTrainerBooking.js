import { computed, reactive, ref } from 'vue'
import { createTrainerBooking, fetchCurrentCrmUser } from '@/utils/supabaseDatabase'
import {
  SUPABASE_MIN_PASSWORD_LENGTH,
  getCurrentSession,
  signUpWithPassword,
} from '@/utils/supabaseAuth'
import { formatPhone, isValidPhone } from '@/utils/phone'
import { showToast } from '@/utils/toast'

const TRAINER_BOOKING_TOAST_DURATION = 6500

export function useTrainerBooking() {
  const activeBookingTrainer = ref(null)
  const isTrainerBookingModalOpen = ref(false)
  const isTrainerBookingSubmitting = ref(false)
  const isBookingIdentityLoading = ref(false)
  const bookingSession = ref(null)
  const trainerBookingFeedback = ref({
    type: 'idle',
    message: '',
  })

  const trainerBookingForm = reactive({
    fullName: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    comment: '',
    createAccount: true,
    password: '',
    confirmPassword: '',
    website: '',
  })

  const trainerBookingErrors = reactive({
    fullName: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    password: '',
    confirmPassword: '',
  })

  const todayIsoDate = computed(() => new Date().toISOString().slice(0, 10))
  const isBookingAuthenticated = computed(() => Boolean(bookingSession.value?.user))

  function getBookingRegistrationErrorMessage(error) {
    const message = error instanceof Error ? error.message : 'Не удалось зарегистрироваться.'

    if (/email rate limit exceeded/i.test(message) || /over_email_send_rate_limit/i.test(message)) {
      return 'Supabase временно ограничил отправку писем подтверждения. На встроенной почте доступно только 2 письма в час. Подождите около часа или подключите custom SMTP.'
    }

    if (/row-level security policy/i.test(message) && /trainer_bookings/i.test(message)) {
      return 'Supabase запрещает создавать записи в trainer_bookings по RLS. Нужно заново применить SQL из файла supabase/trainer_bookings.sql или проверить insert policy.'
    }

    if (/already registered/i.test(message) || /user already registered/i.test(message)) {
      return 'Пользователь с такой почтой уже зарегистрирован. Войдите в аккаунт или снимите создание учётной записи.'
    }

    if (/password/i.test(message) && /6/i.test(message)) {
      return `Пароль должен содержать минимум ${SUPABASE_MIN_PASSWORD_LENGTH} символов.`
    }

    if (/database error saving new user/i.test(message)) {
      return 'Аккаунт не создался из-за серверной ошибки Supabase. Проверьте Auth trigger и настройки базы.'
    }

    if (/signup is disabled/i.test(message)) {
      return 'Регистрация через почту сейчас отключена в настройках Supabase Auth.'
    }

    return message
  }

  function resetTrainerBookingErrors() {
    trainerBookingErrors.fullName = ''
    trainerBookingErrors.email = ''
    trainerBookingErrors.phone = ''
    trainerBookingErrors.preferredDate = ''
    trainerBookingErrors.preferredTime = ''
    trainerBookingErrors.password = ''
    trainerBookingErrors.confirmPassword = ''
  }

  function resetTrainerBookingFeedback() {
    trainerBookingFeedback.value = {
      type: 'idle',
      message: '',
    }
  }

  function resetTrainerBookingForm() {
    trainerBookingForm.fullName = ''
    trainerBookingForm.email = ''
    trainerBookingForm.phone = ''
    trainerBookingForm.preferredDate = ''
    trainerBookingForm.preferredTime = ''
    trainerBookingForm.comment = ''
    trainerBookingForm.createAccount = true
    trainerBookingForm.password = ''
    trainerBookingForm.confirmPassword = ''
    trainerBookingForm.website = ''
    resetTrainerBookingErrors()
    resetTrainerBookingFeedback()
  }

  function buildAuthRedirectUrl(authAction) {
    const url = new URL(import.meta.env.BASE_URL || '/', window.location.origin)
    url.pathname = `${url.pathname.replace(/\/$/, '')}/`.replace(/\/+/g, '/')
    const accountPath = `${url.pathname.replace(/\/$/, '')}/account`.replace(/\/+/g, '/')
    url.pathname = accountPath
    url.searchParams.set('auth', authAction)
    return url.toString()
  }

  function splitBookingFullName(value) {
    const parts = value
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean)

    if (parts.length < 2) {
      return {
        firstName: '',
        lastName: '',
      }
    }

    return {
      lastName: parts[0],
      firstName: parts.slice(1).join(' '),
    }
  }

  function applyBookingUserData(profile) {
    if (!profile) {
      return
    }

    trainerBookingForm.fullName = profile.name || trainerBookingForm.fullName
    trainerBookingForm.email = profile.email || trainerBookingForm.email
  }

  async function syncBookingIdentity() {
    isBookingIdentityLoading.value = true

    try {
      const session = await getCurrentSession()
      bookingSession.value = session

      if (!session) {
        return
      }

      try {
        const profile = await fetchCurrentCrmUser()
        applyBookingUserData(profile)
      } catch {
        applyBookingUserData({
          name: session.user?.user_metadata?.name || '',
          email: session.user?.email || '',
        })
      }
    } finally {
      isBookingIdentityLoading.value = false
    }
  }

  async function openTrainerBookingModal(trainer) {
    activeBookingTrainer.value = trainer
    resetTrainerBookingForm()
    isTrainerBookingModalOpen.value = true
    await syncBookingIdentity()
  }

  function closeTrainerBookingModal() {
    isTrainerBookingModalOpen.value = false
    activeBookingTrainer.value = null
    resetTrainerBookingErrors()
    resetTrainerBookingFeedback()
  }

  function validateTrainerBookingForm() {
    resetTrainerBookingErrors()

    if (!trainerBookingForm.fullName) {
      trainerBookingErrors.fullName = 'Укажите ФИО.'
    } else if (splitBookingFullName(trainerBookingForm.fullName).firstName === '') {
      trainerBookingErrors.fullName = 'Введите фамилию, имя и отчество хотя бы в двух частях.'
    }

    if (!trainerBookingForm.email) {
      trainerBookingErrors.email = 'Укажите почту.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trainerBookingForm.email)) {
      trainerBookingErrors.email = 'Укажите корректную почту.'
    }

    if (!trainerBookingForm.phone) {
      trainerBookingErrors.phone = 'Укажите номер телефона.'
    } else if (!isValidPhone(trainerBookingForm.phone)) {
      trainerBookingErrors.phone = 'Укажите телефон в международном формате, например +7 (961) 471-33-80.'
    }

    if (!trainerBookingForm.preferredDate) {
      trainerBookingErrors.preferredDate = 'Выберите дату.'
    }

    if (!trainerBookingForm.preferredTime) {
      trainerBookingErrors.preferredTime = 'Выберите время.'
    }

    if (!isBookingAuthenticated.value && trainerBookingForm.createAccount) {
      if (!trainerBookingForm.password) {
        trainerBookingErrors.password = 'Введите пароль.'
      } else if (trainerBookingForm.password.length < SUPABASE_MIN_PASSWORD_LENGTH) {
        trainerBookingErrors.password = `Пароль должен содержать минимум ${SUPABASE_MIN_PASSWORD_LENGTH} символов.`
      }

      if (!trainerBookingForm.confirmPassword) {
        trainerBookingErrors.confirmPassword = 'Подтвердите пароль.'
      } else if (trainerBookingForm.password !== trainerBookingForm.confirmPassword) {
        trainerBookingErrors.confirmPassword = 'Пароли не совпадают.'
      }
    }

    return !Object.values(trainerBookingErrors).some(Boolean)
  }

  async function handleTrainerBookingSubmit() {
    if (isTrainerBookingSubmitting.value || !activeBookingTrainer.value) {
      return
    }

    if (trainerBookingForm.website.trim()) {
      return
    }

    if (!validateTrainerBookingForm()) {
      return
    }

    resetTrainerBookingFeedback()

    const { firstName, lastName } = splitBookingFullName(trainerBookingForm.fullName)
    let accountWasCreated = false
    let requiresEmailConfirmation = false
    let clientUserId = bookingSession.value?.user?.id ?? null

    isTrainerBookingSubmitting.value = true

    try {
      if (!isBookingAuthenticated.value && trainerBookingForm.createAccount) {
        const signUpResult = await signUpWithPassword({
          email: trainerBookingForm.email.trim(),
          password: trainerBookingForm.password,
          name: trainerBookingForm.fullName.trim(),
          emailRedirectTo: buildAuthRedirectUrl('confirm-email'),
        })

        accountWasCreated = true
        clientUserId = signUpResult.user?.id ?? null
        bookingSession.value = signUpResult.session ?? null
        requiresEmailConfirmation = !signUpResult.session
      }

      await createTrainerBooking({
        trainerId: activeBookingTrainer.value.id,
        trainerName: activeBookingTrainer.value.name,
        clientUserId,
        firstName,
        lastName,
        phone: formatPhone(trainerBookingForm.phone),
        email: trainerBookingForm.email.trim(),
        preferredDate: trainerBookingForm.preferredDate,
        preferredTime: trainerBookingForm.preferredTime,
        comment: trainerBookingForm.comment.trim(),
      })

      closeTrainerBookingModal()

      if (accountWasCreated && requiresEmailConfirmation) {
        showToast(
          'Запись оформлена. Аккаунт создан, подтвердите почту, чтобы увидеть заявку в личном кабинете.',
          {
            duration: TRAINER_BOOKING_TOAST_DURATION,
          },
        )
        return
      }

      if (accountWasCreated) {
        showToast(
          'Регистрация и запись к тренеру прошли успешно. Заявка уже есть в личном кабинете.',
          {
            duration: TRAINER_BOOKING_TOAST_DURATION,
          },
        )
        return
      }

      if (isBookingAuthenticated.value) {
        showToast('Запись к тренеру оформлена. Она уже отображается в личном кабинете.', {
          duration: TRAINER_BOOKING_TOAST_DURATION,
        })
        return
      }

      showToast('Запись к тренеру оформлена. Мы свяжемся с вами для подтверждения.', {
        duration: TRAINER_BOOKING_TOAST_DURATION,
      })
    } catch (error) {
      const message = getBookingRegistrationErrorMessage(error)
      const feedbackMessage =
        accountWasCreated && /trainer_bookings/i.test(message)
          ? `Аккаунт создан, но запись к тренеру не сохранилась. ${message}`
          : message

      trainerBookingFeedback.value = {
        type: 'error',
        message: feedbackMessage,
      }

      showToast(feedbackMessage, {
        type: 'error',
        duration: TRAINER_BOOKING_TOAST_DURATION,
      })
    } finally {
      isTrainerBookingSubmitting.value = false
    }
  }

  function setBookingSession(session) {
    bookingSession.value = session
  }

  function cleanupTrainerBookingState() {
    isTrainerBookingModalOpen.value = false
    activeBookingTrainer.value = null
    isTrainerBookingSubmitting.value = false
    isBookingIdentityLoading.value = false
    resetTrainerBookingForm()
  }

  return {
    activeBookingTrainer,
    isTrainerBookingModalOpen,
    isTrainerBookingSubmitting,
    isBookingIdentityLoading,
    bookingSession,
    trainerBookingFeedback,
    trainerBookingForm,
    trainerBookingErrors,
    todayIsoDate,
    isBookingAuthenticated,
    openTrainerBookingModal,
    closeTrainerBookingModal,
    handleTrainerBookingSubmit,
    syncBookingIdentity,
    setBookingSession,
    cleanupTrainerBookingState,
  }
}

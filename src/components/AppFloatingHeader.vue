<template>
  <div class="app-header-wrapper">
    <header
      v-if="!isMobileViewport"
      ref="headerRef"
      class="app-header flex"
      :class="{ 'app-header--stopped': isHeaderStopped }"
      :style="headerStyle"
    >
      <div class="app-header__brand" :class="{ 'app-header__brand--visible': isBrandVisible }">
        <button
          type="button"
          class="app-header__home btn-reset link-reset"
          :tabindex="isBrandVisible ? 0 : -1"
          @click="handleHomeClick"
        >
          Главная
        </button>
      </div>

      <ul class="app-header__menu list-reset flex">
        <li class="app-header__item">
          <RouterLink class="app-header__link app-header__link--color link-reset" to="/competitions"
            >Соревнования</RouterLink
          >
        </li>
        <li class="app-header__item">
          <RouterLink class="app-header__link app-header__link--color link-reset" to="/fees"
            >Сборы</RouterLink
          >
        </li>
        <li class="app-header__item">
          <RouterLink class="app-header__link link-reset" to="/documents">Документы</RouterLink>
        </li>
        <li class="app-header__item">
          <RouterLink class="app-header__link link-reset" to="/trainers">Тренеры</RouterLink>
        </li>
        <li class="app-header__item">
          <RouterLink class="app-header__link link-reset" to="/contacts">Контакты</RouterLink>
        </li>
      </ul>

      <button type="button" class="app-header__login btn-reset" @click="openRegistrationModal">
        Личный кабинет
      </button>
    </header>

    <div v-else class="app-mobile-nav">
      <div
        ref="mobileBarRef"
        class="app-mobile-nav__bar"
        :class="{
          'app-mobile-nav__bar--stopped': isHeaderStopped,
          'app-mobile-nav__bar--keyboard-open': isAndroidKeyboardOpen,
        }"
        :style="headerStyle"
      >
        <button
          type="button"
          class="app-mobile-nav__login btn-reset"
          @click="openRegistrationModal"
        >
          Личный кабинет
        </button>
        <button
          type="button"
          class="app-mobile-nav__toggle btn-reset"
          :aria-expanded="isMobileMenuOpen"
          aria-controls="app-mobile-nav-panel"
          aria-label="Открыть меню"
          @click="toggleMobileMenu"
        >
          <span class="app-mobile-nav__toggle-line"></span>
          <span class="app-mobile-nav__toggle-line"></span>
          <span class="app-mobile-nav__toggle-line"></span>
        </button>
      </div>

      <Transition name="app-mobile-nav-overlay">
        <button
          v-if="isMobileMenuOpen"
          type="button"
          class="app-mobile-nav__overlay btn-reset"
          aria-label="Закрыть меню"
          @click="closeMobileMenu"
        ></button>
      </Transition>

      <Transition name="app-mobile-nav-panel">
        <aside v-if="isMobileMenuOpen" id="app-mobile-nav-panel" class="app-mobile-nav__panel">
          <div class="app-mobile-nav__head">
            <div class="app-mobile-nav__brand">
              <span class="app-mobile-nav__brand-icon">
                <IconSwimmer class="app-mobile-nav__icon app-mobile-nav__icon--swimmer" />
              </span>
              <div class="app-mobile-nav__brand-copy">
                <p class="app-mobile-nav__eyebrow">Smart Swim</p>
              </div>
            </div>
            <button
              type="button"
              class="app-mobile-nav__close btn-reset"
              aria-label="Закрыть меню"
              @click="closeMobileMenu"
            >
              <span></span>
              <span></span>
            </button>
          </div>

          <nav class="app-mobile-nav__content" aria-label="Мобильная навигация">
            <button
              type="button"
              class="app-mobile-nav__link btn-reset"
              :class="{ 'app-mobile-nav__link--active': route.path === '/' }"
              style="--item-index: 0"
              @click="handleMobileHomeClick"
            >
              Главная
            </button>

            <RouterLink v-for="(item, index) in mobileLinks" :key="item.to" :to="item.to" custom>
              <template #default="{ href }">
                <a
                  :href="href"
                  class="app-mobile-nav__link link-reset"
                  :class="{ 'app-mobile-nav__link--active': isRouteActive(item.to) }"
                  :style="{ '--item-index': index + 1 }"
                  @click.prevent="handleMobileLinkClick(item.to)"
                >
                  {{ item.label }}
                </a>
              </template>
            </RouterLink>
          </nav>

          <a class="app-mobile-nav__phone link-reset" href="tel:+79167290773"
            >+7 (916) 729-07-73</a
          >
        </aside>
      </Transition>
    </div>

    <Teleport to="body">
      <Transition name="app-registration-modal">
        <div
          v-if="isRegistrationModalOpen"
          class="app-registration"
          aria-hidden="false"
          @click.self="closeRegistrationModal"
        >
          <div
            ref="registrationDialogRef"
            class="app-registration__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-registration-title"
          >
            <div class="app-registration__header">
              <h2 id="app-registration-title" class="app-registration__title">
                {{ registrationTitle }}
              </h2>
              <button
                type="button"
                class="app-registration__close btn-reset"
                aria-label="Закрыть форму регистрации"
                @click="closeRegistrationModal"
              >
                <span></span>
                <span></span>
              </button>
            </div>

            <form
              class="app-registration__form"
              novalidate
              @submit.prevent="handleRegistrationSubmit"
            >
              <label v-if="isSignUpMode" class="app-registration__field">
                <span class="app-registration__label">Имя</span>
                <input
                  v-model.trim="registrationForm.name"
                  class="app-registration__input"
                  type="text"
                  name="name"
                  autocomplete="name"
                  placeholder="Как к вам обращаться"
                  :aria-invalid="Boolean(registrationErrors.name)"
                />
                <span v-if="registrationErrors.name" class="app-registration__error">
                  {{ registrationErrors.name }}
                </span>
              </label>

              <label class="app-registration__field">
                <span class="app-registration__label">Почта</span>
                <input
                  v-model.trim="registrationForm.email"
                  class="app-registration__input"
                  type="email"
                  name="email"
                  :autocomplete="isPasswordResetMode ? 'off' : 'email'"
                  placeholder="example@mail.ru"
                  :aria-invalid="Boolean(registrationErrors.email)"
                  :disabled="isPasswordResetMode"
                />
                <span v-if="registrationErrors.email" class="app-registration__error">
                  {{ registrationErrors.email }}
                </span>
              </label>

              <div
                v-if="showPasswordGrid"
                class="app-registration__field-grid"
                :class="{ 'app-registration__field-grid--single': isSinglePasswordColumn }"
              >
                <label class="app-registration__field">
                  <span class="app-registration__label">
                    {{ isPasswordResetMode ? 'Новый пароль' : 'Пароль' }}
                  </span>
                  <div class="app-registration__input-wrap">
                    <input
                      v-model="registrationForm.password"
                      class="app-registration__input app-registration__input--password"
                      :type="passwordFieldType('password')"
                      name="password"
                      :autocomplete="isSignInMode ? 'current-password' : 'new-password'"
                      :placeholder="
                        isSignInMode ? 'Введите пароль' : `Минимум ${MIN_PASSWORD_LENGTH} символов`
                      "
                      :aria-invalid="Boolean(registrationErrors.password)"
                    />
                    <button
                      type="button"
                      class="app-registration__visibility btn-reset"
                      :aria-label="
                        passwordVisibility.password ? 'Скрыть пароль' : 'Показать пароль'
                      "
                      @click="togglePasswordVisibility('password')"
                    >
                      <component :is="passwordVisibility.password ? Hide : View" />
                    </button>
                  </div>
                  <span v-if="registrationErrors.password" class="app-registration__error">
                    {{ registrationErrors.password }}
                  </span>
                </label>

                <label v-if="showConfirmPasswordField" class="app-registration__field">
                  <span class="app-registration__label">Подтвердите пароль</span>
                  <div class="app-registration__input-wrap">
                    <input
                      v-model="registrationForm.confirmPassword"
                      class="app-registration__input app-registration__input--password"
                      :type="passwordFieldType('confirmPassword')"
                      name="confirm-password"
                      autocomplete="new-password"
                      placeholder="Повторите пароль"
                      :aria-invalid="Boolean(registrationErrors.confirmPassword)"
                    />
                    <button
                      type="button"
                      class="app-registration__visibility btn-reset"
                      :aria-label="
                        passwordVisibility.confirmPassword
                          ? 'Скрыть подтверждение пароля'
                          : 'Показать подтверждение пароля'
                      "
                      @click="togglePasswordVisibility('confirmPassword')"
                    >
                      <component :is="passwordVisibility.confirmPassword ? Hide : View" />
                    </button>
                  </div>
                  <span v-if="registrationErrors.confirmPassword" class="app-registration__error">
                    {{ registrationErrors.confirmPassword }}
                  </span>
                </label>
              </div>

              <label v-if="isSignUpMode" class="app-registration__consent">
                <input
                  v-model="registrationForm.consent"
                  class="app-registration__checkbox"
                  type="checkbox"
                  name="consent"
                />
                <span class="app-registration__consent-copy"
                  >Согласен на обработку персональных данных</span
                >
              </label>
              <span v-if="registrationErrors.consent" class="app-registration__error">
                {{ registrationErrors.consent }}
              </span>

              <p
                v-if="registrationStatus === 'success' || registrationStatus === 'error'"
                class="app-registration__status"
                :class="{
                  'app-registration__status--success': registrationStatus === 'success',
                  'app-registration__status--error': registrationStatus === 'error',
                }"
              >
                {{ registrationMessage }}
              </p>

              <button
                type="submit"
                class="app-registration__submit btn-reset"
                :disabled="registrationStatus === 'loading'"
              >
                {{
                  registrationStatus === 'loading' ? submitButtonLoadingLabel : submitButtonLabel
                }}
              </button>

              <button
                v-if="showForgotPasswordLink"
                type="button"
                class="app-registration__secondary-link btn-reset"
                @click="setAuthMode('forgot-password', { preserveEmail: true })"
              >
                Забыли пароль?
              </button>

              <div v-if="showAuthSwitch" class="app-registration__switch-group">
                <span class="app-registration__switch-copy">
                  {{ authSwitchCopy }}
                </span>
                <button
                  type="button"
                  class="app-registration__switch btn-reset"
                  @click="toggleAuthMode"
                >
                  {{ authSwitchAction }}
                </button>
              </div>

              <button
                v-if="showBackToSignInLink"
                type="button"
                class="app-registration__secondary-link btn-reset"
                @click="setAuthMode('sign-in', { preserveEmail: true })"
              >
                Вернуться ко входу
              </button>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { Hide, View } from '@element-plus/icons-vue'
import IconSwimmer from '@/assets/images/icon-swimmer.svg'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { showToast } from '@/utils/toast'
import {
  getCurrentSession,
  normalizeAuthUser,
  requestPasswordReset,
  signInWithPassword,
  signUpWithPassword,
  subscribeToAuthStateChange,
  SUPABASE_MIN_PASSWORD_LENGTH,
  updateCurrentUserPassword,
} from '@/utils/supabaseAuth'

const route = useRoute()
const router = useRouter()
const HEADER_BOTTOM_OFFSET = 20
const FOOTER_STOP_OFFSET = 30
const MOBILE_BREAKPOINT = 1024
const mobileLinks = [
  { label: 'Соревнования', to: '/competitions' },
  { label: 'Сборы', to: '/fees' },
  { label: 'Документы', to: '/documents' },
  { label: 'Тренеры', to: '/trainers' },
  { label: 'Контакты', to: '/contacts' },
]

const headerRef = ref(null)
const mobileBarRef = ref(null)
const isHeaderStopped = ref(false)
const isHeaderFloating = ref(false)
const isMobileViewport = ref(false)
const isMobileMenuOpen = ref(false)
const isAndroidKeyboardOpen = ref(false)
const isRegistrationModalOpen = ref(false)
const registrationDialogRef = ref(null)
const registrationStatus = ref('idle')
const registrationMessage = ref('')
const registeredUser = ref(null)
const hasActiveSession = ref(false)
const authMode = ref('sign-up')
const hasPasswordRecoveryIntent = ref(false)
const headerStyle = ref({
  top: 'auto',
  bottom: `${HEADER_BOTTOM_OFFSET}px`,
})
const registrationForm = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  consent: false,
})
const registrationErrors = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  consent: '',
})
const passwordVisibility = reactive({
  password: false,
  confirmPassword: false,
})

const headerMetrics = {
  revealPoint: 0,
}

let scrollFrameId = 0
let resizeFrameId = 0
let homeScrollFrameId = 0
let keyboardFrameId = 0
let registrationCloseTimeoutId = 0
let resizeObserver = null
let shouldCloseMobileMenuAfterNavigation = false
let homeSectionRef = null
let footerSectionRef = null
let initialViewportHeight = 0
let initialViewportMetaContent = ''
let authSubscription = null

const KEYBOARD_OPEN_THRESHOLD = 120
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]'

const isHomeRoute = computed(() => route.path === '/')
const isBrandVisible = computed(() => (isHomeRoute.value ? isHeaderFloating.value : true))
const isSignInMode = computed(() => authMode.value === 'sign-in')
const isSignUpMode = computed(() => authMode.value === 'sign-up')
const isForgotPasswordMode = computed(() => authMode.value === 'forgot-password')
const isPasswordResetMode = computed(() => authMode.value === 'reset-password')
const activeFloatingRef = computed(() =>
  isMobileViewport.value ? mobileBarRef.value : headerRef.value,
)
const registrationTitle = computed(() => {
  if (isSignInMode.value) {
    return 'Вход в кабинет'
  }

  if (isForgotPasswordMode.value) {
    return 'Восстановление пароля'
  }

  if (isPasswordResetMode.value) {
    return 'Новый пароль'
  }

  return 'Регистрация'
})
const showPasswordGrid = computed(() => !isForgotPasswordMode.value)
const showConfirmPasswordField = computed(() => isSignUpMode.value || isPasswordResetMode.value)
const isSinglePasswordColumn = computed(
  () => isSignInMode.value || isSignUpMode.value || isPasswordResetMode.value,
)
const showForgotPasswordLink = computed(() => isSignInMode.value)
const showAuthSwitch = computed(() => isSignInMode.value || isSignUpMode.value)
const showBackToSignInLink = computed(() => isForgotPasswordMode.value || isPasswordResetMode.value)
const authSwitchCopy = computed(() =>
  isSignInMode.value ? 'Нет аккаунта?' : 'Уже зарегистрированы?',
)
const authSwitchAction = computed(() => (isSignInMode.value ? 'Зарегистрироваться' : 'Войти'))
const submitButtonLabel = computed(() => {
  if (isSignInMode.value) {
    return 'Войти'
  }

  if (isForgotPasswordMode.value) {
    return 'Отправить инструкцию'
  }

  if (isPasswordResetMode.value) {
    return 'Сохранить новый пароль'
  }

  return 'Зарегистрироваться'
})
const submitButtonLoadingLabel = computed(() => {
  if (isSignInMode.value) {
    return 'Входим...'
  }

  if (isForgotPasswordMode.value) {
    return 'Отправляем...'
  }

  if (isPasswordResetMode.value) {
    return 'Сохраняем...'
  }

  return 'Регистрируем...'
})
const MIN_PASSWORD_LENGTH = SUPABASE_MIN_PASSWORD_LENGTH

function syncRegisteredUserFromSession(session) {
  hasActiveSession.value = Boolean(session)

  if (!session?.user) {
    registeredUser.value = null
    return
  }

  registeredUser.value = normalizeAuthUser(session.user)
}

function isSupabaseRecoveryUrl() {
  const search = window.location.search || ''
  const hash = window.location.hash || ''
  const recoveryPattern = /(^|[?#&])type=recovery([&#]|$)/

  return recoveryPattern.test(search) || recoveryPattern.test(hash)
}

async function syncRegisteredUser() {
  try {
    const session = await getCurrentSession()
    syncRegisteredUserFromSession(session)
    return session
  } catch {
    hasActiveSession.value = false
    registeredUser.value = null
    return null
  }
}

async function handleAuthRedirectIntent(session, event = '') {
  const authIntent = typeof route.query.auth === 'string' ? route.query.auth : ''

  if (event === 'PASSWORD_RECOVERY') {
    hasPasswordRecoveryIntent.value = true
  }

  if (!session || !authIntent) {
    return
  }

  if (authIntent === 'reset-password') {
    if (!hasPasswordRecoveryIntent.value) {
      return
    }

    openRegistrationModal({
      mode: 'reset-password',
      allowAuthenticatedModal: true,
    })
    registrationStatus.value = 'idle'
    registrationMessage.value = 'Введите новый пароль и сохраните его.'
    registrationForm.email = session.user?.email || registrationForm.email
    return
  }

  if (authIntent === 'confirm-email') {
    registrationStatus.value = 'success'
    registrationMessage.value = 'Почта подтверждена. Открываем личный кабинет.'
    await openAccountRoute()
  }
}

function isAndroidDevice() {
  return /Android/i.test(window.navigator.userAgent)
}

function isIOSDevice() {
  return (
    /iPhone|iPad|iPod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  )
}

function getViewportMetaTag() {
  return document.querySelector('meta[name="viewport"]')
}

function lockViewportZoom() {
  if (!isIOSDevice()) {
    return
  }

  const viewportMetaTag = getViewportMetaTag()

  if (!viewportMetaTag) {
    return
  }

  if (!initialViewportMetaContent) {
    initialViewportMetaContent = viewportMetaTag.getAttribute('content') || ''
  }

  viewportMetaTag.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
  )
}

function unlockViewportZoom() {
  if (!isIOSDevice()) {
    return
  }

  const viewportMetaTag = getViewportMetaTag()

  if (!viewportMetaTag || !initialViewportMetaContent) {
    return
  }

  viewportMetaTag.setAttribute('content', initialViewportMetaContent)
}

function hasEditableFocus() {
  const activeElement = document.activeElement

  return Boolean(activeElement?.matches?.(EDITABLE_SELECTOR))
}

function syncAndroidKeyboardState() {
  if (!window.visualViewport || !isAndroidDevice()) {
    return
  }

  if (isRegistrationModalOpen.value) {
    isAndroidKeyboardOpen.value = false
    return
  }

  if (!initialViewportHeight) {
    initialViewportHeight = window.visualViewport.height
  }

  const viewportHeightDelta = initialViewportHeight - window.visualViewport.height
  const nextKeyboardOpen = viewportHeightDelta > KEYBOARD_OPEN_THRESHOLD && hasEditableFocus()

  if (nextKeyboardOpen === isAndroidKeyboardOpen.value) {
    return
  }

  isAndroidKeyboardOpen.value = nextKeyboardOpen

  if (nextKeyboardOpen) {
    closeMobileMenu()
    return
  }

  handleResize()
}

function handleFocusIn(event) {
  if (!event.target?.matches?.(EDITABLE_SELECTOR)) {
    return
  }

  if (isRegistrationModalOpen.value) {
    return
  }

  if (isAndroidDevice()) {
    syncAndroidKeyboardState()
  }
}

function handleFocusOut() {
  if (!isAndroidDevice() || isRegistrationModalOpen.value) {
    return
  }

  window.requestAnimationFrame(() => {
    syncAndroidKeyboardState()
  })
}

function syncRouteTargets() {
  homeSectionRef = document.querySelector('.home')
  footerSectionRef = document.querySelector('.footer')
}

function syncViewportMode() {
  isMobileViewport.value = window.innerWidth < MOBILE_BREAKPOINT
}

function resetHeaderState() {
  isHeaderStopped.value = false
  isHeaderFloating.value = !isHomeRoute.value
  headerStyle.value = {
    top: 'auto',
    bottom: `${HEADER_BOTTOM_OFFSET}px`,
  }
}

function updateHeaderPosition() {
  if (!isHomeRoute.value) {
    isHeaderFloating.value = true
  } else if (!homeSectionRef) {
    isHeaderFloating.value = false
    return
  } else {
    const scrollY = window.scrollY
    isHeaderFloating.value = scrollY >= headerMetrics.revealPoint
  }

  const scrollY = window.scrollY
  const headerHeight = activeFloatingRef.value?.offsetHeight ?? 0
  const footerTop = footerSectionRef?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
  const stopTriggerTop = window.innerHeight - HEADER_BOTTOM_OFFSET + FOOTER_STOP_OFFSET
  const stopHeaderTop = footerTop - FOOTER_STOP_OFFSET - headerHeight
  const shouldStopHeader = footerSectionRef ? footerTop <= stopTriggerTop : false

  if (shouldStopHeader === isHeaderStopped.value) {
    return
  }

  isHeaderStopped.value = shouldStopHeader

  const nextStyle = shouldStopHeader
    ? {
        top: `${scrollY + stopHeaderTop}px`,
        bottom: 'auto',
      }
    : {
        top: 'auto',
        bottom: `${HEADER_BOTTOM_OFFSET}px`,
      }

  if (headerStyle.value.top !== nextStyle.top || headerStyle.value.bottom !== nextStyle.bottom) {
    headerStyle.value = nextStyle
  }
}

function recalculateHeaderMetrics() {
  if (!activeFloatingRef.value) {
    return
  }

  syncRouteTargets()

  if (!footerSectionRef) {
    headerMetrics.revealPoint =
      isHomeRoute.value && homeSectionRef
        ? homeSectionRef.offsetTop + homeSectionRef.offsetHeight * 0.75
        : 0
    resetHeaderState()
    return
  }

  headerMetrics.revealPoint =
    isHomeRoute.value && homeSectionRef
      ? homeSectionRef.offsetTop + homeSectionRef.offsetHeight * 0.75
      : 0
  isHeaderStopped.value = false
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

function handleResize() {
  if (resizeFrameId) {
    return
  }

  resizeFrameId = window.requestAnimationFrame(() => {
    resizeFrameId = 0
    syncViewportMode()

    if (window.visualViewport && !isAndroidKeyboardOpen.value) {
      initialViewportHeight = Math.max(initialViewportHeight, window.visualViewport.height)
    }

    recalculateHeaderMetrics()
    updateHeaderPosition()
  })
}

function handleVisualViewportChange() {
  if (keyboardFrameId) {
    return
  }

  keyboardFrameId = window.requestAnimationFrame(() => {
    keyboardFrameId = 0
    syncAndroidKeyboardState()
    handleResize()
  })
}

function observeLayout() {
  if (!window.ResizeObserver || !activeFloatingRef.value) {
    return
  }

  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  resizeObserver = new window.ResizeObserver(() => {
    handleResize()
  })

  resizeObserver.observe(activeFloatingRef.value)

  if (homeSectionRef) {
    resizeObserver.observe(homeSectionRef)
  }

  if (footerSectionRef) {
    resizeObserver.observe(footerSectionRef)
  }
}

function smoothScrollToTop() {
  if (homeScrollFrameId) {
    window.cancelAnimationFrame(homeScrollFrameId)
  }

  const startY = window.scrollY

  if (startY <= 0) {
    return
  }

  const duration = 550
  const startTime = window.performance.now()

  const easeOutCubic = (progress) => 1 - (1 - progress) ** 3

  const tick = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const nextY = Math.round(startY * (1 - easeOutCubic(progress)))

    window.scrollTo({
      top: nextY,
      left: 0,
      behavior: 'auto',
    })

    if (progress < 1) {
      homeScrollFrameId = window.requestAnimationFrame(tick)
      return
    }

    homeScrollFrameId = 0
  }

  homeScrollFrameId = window.requestAnimationFrame(tick)
}

function handleHomeClick() {
  if (!isHomeRoute.value) {
    router.push('/').then(() => {
      nextTick(() => {
        smoothScrollToTop()
      })
    })
    return
  }

  smoothScrollToTop()
}

function isRouteActive(path) {
  if (path === '/competitions') {
    return route.path.startsWith('/competitions')
  }

  if (path === '/fees') {
    return route.path.startsWith('/fees')
  }

  return route.path === path
}

function closeMobileMenu() {
  shouldCloseMobileMenuAfterNavigation = false
  isMobileMenuOpen.value = false
}

function buildAuthRedirectUrl(authAction) {
  const url = new URL(import.meta.env.BASE_URL || '/', window.location.origin)
  url.searchParams.set('auth', authAction)
  return url.toString()
}

function resetPasswordVisibility() {
  passwordVisibility.password = false
  passwordVisibility.confirmPassword = false
}

function togglePasswordVisibility(field) {
  passwordVisibility[field] = !passwordVisibility[field]
}

function passwordFieldType(field) {
  return passwordVisibility[field] ? 'text' : 'password'
}

function resetRegistrationFeedback() {
  registrationStatus.value = 'idle'
  registrationMessage.value = ''
  registrationErrors.name = ''
  registrationErrors.email = ''
  registrationErrors.password = ''
  registrationErrors.confirmPassword = ''
  registrationErrors.consent = ''
}

function resetRegistrationForm() {
  registrationForm.name = ''
  registrationForm.email = ''
  registrationForm.password = ''
  registrationForm.confirmPassword = ''
  registrationForm.consent = false
  resetPasswordVisibility()
  resetRegistrationFeedback()
}

function setAuthMode(mode, options = {}) {
  const { preserveEmail = false, preserveFeedback = false } = options
  const nextEmail = preserveEmail ? registrationForm.email : ''
  const nextStatus = preserveFeedback ? registrationStatus.value : 'idle'
  const nextMessage = preserveFeedback ? registrationMessage.value : ''

  authMode.value = mode
  resetRegistrationForm()
  registrationForm.email = nextEmail
  registrationStatus.value = nextStatus
  registrationMessage.value = nextMessage
}

function toggleAuthMode() {
  setAuthMode(isSignInMode.value ? 'sign-up' : 'sign-in')
}

function openRegistrationModal(options = {}) {
  const { mode = authMode.value, allowAuthenticatedModal = false, preserveEmail = false } = options

  if (mode !== authMode.value) {
    setAuthMode(mode, { preserveEmail })
  }

  if (hasActiveSession.value && !allowAuthenticatedModal) {
    closeMobileMenu()
    router.push('/account')
    return
  }

  closeMobileMenu()
  if (registrationCloseTimeoutId) {
    window.clearTimeout(registrationCloseTimeoutId)
    registrationCloseTimeoutId = 0
  }
  isRegistrationModalOpen.value = true
  lockViewportZoom()

  if (isIOSDevice()) {
    return
  }

  nextTick(() => {
    registrationDialogRef.value?.querySelector('input')?.focus()
  })
}

function closeRegistrationModal() {
  if (registrationCloseTimeoutId) {
    window.clearTimeout(registrationCloseTimeoutId)
    registrationCloseTimeoutId = 0
  }

  isRegistrationModalOpen.value = false
  unlockViewportZoom()
  resetRegistrationForm()
  hasPasswordRecoveryIntent.value = false
  authMode.value = 'sign-up'
}

function validateRegistrationForm() {
  resetRegistrationFeedback()

  if (isSignUpMode.value && !registrationForm.name) {
    registrationErrors.name = 'Введите имя.'
  }

  if (!isPasswordResetMode.value && !registrationForm.email) {
    registrationErrors.email = 'Введите электронную почту.'
  } else if (
    !isPasswordResetMode.value &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationForm.email)
  ) {
    registrationErrors.email = 'Укажите корректную почту.'
  }

  if (!isForgotPasswordMode.value && !registrationForm.password) {
    registrationErrors.password = 'Введите пароль.'
  } else if (
    !isForgotPasswordMode.value &&
    registrationForm.password.length < MIN_PASSWORD_LENGTH
  ) {
    registrationErrors.password = `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов.`
  }

  if (showConfirmPasswordField.value && !registrationForm.confirmPassword) {
    registrationErrors.confirmPassword = 'Подтвердите пароль.'
  } else if (
    showConfirmPasswordField.value &&
    registrationForm.password !== registrationForm.confirmPassword
  ) {
    registrationErrors.confirmPassword = 'Пароли не совпадают.'
  }

  if (isSignUpMode.value && !registrationForm.consent) {
    registrationErrors.consent = 'Нужно подтвердить согласие на обработку персональных данных.'
  }

  return !Object.values(registrationErrors).some(Boolean)
}

function validateRegistrationField(field) {
  if (field === 'name') {
    registrationErrors.name = isSignUpMode.value && !registrationForm.name ? 'Введите имя.' : ''
    return
  }

  if (field === 'email') {
    if (isPasswordResetMode.value) {
      registrationErrors.email = ''
      return
    }

    if (!registrationForm.email) {
      registrationErrors.email = 'Введите электронную почту.'
      return
    }

    registrationErrors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationForm.email)
      ? ''
      : 'Укажите корректную почту.'
    return
  }

  if (field === 'password') {
    if (isForgotPasswordMode.value) {
      registrationErrors.password = ''
      return
    }

    if (!registrationForm.password) {
      registrationErrors.password = 'Введите пароль.'
    } else if (registrationForm.password.length < MIN_PASSWORD_LENGTH) {
      registrationErrors.password = `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов.`
    } else {
      registrationErrors.password = ''
    }

    if (showConfirmPasswordField.value && registrationForm.confirmPassword) {
      registrationErrors.confirmPassword =
        registrationForm.password === registrationForm.confirmPassword ? '' : 'Пароли не совпадают.'
    }

    return
  }

  if (field === 'confirmPassword') {
    if (!showConfirmPasswordField.value) {
      registrationErrors.confirmPassword = ''
      return
    }

    if (!registrationForm.confirmPassword) {
      registrationErrors.confirmPassword = 'Подтвердите пароль.'
      return
    }

    registrationErrors.confirmPassword =
      registrationForm.password === registrationForm.confirmPassword ? '' : 'Пароли не совпадают.'
    return
  }

  if (field === 'consent') {
    registrationErrors.consent =
      !isSignUpMode.value || registrationForm.consent
        ? ''
        : 'Нужно подтвердить согласие на обработку персональных данных.'
  }
}

function getRegistrationSuccessMessage(payload) {
  return payload?.session
    ? 'Аккаунт создан. Открываем личный кабинет.'
    : 'Регистрация прошла успешно. Подтвердите почту, после перехода из письма откроем CRM.'
}

function getRegistrationErrorMessage(error) {
  const message = error instanceof Error ? error.message : 'Не удалось зарегистрироваться.'

  if (/email rate limit exceeded/i.test(message) || /over_email_send_rate_limit/i.test(message)) {
    return 'Supabase временно ограничил отправку писем подтверждения. На встроенной почте доступно только 2 письма в час. Подождите около часа или подключите custom SMTP.'
  }

  if (/already registered/i.test(message)) {
    return 'Пользователь с такой почтой уже зарегистрирован. Используйте вход.'
  }

  if (/invalid login credentials/i.test(message)) {
    return 'Неверная почта или пароль.'
  }

  if (/email not confirmed/i.test(message)) {
    return 'Подтвердите почту, затем попробуйте войти еще раз.'
  }

  if (/password/i.test(message) && /6/i.test(message)) {
    return `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов.`
  }

  return message
}

async function handleRecoveryFlow() {
  await requestPasswordReset({
    email: registrationForm.email,
    redirectTo: buildAuthRedirectUrl('reset-password'),
  })

  registrationStatus.value = 'success'
  registrationMessage.value =
    'Если аккаунт с такой почтой существует, инструкция по смене пароля придёт на email.'
}

async function handlePasswordResetFlow() {
  await updateCurrentUserPassword({
    password: registrationForm.password,
  })

  hasPasswordRecoveryIntent.value = false
  registrationStatus.value = 'success'
  registrationMessage.value = 'Пароль обновлён. Открываем личный кабинет.'
  showToast('Пароль обновлён')
  await openAccountRoute()
  closeRegistrationModal()
}

async function handleRegistrationSuccessRedirect(session) {
  if (!session) {
    return
  }

  if (route.query.auth === 'reset-password') {
    return
  }

  await openAccountRoute()
  closeRegistrationModal()
}

async function openAccountRoute() {
  await router.push('/account')

  if (router.currentRoute.value.path !== '/account') {
    throw new Error('Не удалось открыть личный кабинет. Обновите страницу и попробуйте снова.')
  }
}

async function handleRegistrationSubmit() {
  if (!validateRegistrationForm()) {
    return
  }

  registrationStatus.value = 'loading'
  registrationMessage.value = ''

  try {
    if (isForgotPasswordMode.value) {
      await handleRecoveryFlow()
      return
    }

    if (isPasswordResetMode.value) {
      await handlePasswordResetFlow()
      return
    }

    if (isSignInMode.value) {
      const payload = await signInWithPassword({
        email: registrationForm.email,
        password: registrationForm.password,
      })

      if (!payload.session) {
        throw new Error('Не удалось открыть сессию. Попробуйте войти еще раз.')
      }

      registeredUser.value = normalizeAuthUser(payload.user)

      hasActiveSession.value = true
      registrationStatus.value = 'success'
      registrationMessage.value = 'Вход выполнен. Открываем личный кабинет.'
      showToast('Вход выполнен')
      await handleRegistrationSuccessRedirect(payload.session)
      return
    }

    const payload = await signUpWithPassword({
      email: registrationForm.email,
      password: registrationForm.password,
      name: registrationForm.name,
      emailRedirectTo: buildAuthRedirectUrl('confirm-email'),
    })

    const nextRegisteredUser = normalizeAuthUser(payload.user) || {
      id: null,
      name: registrationForm.name,
      email: registrationForm.email,
      registeredAt: new Date().toISOString(),
    }

    registeredUser.value = nextRegisteredUser
    hasActiveSession.value = Boolean(payload.session)
    registrationStatus.value = 'success'
    registrationMessage.value = getRegistrationSuccessMessage(payload)
    showToast('Регистрация прошла успешно')

    if (!payload.session) {
      setAuthMode('sign-in', { preserveEmail: true, preserveFeedback: true })
      return
    }

    await handleRegistrationSuccessRedirect(payload.session)
  } catch (error) {
    registrationStatus.value = 'error'
    registrationMessage.value = getRegistrationErrorMessage(error)
  }
}

watch(
  () => registrationForm.name,
  () => {
    if (registrationErrors.name) {
      validateRegistrationField('name')
    }
  },
)

watch(
  () => registrationForm.email,
  () => {
    if (registrationErrors.email) {
      validateRegistrationField('email')
    }
  },
)

watch(
  () => registrationForm.password,
  () => {
    if (registrationErrors.password || registrationErrors.confirmPassword) {
      validateRegistrationField('password')
    }
  },
)

watch(
  () => registrationForm.confirmPassword,
  () => {
    if (registrationErrors.confirmPassword) {
      validateRegistrationField('confirmPassword')
    }
  },
)

watch(
  () => registrationForm.consent,
  () => {
    if (registrationErrors.consent) {
      validateRegistrationField('consent')
    }
  },
)

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

async function handleMobileLinkClick(path) {
  if (route.path === path) {
    closeMobileMenu()
    return
  }

  shouldCloseMobileMenuAfterNavigation = true
  await router.push(path)
}

async function handleMobileHomeClick() {
  if (isHomeRoute.value) {
    closeMobileMenu()
    smoothScrollToTop()
    return
  }

  shouldCloseMobileMenuAfterNavigation = true
  await router.push('/')

  nextTick(() => {
    smoothScrollToTop()
  })
}

function handleKeydown(event) {
  if (event.key !== 'Escape') {
    return
  }

  if (isRegistrationModalOpen.value) {
    closeRegistrationModal()
    return
  }

  if (isMobileMenuOpen.value) {
    closeMobileMenu()
  }
}

onMounted(() => {
  hasPasswordRecoveryIntent.value = isSupabaseRecoveryUrl()

  void syncRegisteredUser().then((session) => {
    void handleAuthRedirectIntent(session)
  })
  syncViewportMode()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('focusin', handleFocusIn)
  document.addEventListener('focusout', handleFocusOut)

  authSubscription = subscribeToAuthStateChange((event, session) => {
    if (!session) {
      hasActiveSession.value = false
      registeredUser.value = null
      return
    }

    syncRegisteredUserFromSession(session)
    void handleAuthRedirectIntent(session, event)
  })

  if (window.visualViewport && isAndroidDevice()) {
    initialViewportHeight = window.visualViewport.height
    window.visualViewport.addEventListener('resize', handleVisualViewportChange)
    window.visualViewport.addEventListener('scroll', handleVisualViewportChange)
  }

  nextTick(() => {
    syncRouteTargets()
    observeLayout()
    handleResize()
  })
})

watch(
  () => route.fullPath,
  () => {
    const shouldCloseAfterNavigation = shouldCloseMobileMenuAfterNavigation
    shouldCloseMobileMenuAfterNavigation = false
    resetHeaderState()
    closeRegistrationModal()

    nextTick(() => {
      if (shouldCloseAfterNavigation) {
        closeMobileMenu()
      }

      syncRouteTargets()
      observeLayout()
      handleResize()
    })
  },
)

watch([isMobileMenuOpen, isRegistrationModalOpen], ([isMenuOpen, isModalOpen]) => {
  document.body.style.overflow = isMenuOpen || isModalOpen ? 'hidden' : ''
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('focusin', handleFocusIn)
  document.removeEventListener('focusout', handleFocusOut)

  if (window.visualViewport && isAndroidDevice()) {
    window.visualViewport.removeEventListener('resize', handleVisualViewportChange)
    window.visualViewport.removeEventListener('scroll', handleVisualViewportChange)
  }

  if (scrollFrameId) {
    window.cancelAnimationFrame(scrollFrameId)
  }

  if (resizeFrameId) {
    window.cancelAnimationFrame(resizeFrameId)
  }

  if (homeScrollFrameId) {
    window.cancelAnimationFrame(homeScrollFrameId)
  }

  if (keyboardFrameId) {
    window.cancelAnimationFrame(keyboardFrameId)
  }

  if (registrationCloseTimeoutId) {
    window.clearTimeout(registrationCloseTimeoutId)
  }

  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  authSubscription?.unsubscribe()
  document.body.style.overflow = ''
  unlockViewportZoom()
})
</script>

<style scoped>
.app-header-wrapper {
  z-index: 120;
  pointer-events: none;
}

.app-header {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
  width: max-content;
  padding: 5px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 95%, transparent);
  gap: 20px;
  z-index: 100;
  pointer-events: auto;
}

.app-header * {
  pointer-events: auto;
}

.app-header--stopped {
  position: absolute;
}

.app-header__brand {
  --button-bg: var(--button-light-blue-bg);
  --button-hover-bg: var(--button-light-blue-hover-bg);
  --button-current-bg: var(--button-bg);
  flex-shrink: 0;
  max-width: 0;
  padding: 15px 0;
  background-color: var(--button-current-bg);
  border-radius: 10px;
  overflow: hidden;
  transform-origin: right center;
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
  transition:
    max-width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    padding 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    background-color 0.2s ease,
    opacity 0.35s ease,
    transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform: scaleX(0.01);
}

.app-header__brand--visible {
  max-width: 160px;
  padding: 15px 30px;
  opacity: 1;
  pointer-events: auto;
  transform: scaleX(1);
}

.app-header__brand:hover,
.app-header__brand:focus-within {
  --button-current-bg: var(--button-hover-bg);
}

.app-header__home {
  display: block;
  width: 100%;
  font-size: 15px;
  font-weight: 500;
  color: var(--black);
  white-space: nowrap;
}

.app-header__menu {
  align-items: center;
  gap: 20px;
  padding: 0 30px;
}

.app-header__link {
  font-size: 15px;
  font-weight: 500;
  color: var(--black);
  transition: color 0.2s ease;
}

.app-header__link--color {
  --button-bg: var(--button-cyan-bg);
  --button-hover-bg: var(--button-cyan-hover-bg);
  --button-focus-color: var(--cyan);
  --button-text: var(--black);
  display: block;
  height: 47px;
  appearance: none;
  -webkit-appearance: none;
  padding: 13.25px 30px;
  background-color: var(--button-current-bg, var(--button-bg));
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  color: var(--button-text);
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.app-header__login {
  --button-bg: var(--button-orange-bg);
  --button-hover-bg: var(--button-orange-hover-bg);
  --button-focus-color: var(--orange);
  --button-text: var(--black);
  appearance: none;
  -webkit-appearance: none;
  padding: 15px 30px;
  background-color: var(--button-current-bg, var(--button-bg));
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  color: var(--button-text);
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.app-header__link:not(.app-header__link--color):hover {
  color: var(--cyan);
}

.app-header__link:not(.app-header__link--color):focus-visible {
  color: var(--cyan);
  outline: none;
}

.app-header__home:focus-visible {
  outline: none;
}

.app-mobile-nav {
  position: static;
  z-index: 140;
}

.app-mobile-nav__bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  width: max-content;
  max-width: calc(100vw - 20px);
  align-items: center;
  flex-wrap: nowrap;
  gap: 10px;
  padding: 5px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 95%, transparent);
  box-shadow: 0 18px 40px rgba(34, 87, 122, 0.14);
}

.app-mobile-nav__bar--keyboard-open {
  position: absolute;
  bottom: auto;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.app-mobile-nav__bar--stopped {
  position: absolute;
}

.app-mobile-nav__home-wrap {
  flex-shrink: 0;
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    max-width 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    opacity 0.3s ease;
}

.app-mobile-nav__home-wrap--visible {
  max-width: 150px;
  opacity: 1;
}

.app-mobile-nav__home,
.app-mobile-nav__login,
.app-mobile-nav__toggle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-height: 47px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  color: var(--black);
  white-space: nowrap;
}

.app-mobile-nav__home {
  --button-bg: var(--button-light-blue-bg);
  --button-hover-bg: var(--button-light-blue-hover-bg);
  --button-focus-color: var(--light-blue);
  --button-text: var(--black);
  padding: 15px 20px;
  background-color: var(--button-current-bg, var(--button-bg));
}

.app-mobile-nav__login {
  --button-bg: var(--button-orange-bg);
  --button-hover-bg: var(--button-orange-hover-bg);
  --button-focus-color: var(--orange);
  --button-text: var(--black);
  padding: 15px 20px;
  background-color: var(--button-current-bg, var(--button-bg));
}

.app-mobile-nav__toggle {
  --button-bg: var(--button-cyan-bg);
  --button-hover-bg: var(--button-cyan-hover-bg);
  --button-focus-color: var(--cyan);
  --button-text: var(--black);
  position: relative;
  flex-direction: column;
  gap: 5px;
  width: 47px;
  min-width: 47px;
  padding: 0;
  background-color: var(--button-current-bg, var(--button-bg));
}

.app-mobile-nav__toggle-line {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background-color: var(--black);
}

.app-mobile-nav__overlay {
  position: fixed;
  inset: 0;
  background: rgba(13, 28, 42, 0.28);
  backdrop-filter: blur(8px);
}

.app-mobile-nav__panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: 50vw;
  min-width: 320px;
  max-width: 50vw;
  padding: 28px 22px 32px;
  background-color: var(--orange);
  border: 1px solid color-mix(in srgb, var(--white) 22%, transparent);
  border-radius: 10px 0 0 10px;
  box-shadow: 24px 0 60px rgba(24, 29, 40, 0.26);
  backdrop-filter: blur(20px);
  overflow: hidden;
  z-index: 1;
}

.app-mobile-nav__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 36px;
  padding: 14px 16px;
  gap: 16px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 10%, transparent);
  box-shadow:
    0 14px 30px rgba(24, 29, 40, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(14px);
}

.app-mobile-nav__brand {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.app-mobile-nav__brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 12%, transparent);
  box-shadow:
    0 14px 30px rgba(24, 29, 40, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(14px);
}

.app-mobile-nav__brand-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-mobile-nav__eyebrow {
  margin: 0;
  font-family: Oswald, sans-serif;
  font-size: 36px;
  line-height: 0.95;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--black);
}

.app-mobile-nav__brand-subtitle {
  display: none;
}

.app-mobile-nav__close,
.app-mobile-nav__toggle {
  color: var(--black);
}

.app-mobile-nav__close {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 10%, transparent);
  backdrop-filter: blur(10px);
}

.app-mobile-nav__close span {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22px;
  height: 2px;
  border-radius: 999px;
  background-color: currentColor;
}

.app-mobile-nav__close span:first-child {
  transform: translate(-50%, -50%) rotate(45deg);
}

.app-mobile-nav__close span:last-child {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.app-mobile-nav__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 22px;
}

.app-mobile-nav__link {
  display: flex;
  align-items: center;
  padding: 0;
  font-family: Oswald, sans-serif;
  font-size: clamp(30px, 5.3vw, 46px);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--black);
  text-align: left;
  opacity: 1;
  transform: translateX(0);
  animation: app-mobile-nav-link-in 0.45s ease both;
  animation-delay: calc(var(--item-index, 0) * 70ms + 90ms);
  transition: color 0.2s ease;
}

.app-mobile-nav__link--active {
  color: var(--white);
}

.app-mobile-nav__link:hover {
  color: var(--white);
}

.app-mobile-nav__link:focus-visible {
  color: var(--white);
  outline: none;
}

.app-mobile-nav__icon {
  flex-shrink: 0;
  color: var(--black);
}

.app-mobile-nav__icon--swimmer {
  width: 34px;
  height: 34px;
  stroke: currentColor;
}

.app-mobile-nav__phone {
  margin-top: 28px;
  font-family: Oswald, sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--black);
}

.app-mobile-nav-overlay-enter-active,
.app-mobile-nav-overlay-leave-active {
  transition: opacity 0.25s ease;
}

.app-mobile-nav-overlay-enter-from,
.app-mobile-nav-overlay-leave-to {
  opacity: 0;
}

.app-mobile-nav-panel-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.35s ease;
}

.app-mobile-nav-panel-leave-active {
  transition: transform 0.35s ease;
}

.app-mobile-nav-panel-enter-from {
  opacity: 0;
  transform: translateX(28px);
}

.app-mobile-nav-panel-leave-to {
  transform: translateX(100%);
}

.app-registration {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    linear-gradient(180deg, rgba(13, 30, 48, 0.24) 0%, rgba(13, 30, 48, 0.44) 100%),
    color-mix(in srgb, var(--light-blue) 18%, transparent);
  backdrop-filter: blur(12px);
  z-index: 220;
}

.app-registration__dialog {
  position: relative;
  width: min(100%, 30vw, 520px);
  max-height: min(100%, calc(var(--app-screen-height) - 48px));
  padding: 22px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 0%, transparent);
  box-shadow: 0 24px 60px color-mix(in srgb, var(--black) 18%, transparent);
  backdrop-filter: blur(18px);
  overflow: auto;
}

.app-registration__close {
  position: relative;
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 72%, transparent);
}

.app-registration__close span {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--black);
}

.app-registration__close span:first-child {
  transform: translate(-50%, -50%) rotate(45deg);
}

.app-registration__close span:last-child {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.app-registration__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.app-registration__title {
  margin: 0;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.05;
  color: var(--cyan);
  text-wrap: balance;
}

.app-registration__form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.app-registration__field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.app-registration__field-grid--single {
  grid-template-columns: minmax(0, 1fr);
}

.app-registration__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-registration__input-wrap {
  position: relative;
}

.app-registration__label {
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--white);
}

.app-registration__input {
  width: 100%;
  min-height: 48px;
  padding: 0 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 24%, var(--white));
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 84%, transparent);
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  color: var(--black);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.app-registration__input--password {
  padding-right: 56px;
}

.app-registration__input::placeholder {
  color: color-mix(in srgb, var(--black) 42%, var(--white));
}

.app-registration__input:focus-visible,
.app-registration__checkbox:focus-visible {
  outline: none;
}

.app-registration__input:focus-visible {
  border-color: color-mix(in srgb, var(--cyan) 54%, var(--white));
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--cyan) 18%, transparent);
}

.app-registration__input[aria-invalid='true'] {
  border-color: color-mix(in srgb, var(--orange) 72%, transparent);
}

.app-registration__input:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.app-registration__visibility {
  position: absolute;
  top: 50%;
  right: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: color-mix(in srgb, var(--black) 72%, var(--white));
  transform: translateY(-50%);
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.app-registration__visibility:hover,
.app-registration__visibility:focus-visible {
  color: var(--cyan);
  background: color-mix(in srgb, var(--cyan) 12%, transparent);
  outline: none;
}

.app-registration__visibility :deep(svg) {
  width: 18px;
  height: 18px;
}

.app-registration__consent {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  flex-wrap: nowrap;
}

.app-registration__checkbox {
  width: 20px;
  height: 20px;
  margin: 0;
  flex-shrink: 0;
  accent-color: var(--orange);
}

.app-registration__consent-copy {
  flex: 1 1 auto;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  color: var(--white);
}

.app-registration__error {
  display: block;
  font-size: 13px;
  line-height: 1.4;
  color: color-mix(in srgb, var(--orange) 84%, var(--black));
}

.app-registration__status {
  margin: 0;
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
}

.app-registration__status--success {
  background: color-mix(in srgb, var(--aqua) 36%, var(--white));
  color: color-mix(in srgb, var(--black) 68%, var(--white));
}

.app-registration__status--error {
  background: color-mix(in srgb, var(--orange) 16%, transparent);
  color: color-mix(in srgb, var(--orange) 84%, var(--black));
}

.app-registration__submit {
  --button-bg: var(--button-orange-bg);
  --button-hover-bg: var(--button-orange-hover-bg);
  --button-focus-color: var(--orange);
  width: 100%;
  min-height: 52px;
  margin-top: 10px;
  padding: 12px 18px;
  border-radius: 10px;
  background-color: var(--button-current-bg, var(--button-bg));
  text-align: center;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--black);
}

.app-registration__submit:disabled {
  cursor: wait;
  opacity: 0.72;
}

.app-registration__switch-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-top: 4px;
}

.app-registration__switch-copy {
  display: block;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
  color: color-mix(in srgb, var(--white) 74%, transparent);
  white-space: nowrap;
}

.app-registration__switch {
  font-size: 13px;
  font-weight: 900;
  line-height: 1.4;
  color: var(--aqua);
}

.app-registration__switch:hover,
.app-registration__switch:focus-visible {
  color: var(--white);
  outline: none;
}

.app-registration__secondary-link {
  align-self: center;
  margin-top: 2px;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.4;
  color: var(--light-blue);
}

.app-registration__secondary-link:hover,
.app-registration__secondary-link:focus-visible {
  color: var(--white);
  outline: none;
}

.app-registration-modal-enter-active,
.app-registration-modal-leave-active {
  transition: opacity 0.24s ease;
}

.app-registration-modal-enter-active .app-registration__dialog,
.app-registration-modal-leave-active .app-registration__dialog {
  transition:
    transform 0.28s ease,
    opacity 0.28s ease;
}

.app-registration-modal-enter-from,
.app-registration-modal-leave-to {
  opacity: 0;
}

.app-registration-modal-enter-from .app-registration__dialog,
.app-registration-modal-leave-to .app-registration__dialog {
  opacity: 0;
  transform: translateY(22px) scale(0.98);
}

@keyframes app-mobile-nav-link-in {
  from {
    opacity: 0;
    transform: translateX(18px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (min-width: 1024px) {
  .app-mobile-nav {
    display: none;
  }
}

@media (max-width: 1023px) {
  .app-header-wrapper {
    pointer-events: none;
  }

  .app-mobile-nav,
  .app-mobile-nav *,
  .app-registration,
  .app-registration * {
    pointer-events: auto;
  }
}

@media (max-width: 767px) {
  .app-registration {
    align-items: flex-start;
    padding: 12px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .app-mobile-nav__bar {
    bottom: 16px;
  }

  .app-mobile-nav__panel {
    width: 75vw;
    min-width: 260px;
    max-width: 75vw;
    padding: 24px 16px 28px;
  }

  .app-mobile-nav__eyebrow {
    font-size: 32px;
  }

  .app-mobile-nav__link {
    font-size: clamp(26px, 9.5vw, 38px);
  }

  .app-registration {
    padding: 12px;
  }

  .app-registration__dialog {
    margin: auto 0;
    padding: 24px 18px 18px;
    width: min(100%, 560px);
    max-height: none;
  }

  .app-registration__input {
    font-size: 16px;
  }
  .app-registration__field-grid {
    grid-template-columns: 1fr;
  }

  .app-registration__submit {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 502px) {
  .app-mobile-nav__panel {
    width: 100vw;
    min-width: 100vw;
    max-width: 100vw;
    border-radius: 0;
  }

  .app-mobile-nav__head {
    padding: 12px;
    gap: 10px;
  }

  .app-mobile-nav__brand {
    gap: 10px;
  }

  .app-registration__consent-copy {
    font-size: 11px;
  }
}
</style>

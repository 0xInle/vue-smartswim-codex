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

          <a class="app-mobile-nav__phone link-reset" href="tel:+79167290773">8 916 729 07 73</a>
        </aside>
      </Transition>
    </div>

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
            <h2 id="app-registration-title" class="app-registration__title">Регистрация</h2>
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
            <label class="app-registration__field">
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
                autocomplete="email"
                placeholder="example@mail.ru"
                :aria-invalid="Boolean(registrationErrors.email)"
              />
              <span v-if="registrationErrors.email" class="app-registration__error">
                {{ registrationErrors.email }}
              </span>
            </label>

            <div class="app-registration__field-grid">
              <label class="app-registration__field">
                <span class="app-registration__label">Пароль</span>
                <input
                  v-model="registrationForm.password"
                  class="app-registration__input"
                  type="password"
                  name="password"
                  autocomplete="new-password"
                  placeholder="Минимум 8 символов"
                  :aria-invalid="Boolean(registrationErrors.password)"
                />
                <span v-if="registrationErrors.password" class="app-registration__error">
                  {{ registrationErrors.password }}
                </span>
              </label>

              <label class="app-registration__field">
                <span class="app-registration__label">Подтвердите пароль</span>
                <input
                  v-model="registrationForm.confirmPassword"
                  class="app-registration__input"
                  type="password"
                  name="confirm-password"
                  autocomplete="new-password"
                  placeholder="Повторите пароль"
                  :aria-invalid="Boolean(registrationErrors.confirmPassword)"
                />
                <span v-if="registrationErrors.confirmPassword" class="app-registration__error">
                  {{ registrationErrors.confirmPassword }}
                </span>
              </label>
            </div>

            <label class="app-registration__consent">
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
              {{ registrationStatus === 'loading' ? 'Регистрируем...' : 'Зарегистрироваться' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="app-toast">
      <div v-if="isRegistrationToastVisible" class="app-toast" role="status" aria-live="polite">
        {{ registrationToastMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import IconSwimmer from '@/assets/images/icon-swimmer.svg'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { loadRegisteredUser, saveRegisteredUser } from '@/utils/accountStorage'
import { signUpWithPassword } from '@/utils/supabaseAuth'

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
const isRegistrationToastVisible = ref(false)
const registrationToastMessage = ref('')
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

const headerMetrics = {
  revealPoint: 0,
}

let scrollFrameId = 0
let resizeFrameId = 0
let homeScrollFrameId = 0
let keyboardFrameId = 0
let registrationCloseTimeoutId = 0
let registrationToastTimeoutId = 0
let resizeObserver = null
let shouldCloseMobileMenuAfterNavigation = false
let homeSectionRef = null
let footerSectionRef = null
let initialViewportHeight = 0
let initialViewportMetaContent = ''

const KEYBOARD_OPEN_THRESHOLD = 120
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]'

const isHomeRoute = computed(() => route.path === '/')
const isBrandVisible = computed(() => (isHomeRoute.value ? isHeaderFloating.value : true))
const hasRegisteredUser = computed(() => Boolean(registeredUser.value))
const activeFloatingRef = computed(() =>
  isMobileViewport.value ? mobileBarRef.value : headerRef.value,
)

function syncRegisteredUser() {
  registeredUser.value = loadRegisteredUser()
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
  // const floatingHeaderTop = window.innerHeight - HEADER_BOTTOM_OFFSET - headerHeight
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

function showRegistrationToast(message) {
  if (registrationToastTimeoutId) {
    window.clearTimeout(registrationToastTimeoutId)
  }

  registrationToastMessage.value = message
  isRegistrationToastVisible.value = true
  registrationToastTimeoutId = window.setTimeout(() => {
    isRegistrationToastVisible.value = false
    registrationToastTimeoutId = 0
  }, 3200)
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
  resetRegistrationFeedback()
}

function openRegistrationModal() {
  if (hasRegisteredUser.value) {
    closeMobileMenu()
    router.push('/account')
    return
  }

  closeMobileMenu()
  resetRegistrationFeedback()
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
}

function validateRegistrationForm() {
  resetRegistrationFeedback()

  if (!registrationForm.name) {
    registrationErrors.name = 'Введите имя.'
  }

  if (!registrationForm.email) {
    registrationErrors.email = 'Введите электронную почту.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationForm.email)) {
    registrationErrors.email = 'Укажите корректную почту.'
  }

  if (!registrationForm.password) {
    registrationErrors.password = 'Введите пароль.'
  } else if (registrationForm.password.length < 8) {
    registrationErrors.password = 'Пароль должен содержать минимум 8 символов.'
  }

  if (!registrationForm.confirmPassword) {
    registrationErrors.confirmPassword = 'Подтвердите пароль.'
  } else if (registrationForm.password !== registrationForm.confirmPassword) {
    registrationErrors.confirmPassword = 'Пароли не совпадают.'
  }

  if (!registrationForm.consent) {
    registrationErrors.consent = 'Нужно подтвердить согласие на обработку персональных данных.'
  }

  return !Object.values(registrationErrors).some(Boolean)
}

function validateRegistrationField(field) {
  if (field === 'name') {
    registrationErrors.name = registrationForm.name ? '' : 'Введите имя.'
    return
  }

  if (field === 'email') {
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
    if (!registrationForm.password) {
      registrationErrors.password = 'Введите пароль.'
    } else if (registrationForm.password.length < 8) {
      registrationErrors.password = 'Пароль должен содержать минимум 8 символов.'
    } else {
      registrationErrors.password = ''
    }

    if (registrationForm.confirmPassword) {
      registrationErrors.confirmPassword =
        registrationForm.password === registrationForm.confirmPassword ? '' : 'Пароли не совпадают.'
    }

    return
  }

  if (field === 'confirmPassword') {
    if (!registrationForm.confirmPassword) {
      registrationErrors.confirmPassword = 'Подтвердите пароль.'
      return
    }

    registrationErrors.confirmPassword =
      registrationForm.password === registrationForm.confirmPassword ? '' : 'Пароли не совпадают.'
    return
  }

  if (field === 'consent') {
    registrationErrors.consent = registrationForm.consent
      ? ''
      : 'Нужно подтвердить согласие на обработку персональных данных.'
  }
}

function getRegistrationSuccessMessage(payload) {
  return payload?.session
    ? 'Аккаунт создан. Теперь можно войти в личный кабинет.'
    : 'Регистрация прошла успешно. Проверьте почту, чтобы подтвердить аккаунт.'
}

function getRegistrationErrorMessage(error) {
  const message = error instanceof Error ? error.message : 'Не удалось зарегистрироваться.'

  if (/already registered/i.test(message)) {
    return 'Пользователь с такой почтой уже зарегистрирован.'
  }

  if (/password/i.test(message) && /6/i.test(message)) {
    return 'Пароль должен содержать минимум 6 символов.'
  }

  return message
}

async function handleRegistrationSubmit() {
  if (!validateRegistrationForm()) {
    return
  }

  registrationStatus.value = 'loading'
  registrationMessage.value = ''

  try {
    const payload = await signUpWithPassword({
      email: registrationForm.email,
      password: registrationForm.password,
      name: registrationForm.name,
    })

    const nextRegisteredUser = {
      id: payload?.user?.id ?? null,
      name: payload?.user?.user_metadata?.name || registrationForm.name,
      email: payload?.user?.email || registrationForm.email,
      registeredAt: payload?.user?.created_at || new Date().toISOString(),
    }

    saveRegisteredUser(nextRegisteredUser)
    registeredUser.value = nextRegisteredUser

    registrationStatus.value = 'success'
    registrationMessage.value = getRegistrationSuccessMessage(payload)
    showRegistrationToast('Регистрация прошла успешно')

    if (registrationCloseTimeoutId) {
      window.clearTimeout(registrationCloseTimeoutId)
    }

    registrationCloseTimeoutId = window.setTimeout(() => {
      closeRegistrationModal()
      router.push('/account')
    }, 700)
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
  syncRegisteredUser()
  syncViewportMode()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('focusin', handleFocusIn)
  document.addEventListener('focusout', handleFocusOut)

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

  if (registrationToastTimeoutId) {
    window.clearTimeout(registrationToastTimeoutId)
  }

  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  document.body.style.overflow = ''
  unlockViewportZoom()
})
</script>

<style scoped>
.app-header-wrapper {
  z-index: 120;
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

.app-registration__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.app-registration__consent {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  max-width: 100%;
}

.app-registration__checkbox {
  width: 20px;
  height: 20px;
  margin: 0;
  flex-shrink: 0;
  accent-color: var(--orange);
}

.app-registration__consent-copy {
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

.app-toast {
  position: fixed;
  top: 22px;
  right: 22px;
  max-width: min(360px, calc(100vw - 32px));
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--cyan) 82%, transparent);
  box-shadow: 0 18px 40px rgb(from var(--black) r g b / 18%);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.4;
  color: var(--black);
  backdrop-filter: blur(18px);
  z-index: 260;
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

.app-toast-enter-active,
.app-toast-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.app-toast-enter-from,
.app-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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
  .app-registration * ,
  .app-toast {
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

  .app-toast {
    top: 16px;
    right: 16px;
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

  .app-registration__consent {
    align-items: flex-start;
  }

  .app-registration__consent-copy {
    font-size: 12px;
    white-space: normal;
  }
}
</style>

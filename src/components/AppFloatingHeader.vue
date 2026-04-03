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

      <button class="app-header__login btn-reset">Личный кабинет</button>
    </header>

    <div v-else class="app-mobile-nav">
      <div
        ref="mobileBarRef"
        class="app-mobile-nav__bar"
        :class="{ 'app-mobile-nav__bar--stopped': isHeaderStopped }"
        :style="headerStyle"
      >
        <div
          class="app-mobile-nav__home-wrap"
          :class="{ 'app-mobile-nav__home-wrap--visible': isBrandVisible }"
        >
          <button
            type="button"
            class="app-mobile-nav__home btn-reset"
            :tabindex="isBrandVisible ? 0 : -1"
            @click="handleMobileHomeClick"
          >
            Главная
          </button>
        </div>
        <button type="button" class="app-mobile-nav__login btn-reset">Личный кабинет</button>
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

            <RouterLink
              v-for="(item, index) in mobileLinks"
              :key="item.to"
              class="app-mobile-nav__link link-reset"
              :class="{ 'app-mobile-nav__link--active': isRouteActive(item.to) }"
              :style="{ '--item-index': index + 1 }"
              :to="item.to"
              @click="closeMobileMenu"
            >
              {{ item.label }}
            </RouterLink>
          </nav>

          <a class="app-mobile-nav__phone link-reset" href="tel:+79167290773">8 916 729 07 73</a>
        </aside>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import IconSwimmer from '@/assets/images/icon-swimmer.svg'
import { RouterLink, useRoute, useRouter } from 'vue-router'

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
const headerStyle = ref({
  top: 'auto',
  bottom: `${HEADER_BOTTOM_OFFSET}px`,
})

const headerMetrics = {
  revealPoint: 0,
}

let scrollFrameId = 0
let resizeFrameId = 0
let homeScrollFrameId = 0
let resizeObserver = null
let homeSectionRef = null
let footerSectionRef = null

const isHomeRoute = computed(() => route.path === '/')
const isBrandVisible = computed(() => (isHomeRoute.value ? isHeaderFloating.value : true))
const activeFloatingRef = computed(() =>
  isMobileViewport.value ? mobileBarRef.value : headerRef.value,
)

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

    recalculateHeaderMetrics()
    updateHeaderPosition()
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
    router.push('/')
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
  isMobileMenuOpen.value = false
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function handleMobileHomeClick() {
  closeMobileMenu()
  handleHomeClick()
}

function handleKeydown(event) {
  if (event.key === 'Escape' && isMobileMenuOpen.value) {
    closeMobileMenu()
  }
}

onMounted(() => {
  syncViewportMode()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)

  nextTick(() => {
    syncRouteTargets()
    observeLayout()
    handleResize()
  })
})

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu()
    resetHeaderState()

    nextTick(() => {
      syncRouteTargets()
      observeLayout()
      handleResize()
    })
  },
)

watch(isMobileMenuOpen, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)

  if (scrollFrameId) {
    window.cancelAnimationFrame(scrollFrameId)
  }

  if (resizeFrameId) {
    window.cancelAnimationFrame(resizeFrameId)
  }

  if (homeScrollFrameId) {
    window.cancelAnimationFrame(homeScrollFrameId)
  }

  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  document.body.style.overflow = ''
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
  flex-shrink: 0;
  max-width: 0;
  padding: 15px 0;
  background-color: color-mix(in srgb, var(--light-blue) 90%, transparent);

  border-radius: 10px;
  overflow: hidden;
  transform-origin: right center;
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
  transition:
    max-width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    padding 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
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
  position: relative;
  font-size: 15px;
  font-weight: 500;
  color: var(--black);
}

.app-header__link::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -4px;
  left: 0;
  height: 1px;
  background-color: var(--black);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.2s ease;
}

.app-header__link:hover::after {
  transform: scaleX(1);
}

.app-header__link--color {
  display: block;
  height: 47px;
  appearance: none;
  -webkit-appearance: none;
  padding: 13.25px 30px;
  background-color: color-mix(in srgb, var(--cyan) 90%, transparent);
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  color: var(--black);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.app-header__login {
  appearance: none;
  -webkit-appearance: none;
  padding: 15px 30px;
  background-color: color-mix(in srgb, var(--orange) 90%, transparent);
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  color: var(--black);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.app-header__login:hover {
  background-color: color-mix(in srgb, var(--orange) 88%, transparent);
  color: var(--white);
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
  padding: 15px 20px;
  background-color: color-mix(in srgb, var(--light-blue) 90%, transparent);
}

.app-mobile-nav__login {
  padding: 15px 20px;
  background-color: color-mix(in srgb, var(--orange) 90%, transparent);
}

.app-mobile-nav__toggle {
  position: relative;
  flex-direction: column;
  gap: 5px;
  width: 47px;
  min-width: 47px;
  padding: 0;
  background-color: color-mix(in srgb, var(--cyan) 90%, transparent);
  transition: transform 0.25s ease;
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
}

.app-mobile-nav__link--active {
  color: var(--white);
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

.app-mobile-nav-panel-enter-active,
.app-mobile-nav-panel-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.35s ease;
}

.app-mobile-nav-panel-enter-from,
.app-mobile-nav-panel-leave-to {
  opacity: 0;
  transform: translateX(28px);
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
  .app-mobile-nav * {
    pointer-events: auto;
  }
}

@media (max-width: 767px) {
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
}
</style>

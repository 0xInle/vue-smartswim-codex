<template>
  <div class="app-header-wrapper">
    <header
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
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const HEADER_BOTTOM_OFFSET = 20
const FOOTER_STOP_OFFSET = 30

const headerRef = ref(null)
const isHeaderStopped = ref(false)
const isHeaderFloating = ref(false)
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

function syncRouteTargets() {
  homeSectionRef = document.querySelector('.home')
  footerSectionRef = document.querySelector('.footer')
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
  const headerHeight = headerRef.value?.offsetHeight ?? 0
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
  if (!headerRef.value) {
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
    recalculateHeaderMetrics()
    updateHeaderPosition()
  })
}

function observeLayout() {
  if (!window.ResizeObserver || !headerRef.value) {
    return
  }

  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  resizeObserver = new window.ResizeObserver(() => {
    handleResize()
  })

  resizeObserver.observe(headerRef.value)

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

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize)

  nextTick(() => {
    syncRouteTargets()
    observeLayout()
    handleResize()
  })
})

watch(
  () => route.fullPath,
  () => {
    resetHeaderState()

    nextTick(() => {
      syncRouteTargets()
      observeLayout()
      handleResize()
    })
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)

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
})
</script>

<style scoped>
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
  /* background: color-mix(in srgb, var(--white) 50%, transparent); */
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

@media (max-width: 768px) {
  .app-header-wrapper {
    position: sticky;
    bottom: 20px;
  }

  .app-header,
  .app-header--stopped {
    position: relative;
  }
}
</style>

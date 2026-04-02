<template>
  <div class="app-header-wrapper">
    <header
      ref="headerRef"
      class="app-header flex"
      :class="{ 'app-header--stopped': isHeaderStopped }"
      :style="headerStyle"
    >
      <div class="app-header__brand" :class="{ 'app-header__brand--visible': isBrandVisible }">
        <RouterLink class="app-header__home btn-reset link-reset" :tabindex="isBrandVisible ? 0 : -1" to="/">
          Главная
        </RouterLink>
      </div>

      <ul class="app-header__menu list-reset flex">
        <li class="app-header__item">
          <RouterLink class="app-header__link link-reset" to="/competitions">Соревнования</RouterLink>
        </li>
        <li class="app-header__item">
          <RouterLink class="app-header__link link-reset" to="/fees">Сборы</RouterLink>
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
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const headerRef = ref(null)
const isHeaderStopped = ref(false)
const isHeaderFloating = ref(false)
const headerStyle = ref({
  top: 'auto',
  bottom: '20px',
})

const headerMetrics = {
  revealPoint: 0,
  stopScrollY: Number.POSITIVE_INFINITY,
  maxHeaderTop: 0,
}

let scrollFrameId = 0
let resizeFrameId = 0
let resizeObserver = null
let homeSectionRef = null
let reviewsSectionRef = null

const isHomeRoute = computed(() => route.path === '/')
const isBrandVisible = computed(() => (isHomeRoute.value ? isHeaderFloating.value : true))

function syncRouteTargets() {
  homeSectionRef = document.querySelector('.home')
  reviewsSectionRef = document.querySelector('.reviews')
}

function resetHeaderState() {
  isHeaderStopped.value = false
  isHeaderFloating.value = !isHomeRoute.value
  headerStyle.value = {
    top: 'auto',
    bottom: '20px',
  }
}

function updateHeaderPosition() {
  if (!isHomeRoute.value) {
    isHeaderFloating.value = true
    return
  }

  if (!homeSectionRef) {
    isHeaderFloating.value = false
    return
  }

  const scrollY = window.scrollY
  isHeaderFloating.value = scrollY >= headerMetrics.revealPoint

  const shouldStopHeader =
    reviewsSectionRef && Number.isFinite(headerMetrics.stopScrollY)
      ? scrollY >= headerMetrics.stopScrollY
      : false

  if (shouldStopHeader === isHeaderStopped.value) {
    return
  }

  isHeaderStopped.value = shouldStopHeader

  const nextStyle = shouldStopHeader
    ? {
        top: `${headerMetrics.maxHeaderTop}px`,
        bottom: 'auto',
      }
    : {
        top: 'auto',
        bottom: '20px',
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

  if (!isHomeRoute.value || !homeSectionRef) {
    headerMetrics.revealPoint = 0
    headerMetrics.stopScrollY = Number.POSITIVE_INFINITY
    headerMetrics.maxHeaderTop = 0
    resetHeaderState()
    return
  }

  if (!reviewsSectionRef) {
    headerMetrics.revealPoint = homeSectionRef.offsetTop + homeSectionRef.offsetHeight * 0.75
    headerMetrics.stopScrollY = Number.POSITIVE_INFINITY
    headerMetrics.maxHeaderTop = 0
    isHeaderStopped.value = false
    updateHeaderPosition()
    return
  }

  const headerHeight = headerRef.value.offsetHeight
  const reviewsBottom = reviewsSectionRef.offsetTop + reviewsSectionRef.offsetHeight

  headerMetrics.revealPoint = homeSectionRef.offsetTop + homeSectionRef.offsetHeight * 0.75
  headerMetrics.stopScrollY = reviewsBottom - window.innerHeight
  headerMetrics.maxHeaderTop = reviewsBottom - headerHeight - 20
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

  if (reviewsSectionRef) {
    resizeObserver.observe(reviewsSectionRef)
  }
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
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--white) 18%, transparent) 0%,
    color-mix(in srgb, var(--cyan) 18%, transparent) 100%
  );
  backdrop-filter: blur(10px);
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
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--cyan) 34%, transparent) 0%,
    color-mix(in srgb, var(--light-blue) 24%, transparent) 100%
  );
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

.app-header__login {
  appearance: none;
  -webkit-appearance: none;
  padding: 15px 30px;
  background-color: color-mix(in srgb, var(--orange) 78%, transparent);
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

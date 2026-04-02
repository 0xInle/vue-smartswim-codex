<template>
  <section class="advantages">
    <div class="advantages__video">
      <video autoplay muted loop playsinline preload="metadata" class="advantages__video-player">
        <source src="/videos/02-video.mp4" type="video/mp4" />
        Ваш браузер не поддерживает видео.
      </video>

      <div class="advantages__overlay">
        <div class="advantages__grid">
          <div
            :ref="(element) => setCardRef(element, 0)"
            class="advantages__card advantages__card--wide"
            @pointerenter="cacheCardRect($event, 0)"
            @pointermove="updateCardTilt($event, 0)"
            @pointerleave="resetCardTilt(0)"
          >
            <span class="advantages__text">Квалифицированные специалисты</span>
          </div>

          <div
            :ref="(element) => setCardRef(element, 1)"
            class="advantages__card advantages__card--tall"
            @pointerenter="cacheCardRect($event, 1)"
            @pointermove="updateCardTilt($event, 1)"
            @pointerleave="resetCardTilt(1)"
          >
            <span class="advantages__text">
              Программы тренировок для всех возрастов и уровней подготовки
            </span>
          </div>

          <div
            :ref="(element) => setCardRef(element, 2)"
            class="advantages__card"
            @pointerenter="cacheCardRect($event, 2)"
            @pointermove="updateCardTilt($event, 2)"
            @pointerleave="resetCardTilt(2)"
          >
            <span class="advantages__text">Проведение соревнований с присуждением разрядов</span>
          </div>

          <div
            :ref="(element) => setCardRef(element, 3)"
            class="advantages__card advantages__card--accent"
            @pointerenter="cacheCardRect($event, 3)"
            @pointermove="updateCardTilt($event, 3)"
            @pointerleave="resetCardTilt(3)"
          >
            <span class="advantages__text"> 15 лет успешной работы </span>
          </div>

          <div
            :ref="(element) => setCardRef(element, 4)"
            class="advantages__card"
            @pointerenter="cacheCardRect($event, 4)"
            @pointermove="updateCardTilt($event, 4)"
            @pointerleave="resetCardTilt(4)"
          >
            <span class="advantages__text">Индивидуальный подход к каждому</span>
          </div>

          <div
            :ref="(element) => setCardRef(element, 5)"
            class="advantages__card advantages__card--wide"
            @pointerenter="cacheCardRect($event, 5)"
            @pointermove="updateCardTilt($event, 5)"
            @pointerleave="resetCardTilt(5)"
          >
            <span class="advantages__text">Регулярные тренировочные сборы</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const defaultTransform = 'translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) scale(1)'
const cardRefs = ref([])
const cardRects = []
const pendingTransforms = Array(6).fill(defaultTransform)
const frameIds = Array(6).fill(0)
let supportsInteractiveTilt = false

const setCardRef = (element, index) => {
  cardRefs.value[index] = element

  if (element) {
    element.style.transform = defaultTransform
  }
}

const scheduleTransformUpdate = (index) => {
  if (frameIds[index]) {
    return
  }

  frameIds[index] = window.requestAnimationFrame(() => {
    frameIds[index] = 0

    const element = cardRefs.value[index]

    if (element) {
      element.style.transform = pendingTransforms[index]
    }
  })
}

const cacheCardRect = (event, index) => {
  if (!supportsInteractiveTilt) {
    return
  }

  cardRects[index] = event.currentTarget.getBoundingClientRect()
}

const updateCardTilt = (event, index) => {
  if (!supportsInteractiveTilt) {
    return
  }

  const { currentTarget, clientX, clientY } = event
  const rect = cardRects[index] ?? currentTarget.getBoundingClientRect()
  const offsetX = (clientX - rect.left) / rect.width - 0.5
  const offsetY = (clientY - rect.top) / rect.height - 0.5
  const rotateY = offsetX * 10
  const rotateX = offsetY * -10
  const translateX = offsetX * 8
  const translateY = offsetY * 8

  cardRects[index] = rect
  pendingTransforms[index] =
    `translate3d(${translateX}px, ${translateY}px, 22px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
  scheduleTransformUpdate(index)
}

const resetCardTilt = (index) => {
  if (!supportsInteractiveTilt) {
    return
  }

  cardRects[index] = null
  pendingTransforms[index] = defaultTransform
  scheduleTransformUpdate(index)
}

onMounted(() => {
  supportsInteractiveTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches
})

onBeforeUnmount(() => {
  frameIds.forEach((frameId) => {
    if (frameId) {
      window.cancelAnimationFrame(frameId)
    }
  })
})
</script>

<style scoped>
.advantages {
  width: 100%;
  margin-bottom: 50px;
  content-visibility: auto;
  contain: layout paint style;
  contain-intrinsic-size: 760px;
}

.advantages__video {
  position: relative;
  min-height: 640px;
  border-radius: 10px;
  overflow: hidden;
}

.advantages__video::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--black) 58%, transparent) 0%,
    color-mix(in srgb, var(--black) 36%, transparent) 45%,
    color-mix(in srgb, var(--black) 62%, transparent) 100%
  );
  pointer-events: none;
}

.advantages__video-player {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 640px;
  object-fit: cover;
}

.advantages__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  padding: 28px;
}

.advantages__grid {
  display: grid;
  grid-template-columns: 36% 27% 27%;
  grid-template-rows: repeat(3, minmax(140px, 33.33%));
  gap: 16px;
  width: 100%;
  height: 100%;
  justify-content: space-between;
  perspective: 1200px;
}

.advantages__card {
  display: flex;
  align-items: flex-end;
  padding: 20px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--white) 18%, transparent) 0%,
    color-mix(in srgb, var(--cyan) 18%, transparent) 100%
  );
  transform-style: preserve-3d;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
  will-change: transform;
  transform: translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) scale(1);
}

.advantages__card--wide {
  grid-column: span 2;
}

.advantages__card--tall {
  grid-row: span 2;
}

.advantages__card--accent {
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--cyan) 34%, transparent) 0%,
    color-mix(in srgb, var(--light-blue) 24%, transparent) 100%
  );
}

.advantages__text {
  max-width: 320px;
  font-size: 36px;
  font-weight: 900;
  line-height: 1.05;
  color: var(--white);
  text-wrap: balance;
  text-shadow: 0 2px 12px color-mix(in srgb, var(--black) 28%, transparent);
}

@media (max-width: 1024px) {
  .advantages__video,
  .advantages__video-player {
    min-height: 560px;
  }

  .advantages__grid {
    grid-template-columns: 48% 48%;
    grid-template-rows: repeat(4, minmax(120px, 25%));
    justify-content: space-between;
  }

  .advantages__card--wide,
  .advantages__card--tall {
    grid-column: span 1;
    grid-row: span 1;
  }

  .advantages__text {
    max-width: 100%;
    font-size: 28px;
  }
}

@media (max-width: 640px) {
  .advantages {
    padding: 24px 0;
  }

  .advantages__video,
  .advantages__video-player {
    min-height: 760px;
  }

  .advantages__overlay {
    padding: 16px;
  }

  .advantages__grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, minmax(104px, auto));
    gap: 12px;
  }

  .advantages__text {
    font-size: 22px;
  }
}
</style>

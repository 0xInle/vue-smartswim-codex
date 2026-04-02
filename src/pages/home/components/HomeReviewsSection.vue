<template>
  <section class="reviews">
    <div class="container">
      <div
        ref="carouselRef"
        class="reviews__carousel"
        tabindex="0"
        @mouseenter="pauseAutoplay"
        @mouseleave="startAutoplay"
        @focusin="pauseAutoplay"
        @focusout="startAutoplay"
        @keydown.left.prevent="goToPrevious"
        @keydown.right.prevent="goToNext"
      >
        <div class="reviews__stage">
          <article
            v-for="(review, index) in reviews"
            :key="review.name"
            class="reviews__card"
            :class="{ 'reviews__card--active': index === activeIndex }"
            :style="cardStyles[index]"
          >
            <p class="reviews__text">{{ review.text }}</p>
            <div class="reviews__meta">
              <span class="reviews__name">{{ review.name }}</span>
            </div>
          </article>
        </div>

        <div class="reviews__controls">
          <button type="button" class="reviews__arrow btn-reset" @click="goToPrevious">
            <span class="reviews__arrow-icon" aria-hidden="true">‹</span>
          </button>

          <div class="reviews__dots">
            <button
              v-for="(_, index) in reviews"
              :key="`dot-${index}`"
              type="button"
              class="reviews__dot btn-reset"
              :class="{ 'reviews__dot--active': index === activeIndex }"
              @click="goToReview(index)"
            ></button>
          </div>

          <button type="button" class="reviews__arrow btn-reset" @click="goToNext">
            <span class="reviews__arrow-icon" aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const reviews = [
  {
    name: 'Марина К.',
    text: 'Ребенок начал ходить на тренировки с удовольствием. За несколько месяцев появилась уверенность в воде и заметный прогресс в технике.',
  },
  {
    name: 'Алексей П.',
    text: 'Очень спокойная и профессиональная атмосфера. Тренеры умеют объяснить сложные вещи простым языком и взрослым, и детям.',
  },
  {
    name: 'Екатерина Л.',
    text: 'Нравится, что в школе следят не только за результатом, но и за тем, чтобы тренировки были комфортными и безопасными.',
  },
  {
    name: 'Игорь С.',
    text: 'Пришел улучшить технику для любительских стартов. Получил понятный план, внимание к деталям и реальный рост результатов.',
  },
  {
    name: 'Ольга В.',
    text: 'Тренировки хорошо структурированы, без хаоса. Видно, что у команды есть система и большой практический опыт.',
  },
  {
    name: 'Дмитрий Н.',
    text: 'Порадовал индивидуальный подход. Даже в групповых занятиях тренер замечает ошибки и сразу корректирует технику.',
  },
  {
    name: 'Анна Р.',
    text: 'После нескольких недель занятий ребенок перестал бояться глубины. Для нашей семьи это был очень важный шаг.',
  },
  {
    name: 'Светлана М.',
    text: 'Красивый процесс обучения без давления. Много внимания дисциплине, технике и мотивации, поэтому хочется продолжать.',
  },
  {
    name: 'Павел Т.',
    text: 'Понравилось, что здесь думают о долгом результате, а не просто проводят занятие. Все последовательно и очень понятно.',
  },
  {
    name: 'Юлия Б.',
    text: 'Сын стал увереннее не только в бассейне, но и в целом. Соревновательная практика дала ему отличную внутреннюю опору.',
  },
  {
    name: 'Виктор Е.',
    text: 'Отдельно отмечу организацию сборов и соревнований. Все собрано аккуратно, без лишней суеты и с вниманием к детям.',
  },
  {
    name: 'Полина А.',
    text: 'Нравится минималистичный, спокойный подход и уважительное общение. Это место, куда действительно приятно возвращаться.',
  },
  {
    name: 'Кирилл Ж.',
    text: 'Занимаюсь для себя, но прогресс ощущается как у спортивной подготовки. Стало легче дышать, плыть и держать темп.',
  },
  {
    name: 'Наталья Ф.',
    text: 'Тренеры умеют поддержать и при этом не снижать планку. Это редкое сочетание, которое очень мотивирует.',
  },
  {
    name: 'Роман Д.',
    text: 'Одна из самых аккуратных школ, что я видел. Хорошая методика, эстетичная подача и очень сильная тренерская команда.',
  },
]

const activeIndex = ref(0)
const carouselRef = ref(null)
const isCarouselVisible = ref(true)
const autoplayDelay = 2600
let autoplayId = null
let visibilityObserver = null

const getRelativeIndex = (index) => {
  const total = reviews.length
  let difference = index - activeIndex.value

  if (difference > total / 2) {
    difference -= total
  }

  if (difference < -total / 2) {
    difference += total
  }

  return difference
}

const transforms = {
  0: 'translateX(-50%) translateZ(0px) scale(1)',
  1: 'translateX(calc(-50% + 270px)) rotateY(-12deg) scale(0.92)',
  '-1': 'translateX(calc(-50% - 270px)) rotateY(12deg) scale(0.92)',
  2: 'translateX(calc(-50% + 470px)) rotateY(-18deg) scale(0.82)',
  '-2': 'translateX(calc(-50% - 470px)) rotateY(18deg) scale(0.82)',
}

const filterMap = {
  0: 'none',
  1: 'saturate(0.92) brightness(0.98)',
  '-1': 'saturate(0.92) brightness(0.98)',
  2: 'saturate(0.84) brightness(0.94)',
  '-2': 'saturate(0.84) brightness(0.94)',
}

const cardStyles = computed(() =>
  reviews.map((_, index) => {
    const relativeIndex = getRelativeIndex(index)
    const absIndex = Math.abs(relativeIndex)

    if (absIndex > 2) {
      return {
        opacity: 0,
        pointerEvents: 'none',
        transform: 'translateX(-50%) scale(0.84)',
        filter: 'none',
        zIndex: 0,
      }
    }

    return {
      opacity: 1,
      filter: filterMap[relativeIndex],
      transform: transforms[relativeIndex],
      zIndex: 10 - absIndex,
    }
  }),
)

const goToReview = (index) => {
  activeIndex.value = index
  restartAutoplay()
}

const goToNext = () => {
  activeIndex.value = (activeIndex.value + 1) % reviews.length
  restartAutoplay()
}

const goToPrevious = () => {
  activeIndex.value = (activeIndex.value - 1 + reviews.length) % reviews.length
  restartAutoplay()
}

const pauseAutoplay = () => {
  if (autoplayId) {
    window.clearInterval(autoplayId)
    autoplayId = null
  }
}

const startAutoplay = () => {
  if (!isCarouselVisible.value || document.hidden) {
    return
  }

  pauseAutoplay()
  autoplayId = window.setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % reviews.length
  }, autoplayDelay)
}

const restartAutoplay = () => {
  startAutoplay()
}

const handleVisibilityChange = () => {
  if (document.hidden) {
    pauseAutoplay()
    return
  }

  startAutoplay()
}

onMounted(() => {
  if (window.IntersectionObserver && carouselRef.value) {
    visibilityObserver = new window.IntersectionObserver(
      ([entry]) => {
        isCarouselVisible.value = entry?.isIntersecting ?? false

        if (isCarouselVisible.value) {
          startAutoplay()
          return
        }

        pauseAutoplay()
      },
      {
        threshold: 0.2,
      },
    )

    visibilityObserver.observe(carouselRef.value)
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  startAutoplay()
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  if (visibilityObserver) {
    visibilityObserver.disconnect()
  }

  pauseAutoplay()
})
</script>

<style scoped>
.reviews {
  padding: 30px 0 100px;
  overflow: hidden;
  content-visibility: auto;
  contain: layout paint style;
  contain-intrinsic-size: 560px;
}

.reviews__carousel {
  position: relative;
  outline: none;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent 0,
    rgb(0 0 0 / 1) 8%,
    rgb(0 0 0 / 1) 92%,
    transparent 100%
  );
  mask-image: linear-gradient(
    90deg,
    transparent 0,
    rgb(0 0 0 / 1) 8%,
    rgb(0 0 0 / 1) 92%,
    transparent 100%
  );
}

.reviews__stage {
  position: relative;
  min-height: 200px;
  perspective: 1600px;
  transform-style: preserve-3d;
}

.reviews__card {
  position: absolute;
  top: 0;
  left: 50%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 420px;
  min-height: 200px;
  padding: 28px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  overflow: hidden;
  isolation: isolate;
  backface-visibility: hidden;
  box-shadow:
    0 20px 44px color-mix(in srgb, var(--black) 14%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--white) 78%, transparent);
  background: var(--white);
  transition:
    transform 0.7s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.55s ease,
    filter 0.55s ease,
    border-color 0.4s ease,
    background 0.4s ease,
    box-shadow 0.4s ease;
}

.reviews__card--active {
  border-color: color-mix(in srgb, var(--cyan) 42%, var(--white));
  box-shadow:
    0 26px 52px color-mix(in srgb, var(--cyan) 16%, transparent),
    0 20px 44px color-mix(in srgb, var(--black) 14%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--white) 86%, transparent);
  background: var(--white);
}

.reviews__text {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.45;
  color: var(--black);
}

.reviews__meta {
  padding-top: 24px;
}

.reviews__name {
  display: inline-block;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.4px;
  color: var(--cyan);
}

.reviews__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 50px;
}

.reviews__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--white) 20%, transparent) 0%,
    color-mix(in srgb, var(--very-light-blue) 22%, transparent) 100%
  );
  transition:
    background 0.25s ease,
    border-color 0.25s ease,
    color 0.25s ease;
}

.reviews__arrow:hover {
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--white) 28%, transparent) 0%,
    color-mix(in srgb, var(--very-light-blue) 30%, transparent) 100%
  );
  border-color: color-mix(in srgb, var(--cyan) 38%, var(--white));
}

.reviews__arrow-icon {
  font-size: 28px;
  line-height: 1;
  color: var(--black);
}

.reviews__dots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  max-width: 420px;
}

.reviews__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background-color: color-mix(in srgb, var(--light-blue) 82%, var(--white));
  border: 1px solid color-mix(in srgb, var(--cyan) 28%, var(--white));
  transition:
    width 0.25s ease,
    background-color 0.25s ease,
    border-color 0.25s ease;
}

.reviews__dot--active {
  width: 34px;
  background-color: color-mix(in srgb, var(--cyan) 88%, var(--white));
  border-color: color-mix(in srgb, var(--cyan) 70%, var(--white));
}

@media (max-width: 1024px) {
  .reviews__stage {
    min-height: 240px;
  }

  .reviews__card {
    width: 360px;
    min-height: 240px;
    padding: 24px;
  }

  .reviews__text {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .reviews {
    padding: 24px 0 132px;
  }

  .reviews__stage {
    min-height: 220px;
  }

  .reviews__card {
    width: calc(100% - 48px);
    min-height: 220px;
    padding: 20px;
  }

  .reviews__text {
    font-size: 18px;
  }
}

@media (max-width: 640px) {
  .reviews__carousel {
    -webkit-mask-image: none;
    mask-image: none;
  }

  .reviews__stage {
    min-height: 200px;
    perspective: none;
  }

  .reviews__card {
    width: calc(100% - 24px);
    min-height: 200px;
  }

  .reviews__controls {
    gap: 12px;
    margin-top: 50px;
  }

  .reviews__dots {
    gap: 8px;
    max-width: 220px;
  }
}
</style>

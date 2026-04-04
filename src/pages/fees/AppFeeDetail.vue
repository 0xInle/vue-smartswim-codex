<template>
  <section v-if="camp" class="fee-detail">
    <div class="container">
      <div class="fee-detail__hero">
        <div class="fee-detail__hero-grid">
          <div class="fee-detail__content">
            <span class="fee-detail__eyebrow">{{ camp.locationShort }}</span>
            <h1 class="fee-detail__title">{{ camp.title }}</h1>
            <p class="fee-detail__date">{{ camp.dateLabel }}</p>
            <p class="fee-detail__status">{{ camp.statusText }}</p>

            <div class="fee-detail__summary">
              <p
                v-for="paragraph in camp.summary.split('\n\n')"
                :key="paragraph"
                class="fee-detail__summary-text"
              >
                {{ paragraph }}
              </p>
            </div>

            <div class="fee-detail__hero-meta">
              <div class="fee-detail__meta-card">
                <span class="fee-detail__meta-label">Возраст</span>
                <span class="fee-detail__meta-value">{{ camp.age }}</span>
              </div>
              <div class="fee-detail__meta-card">
                <span class="fee-detail__meta-label">Уровень</span>
                <span class="fee-detail__meta-value">{{ camp.level }}</span>
              </div>
              <div class="fee-detail__meta-card">
                <span class="fee-detail__meta-label">Локация</span>
                <span class="fee-detail__meta-value">{{ camp.address }}</span>
              </div>
              <div class="fee-detail__meta-card">
                <span class="fee-detail__meta-label">Стоимость</span>
                <span class="fee-detail__meta-value">{{ camp.price }}</span>
                <span class="fee-detail__meta-note">{{ camp.priceNote }}</span>
              </div>
            </div>
          </div>

          <div class="fee-detail__media">
            <img :src="camp.detailImage" :alt="camp.detailAlt" class="fee-detail__image" />
          </div>
        </div>
      </div>

      <div class="fee-detail__intro-grid">
        <div class="fee-detail__intro-copy">
          <span class="fee-detail__eyebrow">О сборе</span>
          <h2 class="fee-detail__section-title">Как устроены сборы</h2>
          <p v-for="paragraph in camp.intro" :key="paragraph" class="fee-detail__text">
            {{ paragraph }}
          </p>
        </div>

        <aside class="fee-detail__reservation">
          <span class="fee-detail__reservation-label">Статус набора</span>
          <strong class="fee-detail__reservation-value">{{ camp.bookingStatusShort }}</strong>
          <p class="fee-detail__reservation-text">{{ camp.statusText }}</p>
          <a
            :href="camp.formLink"
            target="_blank"
            rel="noreferrer"
            class="fee-detail__reservation-action link-reset"
          >
            Оставить заявку
          </a>
        </aside>
      </div>

      <section class="fee-detail__schedule">
        <div class="fee-detail__section-head">
          <h2 class="fee-detail__section-title">Расписание</h2>
        </div>

        <div class="fee-detail__timeline">
          <article
            v-for="(item, index) in camp.dailySchedule"
            :key="`${camp.slug}-${item.time}`"
            :ref="(element) => setTimelineItemRef(element, index)"
            class="fee-detail__timeline-item"
            :class="{ 'fee-detail__timeline-item--visible': visibleTimelineItems[index] }"
          >
            <div class="fee-detail__timeline-time-shell">
              <span class="fee-detail__timeline-time">{{ item.time }}</span>
            </div>
            <div class="fee-detail__timeline-card">
              <span class="fee-detail__timeline-title">{{ item.title }}</span>
            </div>
          </article>
        </div>
      </section>

      <section class="fee-detail__program" :style="programSectionStyle">
        <div class="fee-detail__program-copy">
          <span class="fee-detail__eyebrow">Фокус работы</span>
          <h2 class="fee-detail__section-title">Программа сбора</h2>
          <p class="fee-detail__text">{{ camp.focusLead }}</p>
          <p class="fee-detail__program-note">{{ camp.focusNote }}</p>
        </div>

        <div class="fee-detail__program-grid">
          <article v-for="item in camp.focusItems" :key="item" class="fee-detail__program-card">
            <p class="fee-detail__program-card-text">{{ item }}</p>
          </article>
        </div>
      </section>

      <section class="fee-detail__included">
        <div class="fee-detail__section-head">
          <h2 class="fee-detail__section-title">Стоимость сбора</h2>
        </div>

        <div class="fee-detail__price-banner">
          <div>
            <strong class="fee-detail__price-value">{{ camp.price }}</strong>
            <p class="fee-detail__price-note">{{ camp.priceNote }}</p>
          </div>
          <a
            :href="camp.formLink"
            target="_blank"
            rel="noreferrer"
            class="fee-detail__price-action link-reset"
          >
            Заполнить форму
          </a>
        </div>

        <div class="fee-detail__included-grid">
          <article v-for="item in camp.includedItems" :key="item" class="fee-detail__included-card">
            <span class="fee-detail__included-icon" aria-hidden="true"></span>
            <span class="fee-detail__included-text">{{ item }}</span>
          </article>
        </div>
      </section>
    </div>

    <HomeFooterSection />
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import HomeFooterSection from '@/pages/home/components/HomeFooterSection.vue'
import { getFeeCampBySlug } from '@/pages/fees/feesData'
import { publicAsset } from '@/utils/publicAsset'

const route = useRoute()
const camp = computed(() => getFeeCampBySlug(route.params.slug))
const timelineItemRefs = ref([])
const visibleTimelineItems = ref([])
const programSectionStyle = {
  '--fee-program-image': `url(${publicAsset('/images/16-img.webp')})`,
}

let timelineObserver

function setTimelineItemRef(element, index) {
  if (!element) {
    return
  }

  timelineItemRefs.value[index] = element
}

function setupTimelineObserver() {
  timelineObserver?.disconnect()
  visibleTimelineItems.value = camp.value?.dailySchedule.map(() => false) ?? []
  timelineItemRefs.value = []

  timelineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const index = Number(entry.target.dataset.timelineIndex)

        if (entry.isIntersecting && Number.isFinite(index)) {
          visibleTimelineItems.value[index] = true
          timelineObserver?.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.3,
      rootMargin: '0px 0px -10% 0px',
    },
  )
}

function resetScrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  })

  window.setTimeout(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, 80)
}

onMounted(() => {
  resetScrollToTop()
})

watch(
  camp,
  async () => {
    resetScrollToTop()
    setupTimelineObserver()
    await nextTick()

    timelineItemRefs.value.forEach((element, index) => {
      if (!element) {
        return
      }

      element.dataset.timelineIndex = String(index)
      timelineObserver?.observe(element)
    })
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  timelineObserver?.disconnect()
})
</script>

<style scoped>
.fee-detail {
  padding-top: 8px;
}

.fee-detail__hero {
  margin-bottom: 28px;
}

.fee-detail__hero-grid,
.fee-detail__intro-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.86fr);
  gap: 22px;
}

.fee-detail__content,
.fee-detail__media,
.fee-detail__intro-copy,
.fee-detail__reservation,
.fee-detail__program-copy,
.fee-detail__price-banner,
.fee-detail__included-card,
.fee-detail__timeline-card,
.fee-detail__program-card {
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  overflow: hidden;
  box-shadow:
    0 18px 38px rgb(from var(--black) r g b / 6%),
    inset 0 1px 0 rgb(from var(--white) r g b / 28%);
}

.fee-detail__content,
.fee-detail__intro-copy,
.fee-detail__program-copy,
.fee-detail__reservation,
.fee-detail__price-banner,
.fee-detail__timeline-card,
.fee-detail__included-card,
.fee-detail__program-card {
  background: rgb(from var(--white) r g b / 72%);
}

.fee-detail__content,
.fee-detail__intro-copy,
.fee-detail__program-copy {
  padding: 28px;
}

.fee-detail__media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 420px;
}

.fee-detail__image {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 420px;
  object-fit: cover;
}

.fee-detail__eyebrow,
.fee-detail__meta-label,
.fee-detail__reservation-label {
  display: inline-flex;
  align-self: flex-start;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 54%, var(--white));
}

.fee-detail__title,
.fee-detail__section-title {
  margin: 0;
  margin-bottom: 20px;
  line-height: 0.95;
}

.fee-detail__title {
  margin: 10px 0;
  font-size: clamp(34px, 5vw, 52px);
}

.fee-detail__date {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 500;
}

.fee-detail__status,
.fee-detail__summary-text,
.fee-detail__text,
.fee-detail__reservation-text,
.fee-detail__price-note,
.fee-detail__program-note {
  font-size: 16px;
  margin: 0;
  line-height: 1.75;
}

.fee-detail__status {
  display: inline-flex;
  align-self: flex-start;
  margin-bottom: 18px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgb(from var(--orange) r g b / 16%);
  background: rgb(from var(--orange) r g b / 10%);
  font-size: 13px;
  font-weight: 800;
  color: color-mix(in srgb, var(--orange) 74%, var(--black));
}

.fee-detail__summary {
  display: grid;
  gap: 12px;
}

.fee-detail__hero-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 22px;
}

.fee-detail__meta-card {
  display: grid;
  gap: 6px;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--white) 26%, transparent);
  background: rgb(from var(--white) r g b / 12%);
  box-shadow:
    inset 0 1px 0 rgb(from var(--white) r g b / 18%),
    0 8px 24px rgb(from var(--black) r g b / 5%);
}

.fee-detail__meta-value {
  font-weight: 800;
  line-height: 1.5;
  white-space: pre-line;
}

.fee-detail__meta-note {
  font-size: 14px;
  color: color-mix(in srgb, var(--black) 66%, var(--white));
}

.fee-detail__intro-grid,
.fee-detail__schedule,
.fee-detail__program,
.fee-detail__included {
  margin-top: 24px;
  margin-bottom: 50px;
}

.fee-detail__program {
  position: relative;
  display: grid;
  padding: 50px 0;
  grid-template-columns: minmax(280px, 0.9fr) minmax(340px, 1fr);
  gap: 28px;
  align-items: start;
  isolation: isolate;
}

.fee-detail__program::before {
  content: '';
  position: absolute;
  z-index: -1;
  top: 0;
  bottom: 0;
  left: -50%;
  right: -50%;
  background: var(--fee-program-image) center / cover no-repeat;
  opacity: 1;
  border-radius: 10px;
  pointer-events: none;
}

.fee-detail__reservation {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 24px;
}

.fee-detail__reservation-value,
.fee-detail__price-value {
  font-family: Oswald;
  line-height: 1;
}

.fee-detail__reservation-value {
  font-size: 40px;
}

.fee-detail__reservation-action,
.fee-detail__price-action {
  --button-bg: var(--button-cyan-bg);
  --button-hover-bg: var(--button-cyan-hover-bg);
  --button-focus-color: var(--cyan);
  --button-text: var(--black);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: max-content;
  min-height: 48px;
  padding: 12px 26px;
  border-radius: 10px;
  background-color: var(--button-current-bg, var(--button-bg));
  font-size: 15px;
  font-weight: 500;
  color: var(--button-text);
}

.fee-detail__section-head {
  margin-bottom: 18px;
}

.fee-detail__schedule .fee-detail__section-head {
  text-align: center;
}

.fee-detail__section-title {
  font-size: clamp(28px, 4vw, 46px);
}

.fee-detail__timeline {
  position: relative;
  display: grid;
  gap: 6px;
  max-width: 820px;
  margin-inline: auto;
}

.fee-detail__timeline-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.6s ease,
    transform 0.6s ease;
}

.fee-detail__timeline-item--visible {
  opacity: 1;
  transform: translateY(0);
}

.fee-detail__timeline-time-shell,
.fee-detail__timeline-card {
  position: relative;
  z-index: 1;
  background: var(--white);
}

.fee-detail__timeline-time-shell {
  padding: 8px 16px;
  border: 1px solid color-mix(in srgb, var(--white) 22%, transparent);
  border-radius: 999px;
}

.fee-detail__timeline-card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, 520px);
  padding: 14px 22px;
  box-shadow: none;
  text-align: center;
}

.fee-detail__timeline-time {
  font-family: Oswald;
  font-size: clamp(24px, 3vw, 32px);
  line-height: 1;
}

.fee-detail__timeline-title,
.fee-detail__included-text {
  line-height: 1.6;
}

.fee-detail__program-copy {
  text-align: left;
  background: rgb(from var(--white) r g b / 26%);
}

.fee-detail__program-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  width: 100%;
}

.fee-detail__program-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  min-height: 132px;
  padding: 20px 18px;
  background: rgb(from var(--white) r g b / 24%);
  box-shadow:
    0 14px 30px rgb(from var(--black) r g b / 10%),
    inset 0 1px 0 rgb(from var(--white) r g b / 32%);
}

.fee-detail__program-card-text {
  margin: 0;
  font-weight: 700;
  line-height: 1.6;
}

.fee-detail__program-note {
  margin-top: 18px;
  font-weight: 700;
}

.fee-detail__price-banner {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  padding: 24px;
  margin-bottom: 36px;
}

.fee-detail__price-value {
  display: block;
  margin-top: 8px;
  font-size: clamp(40px, 5vw, 68px);
}

.fee-detail__included-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 120px;
}

.fee-detail__included-card {
  display: flex;
  min-height: 100%;
  gap: 14px;
  align-items: flex-start;
  padding: 18px;
}

.fee-detail__included-icon {
  display: inline-flex;
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: 6px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--cyan) 82%, var(--white));
  box-shadow: 0 0 0 5px rgb(from var(--cyan) r g b / 14%);
}

@media (max-width: 1100px) {
  .fee-detail__included-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fee-detail__program-grid {
    gap: 16px;
  }
}

@media (max-width: 900px) {
  .fee-detail__hero-grid,
  .fee-detail__intro-grid,
  .fee-detail__program {
    grid-template-columns: 1fr;
  }

  .fee-detail__included-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .fee-detail__title {
    font-size: clamp(34px, 10vw, 42px);
  }

  .fee-detail__content,
  .fee-detail__intro-copy,
  .fee-detail__program-copy,
  .fee-detail__reservation,
  .fee-detail__price-banner {
    padding: 20px;
  }

  .fee-detail__price-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .fee-detail__hero-meta,
  .fee-detail__included-grid,
  .fee-detail__program-grid {
    grid-template-columns: 1fr;
  }

  .fee-detail__timeline-item {
    gap: 6px;
  }

  .fee-detail__timeline-card {
    min-height: 96px;
    padding: 12px 18px;
  }

  .fee-detail__media,
  .fee-detail__image {
    min-height: 280px;
  }
}

@media (max-width: 420px) {
  .fee-detail__title {
    font-size: clamp(30px, 9vw, 34px);
  }
}
</style>

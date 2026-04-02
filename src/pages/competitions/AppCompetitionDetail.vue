<template>
  <section v-if="competition" class="competition-detail">
    <div class="container">
      <div class="competition-detail__hero">
        <div class="competition-detail__hero-grid">
          <div class="competition-detail__content">
            <span class="competition-detail__badge">{{ competition.badge }}</span>
            <h1 class="competition-detail__title">{{ competition.title }}</h1>
            <p class="competition-detail__subtitle">{{ competition.subtitle }}</p>
            <p class="competition-detail__text">{{ competition.description }}</p>

            <div class="competition-detail__meta">
              <div class="competition-detail__meta-card">
                <span class="competition-detail__meta-label">Сезон</span>
                <span class="competition-detail__meta-value">{{ competition.season }}</span>
              </div>
              <div class="competition-detail__meta-card">
                <span class="competition-detail__meta-label">Локация</span>
                <span class="competition-detail__meta-value">{{ competition.location }}</span>
              </div>
            </div>
          </div>

          <div class="competition-detail__media">
            <img
              :src="competition.image"
              :alt="competition.imageAlt"
              class="competition-detail__image"
            />
          </div>
        </div>
      </div>

      <div class="competition-detail__calendar">
        <div class="competition-detail__cards">
          <article
            v-for="card in competition.cards"
            :key="`${competition.slug}-${card.title}`"
            class="competition-detail__card"
          >
            <div class="competition-detail__card-head">
              <span class="competition-detail__card-title">{{ card.title }}</span>
              <button type="button" class="competition-detail__card-action">Подробнее</button>
            </div>

            <div class="competition-detail__card-body">
              <div class="competition-detail__card-date">{{ card.date }}</div>
              <div class="competition-detail__card-place">{{ card.place }}</div>
              <div class="competition-detail__card-meta">{{ card.meta }}</div>
              <div class="competition-detail__card-text">
                <div
                  class="competition-detail__card-text-column competition-detail__card-text-column--distance"
                >
                  <span
                    v-for="item in formatCardDescription(card.description)"
                    :key="`${card.title}-${item.distance}`"
                    class="competition-detail__card-distance"
                  >
                    {{ item.distance }}
                  </span>
                </div>

                <div
                  class="competition-detail__card-text-column competition-detail__card-text-column--stroke"
                >
                  <span
                    v-for="item in formatCardDescription(card.description)"
                    :key="`${card.title}-${item.distance}-${item.label}`"
                    class="competition-detail__card-stroke"
                  >
                    {{ item.label }}
                  </span>
                </div>
              </div>
            </div>

            <div class="competition-detail__card-status">
              {{ card.status }}
            </div>
          </article>
        </div>
      </div>

      <div v-if="competition.faqSections?.length" class="competition-detail__faq">
        <div class="competition-detail__faq-shell">
          <div
            v-for="(section, sectionIndex) in competition.faqSections"
            :key="section.title || sectionIndex"
            class="competition-detail__faq-group"
          >
            <div
              v-for="item in section.items"
              :key="item.question"
              :class="{
                'competition-detail__faq-item--open':
                  openFaqKey === `${sectionIndex}-${item.question}`,
              }"
              class="competition-detail__faq-item"
            >
              <button
                type="button"
                class="competition-detail__faq-summary"
                :aria-expanded="openFaqKey === `${sectionIndex}-${item.question}`"
                @click="toggleFaqItem(`${sectionIndex}-${item.question}`)"
              >
                <span class="competition-detail__faq-question">{{ item.question }}</span>
                <span class="competition-detail__faq-icon" aria-hidden="true"></span>
              </button>

              <div class="competition-detail__faq-answer-shell">
                <div class="competition-detail__faq-answer">
                  <p class="competition-detail__faq-entry-answer">{{ item.answer }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <HomeFooterSection />
  </section>
</template>

<script setup>
import HomeFooterSection from '@/pages/home/components/HomeFooterSection.vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getCompetitionBySlug } from './competitionData'

const route = useRoute()

const competition = computed(() => getCompetitionBySlug(route.params.slug))
const openFaqKey = ref(null)

function toggleFaqItem(key) {
  openFaqKey.value = openFaqKey.value === key ? null : key
}

function formatCardDescription(description) {
  return description
    .split(',')
    .map((item) => item.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .map((item) => {
      const match = item.match(/^(\d+\s*м)\s+(.+)$/i)

      if (!match) {
        return {
          distance: item,
          label: '',
        }
      }

      return {
        distance: match[1],
        label: match[2],
      }
    })
}
</script>

<style scoped>
.competition-detail {
  padding-top: 8px;
}

.competition-detail__hero {
  margin-bottom: 50px;
}

.competition-detail__hero-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.05fr);
  gap: 22px;
  align-items: center;
}

.competition-detail__media,
.competition-detail__content,
.competition-detail__card {
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  overflow: hidden;
}

.competition-detail__media {
  min-height: 360px;
}

.competition-detail__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 28px;
}

.competition-detail__badge {
  display: inline-flex;
  align-self: flex-start;
  margin-bottom: 20px;
  background: color-mix(in srgb, var(--white) 20%, transparent);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.competition-detail__title {
  margin: 0 0 10px;
  font-family: Oswald;
  font-size: clamp(32px, 4vw, 52px);
  line-height: 0.94;
  text-transform: uppercase;
}

.competition-detail__subtitle {
  margin: 0 0 18px;
  font-size: 14px;
  font-weight: 500;
}

.competition-detail__text {
  max-width: 620px;
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
}

.competition-detail__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 20px 0 0;
}

.competition-detail__meta-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--white) 28%, transparent);
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 10%);
  box-shadow:
    inset 0 1px 0 rgb(from var(--white) r g b / 20%),
    0 8px 24px rgb(from var(--black) r g b / 5%);
}

.competition-detail__meta-label {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 56%, var(--white));
}

.competition-detail__meta-value {
  font-size: 15px;
  font-weight: 800;
  line-height: 1.5;
  white-space: pre-line;
}

.competition-detail__image {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 360px;
  object-fit: cover;
}

.competition-detail__calendar {
  position: relative;
  z-index: 0;
  padding-bottom: 70px;
}

.competition-detail__calendar::after {
  content: '';
  position: absolute;
  top: -24px;
  right: 50%;
  bottom: 0;
  left: calc(50% - 50vw);
  background-color: var(--very-light-blue);
  z-index: -1;
}

.competition-detail__cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.competition-detail__card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border: 1px solid rgb(from var(--white) r g b / 30%);
  background: linear-gradient(
    180deg,
    rgb(from var(--white) r g b / 30%) 0%,
    rgb(from var(--white) r g b / 16%) 45%,
    rgb(from var(--light-blue) r g b / 12%) 100%
  );
  box-shadow:
    inset 0 1px 0 rgb(from var(--white) r g b / 45%),
    inset 0 -1px 0 rgb(from var(--white) r g b / 12%),
    0 18px 40px rgb(from var(--black) r g b / 8%);
}

.competition-detail__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--white) 18%, transparent);
}

.competition-detail__card-title {
  font-family: Oswald;
  font-size: 26px;
  line-height: 1;
  text-transform: uppercase;
}

.competition-detail__card-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 10px 18px;
  border: 1px solid color-mix(in srgb, var(--cyan) 72%, var(--white));
  border-radius: 10px;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: var(--cyan);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.competition-detail__card-action:hover {
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--cyan) 10%, var(--white));
}

.competition-detail__card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px 20px;
}

.competition-detail__card-date {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.15;
}

.competition-detail__card-place {
  font-size: 14px;
  font-weight: 900;
}

.competition-detail__card-meta {
  font-size: 13px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--black) 68%, var(--white));
}

.competition-detail__card-text {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 16px;
  align-items: start;
}

.competition-detail__card-text-column {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.competition-detail__card-text-column--distance {
  padding-right: 16px;
  border-right: 1px solid color-mix(in srgb, var(--cyan) 48%, var(--white));
}

.competition-detail__card-distance {
  display: flex;
  align-items: center;
  font-weight: 900;
  line-height: 1.6;
  white-space: nowrap;
}

.competition-detail__card-stroke {
  display: flex;
  align-items: center;
  line-height: 1.6;
  color: color-mix(in srgb, var(--black) 82%, var(--white));
}

.competition-detail__card-status {
  margin-top: auto;
  padding: 0 20px 20px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cyan);
}

.competition-detail__faq {
  padding: 70px 0 100px;
}

.competition-detail__faq-shell {
  width: 75%;
  margin: 0 auto;
}

.competition-detail__faq-group {
  display: grid;
  gap: 10px;
}

.competition-detail__faq-group + .competition-detail__faq-group {
  margin-top: 50px;
}

.competition-detail__faq-item {
  padding: 0 22px;
  border-top: 1px solid color-mix(in srgb, var(--black) 14%, var(--white));
  border-bottom: 1px solid color-mix(in srgb, var(--black) 14%, var(--white));
}

.competition-detail__faq-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 18px;
  padding: 16px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.competition-detail__faq-question {
  font-family: Oswald;
  font-size: 20px;
  font-weight: 300;
  line-height: 1.35;
  letter-spacing: 0.01em;
}

.competition-detail__faq-icon {
  position: relative;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.competition-detail__faq-icon::before,
.competition-detail__faq-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 1px;
  background: color-mix(in srgb, var(--black) 72%, var(--white));
  transform: translate(-50%, -50%);
  transition: transform 0.2s ease;
}

.competition-detail__faq-icon::after {
  transform: translate(-50%, -50%) rotate(90deg);
}

.competition-detail__faq-answer-shell {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.32s ease;
}

.competition-detail__faq-item--open .competition-detail__faq-answer-shell {
  grid-template-rows: 1fr;
}

.competition-detail__faq-answer {
  min-height: 0;
  overflow: hidden;
}

.competition-detail__faq-entry-answer {
  font-family: Oswald;
  margin: 0;
  padding: 0 0 6px;
  font-size: 16px;
  font-weight: 300;
  line-height: 1.5;
  white-space: pre-wrap;
  color: color-mix(in srgb, var(--black) 84%, var(--white));
  opacity: 0;
  transform: translateY(-6px);
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.competition-detail__faq-item--open .competition-detail__faq-entry-answer {
  opacity: 1;
  transform: translateY(0);
}

.competition-detail__faq-item--open .competition-detail__faq-icon::after {
  transform: translate(-50%, -50%) rotate(0deg);
}

@media (max-width: 1024px) {
  .competition-detail__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .competition-detail__faq-shell {
    width: 100%;
  }
}

@media (max-width: 900px) {
  .competition-detail__hero-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .competition-detail__content {
    padding: 20px;
  }

  .competition-detail__meta,
  .competition-detail__cards {
    grid-template-columns: 1fr;
  }

  .competition-detail__card-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .competition-detail__faq-item {
    padding-left: 16px;
    padding-right: 16px;
  }

  .competition-detail__faq-question {
    font-size: 13px;
  }
}
</style>

<template>
  <section class="competitions-archive">
    <div class="container">
      <div class="competitions-archive__hero">
        <div class="competitions-archive__intro">
          <div class="competitions-archive__copy">
            <span class="competitions-archive__eyebrow">Архив Smart Swim</span>
            <h1 class="competitions-archive__title">Прошедшие соревнования</h1>
            <p class="competitions-archive__text">
              Здесь собраны завершенные сезоны Smart Swim. Можно быстро посмотреть ритм этапов по
              годам и восстановить картину прошлых соревновательных циклов.
            </p>
          </div>

          <div class="competitions-archive__summary">
            <div class="competitions-archive__summary-card">
              <span class="competitions-archive__summary-label">Сезоны</span>
              <strong class="competitions-archive__summary-value">2022 - 2025</strong>
            </div>
            <div class="competitions-archive__summary-card">
              <span class="competitions-archive__summary-label">Архивных стартов</span>
              <strong class="competitions-archive__summary-value">33</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="competitions-archive__grid">
        <article
          v-for="season in archiveSeasons"
          :key="season.year"
          class="competitions-archive__card"
        >
          <div class="competitions-archive__card-head">
            <span class="competitions-archive__card-year">{{ season.year }}</span>
          </div>

          <div class="competitions-archive__dates">
            <div v-for="date in season.dates" :key="date" class="competitions-archive__date">
              {{ date }}
            </div>
          </div>
        </article>
      </div>

      <div class="competitions-archive__gallery">
        <article
          v-for="image in archiveGalleryImages"
          :key="image.src"
          class="competitions-archive__gallery-item"
        >
          <img
            class="competitions-archive__gallery-image"
            :src="image.src"
            :alt="image.alt"
            loading="lazy"
          />
        </article>
      </div>
    </div>

    <HomeFooterSection />
  </section>
</template>

<script setup>
import HomeFooterSection from '@/pages/home/components/HomeFooterSection.vue'
import { archiveSeasons } from '@/pages/competitions/archiveData'

const archiveGalleryImages = [
  { src: '/images/07-img.jpg', alt: 'Архив соревнований Smart Swim 2025' },
  { src: '/images/08-img.jpg', alt: 'Архив соревнований Smart Swim 2024' },
  { src: '/images/09-img.jpg', alt: 'Архив соревнований Smart Swim 2023' },
  { src: '/images/10-img.jpg', alt: 'Архив соревнований Smart Swim 2022' },
  { src: '/images/11-img.jpg', alt: 'Момент с прошедших стартов Smart Swim' },
  { src: '/images/12-img.jpg', alt: 'Пловцы на архивных соревнованиях Smart Swim' },
  { src: '/images/13-img.jpg', alt: 'Награждение на соревнованиях Smart Swim' },
  { src: '/images/14-img.jpg', alt: 'Эмоции участников Smart Swim' },
  { src: '/images/15-img.jpg', alt: 'Финишный момент соревнований Smart Swim' },
]
</script>

<style scoped>
/* .competitions-archive {
  padding-top: 24px;
} */

.competitions-archive__hero {
  margin-bottom: 50px;
  padding: 24px 0 54px;
  position: relative;
  min-height: 75vh;
  display: flex;
  align-items: stretch;
  z-index: 1;
}

.competitions-archive__hero::before {
  content: '';
  position: absolute;
  inset: 0;
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  background-color: var(--white);
  z-index: -1;
}

.competitions-archive__hero::after {
  content: '';
  position: absolute;
  top: 0;
  right: 50%;
  bottom: 0;
  left: calc(50% - 50vw);
  background-color: var(--very-light-blue);
  z-index: -1;
}

.competitions-archive__intro {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
  gap: 28px;
  align-items: stretch;
}

.competitions-archive__copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* min-height: clamp(320px, 40vw, 640px); */
  padding: 20px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 28%);
  box-shadow: 0 10px 40px rgb(from var(--black) r g b / 6%);
}

.competitions-archive__eyebrow {
  display: inline-flex;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 56%, var(--white));
}

.competitions-archive__title {
  margin: 0 0 16px;
  /* font-family: Oswald; */
  font-size: clamp(42px, 7vw, 48px);
  line-height: 0.94;
  /* text-transform: uppercase; */
}

.competitions-archive__text {
  max-width: 720px;
  margin: 0;
  line-height: 1.7;
}

.competitions-archive__summary {
  display: grid;
  gap: 16px;
  padding: 20px;
  align-content: center;
}

.competitions-archive__summary-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 28%);
  box-shadow: 0 10px 40px rgb(from var(--black) r g b / 6%);
}

.competitions-archive__summary-label {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 56%, var(--white));
}

.competitions-archive__summary-value {
  font-family: Oswald;
  font-size: 34px;
  line-height: 1;
}

.competitions-archive__grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 100px 0;
  margin: 50px 0;
  border-radius: 10px;
  z-index: 0;
}

.competitions-archive__grid::before {
  content: '';
  position: absolute;
  inset: 0;
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  background-image: url('/images/06-img.jpg');
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  z-index: -2;
}

.competitions-archive__grid::after {
  content: '';
  position: absolute;
  inset: 0;
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.3);
  z-index: -1;
}

.competitions-archive__card {
  border: 1px solid rgb(from var(--white) r g b / 28%);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  padding: 22px;
  background: linear-gradient(
    180deg,
    rgb(from var(--white) r g b / 24%) 0%,
    rgb(from var(--light-blue) r g b / 14%) 100%
  );
  box-shadow:
    0 18px 38px rgb(from var(--black) r g b / 12%),
    inset 0 1px 0 rgb(from var(--white) r g b / 30%);
}

.competitions-archive__card-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.competitions-archive__card-year {
  /* font-family: Oswald; */
  font-size: 34px;
  line-height: 1;
}

.competitions-archive__card-summary {
  font-size: 14px;
  font-weight: 800;
}

.competitions-archive__dates {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.competitions-archive__date {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 76px;
  padding: 12px 14px;

  border-radius: 10px;
  background: rgb(from var(--white) r g b / 10%);
  box-shadow:
    inset 0 1px 0 rgb(from var(--white) r g b / 18%),
    0 8px 18px rgb(from var(--black) r g b / 8%);
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

.competitions-archive__gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: 84px;
  gap: 16px;
  margin: 50px 0 120px;
}

.competitions-archive__gallery-item {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  background: var(--very-light-blue);
  box-shadow:
    0 18px 38px rgb(from var(--black) r g b / 10%),
    inset 0 1px 0 rgb(from var(--white) r g b / 30%);
}

.competitions-archive__gallery-item::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgb(from var(--black) r g b / 10%) 0%,
    rgb(from var(--black) r g b / 18%) 48%,
    rgb(from var(--black) r g b / 28%) 100%
  );
  pointer-events: none;
}

.competitions-archive__gallery-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.competitions-archive__gallery-item:hover .competitions-archive__gallery-image {
  transform: scale(1.04);
}

.competitions-archive__gallery-item:nth-child(1) {
  grid-column: 1;
  grid-row: span 3;
}

.competitions-archive__gallery-item:nth-child(2) {
  grid-column: 2;
  grid-row: span 2;
}

.competitions-archive__gallery-item:nth-child(3) {
  grid-column: 3;
  grid-row: span 4;
}

.competitions-archive__gallery-item:nth-child(4) {
  grid-column: 2;
  grid-row: span 3;
}

.competitions-archive__gallery-item:nth-child(5) {
  grid-column: 1;
  grid-row: span 3;
}

.competitions-archive__gallery-item:nth-child(6) {
  grid-column: 3;
  grid-row: span 2;
}

.competitions-archive__gallery-item:nth-child(7) {
  grid-column: 2;
  grid-row: span 3;
}

.competitions-archive__gallery-item:nth-child(8) {
  grid-column: 3;
  grid-row: span 2;
}

.competitions-archive__gallery-item:nth-child(9) {
  grid-column: 1;
  grid-row: 7 / span 2;
}

@media (max-width: 900px) {
  .competitions-archive__intro,
  .competitions-archive__grid {
    grid-template-columns: 1fr;
  }

  .competitions-archive__copy,
  .competitions-archive__summary {
    min-height: auto;
  }

  .competitions-archive__gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: 160px;
  }

  .competitions-archive__gallery-item {
    grid-column: auto !important;
    grid-row: span 1 !important;
  }
}

@media (max-width: 768px) {
  .competitions-archive__dates {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .competitions-archive__gallery {
    gap: 12px;
  }
}

@media (max-width: 520px) {
  .competitions-archive__dates {
    grid-template-columns: 1fr;
  }

  .competitions-archive__gallery {
    grid-template-columns: 1fr;
    grid-auto-rows: 220px;
  }
}
</style>

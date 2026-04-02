<template>
  <section class="trainers">
    <div class="container">
      <section class="trainers__hero">
        <div class="trainers__hero-copy">
          <h1 class="trainers__title">Тренеры, которые подберут программу под вашу цель</h1>
          <p class="trainers__text">
            В команде Smart Swim работают 6 тренеров с разным профилем подготовки. Мы поможем
            выбрать специалиста под возраст, уровень, задачу и темп, чтобы занятия были не
            случайными, а действительно вели к результату.
          </p>
          <p class="trainers__text">
            Кому-то важно уверенно начать и убрать страх воды, кому-то улучшить технику, набрать
            объем или подготовиться к стартам. Мы собираем программу так, чтобы она подходила именно
            вам и была комфортной в реальном графике.
          </p>
        </div>

        <aside class="trainers__hero-aside">
          <article v-for="stat in trainersHeroStats" :key="stat.value" class="trainers__fact-card">
            <strong class="trainers__fact-value">{{ stat.value }}</strong>
            <p class="trainers__fact-label">{{ stat.label }}</p>
          </article>
        </aside>
      </section>

      <section class="trainers__image-showcase" aria-label="Атмосфера тренировок Smart Swim">
        <div class="trainers__image-shell">
          <img
            src="/images/19-img.jpg"
            alt="Тренировка Smart Swim у бассейна"
            class="trainers__showcase-image"
          />
        </div>
      </section>

      <section class="trainers__grid-section">
        <div class="trainers__grid">
          <article
            v-for="trainer in trainers"
            :key="trainer.id"
            class="trainers__card"
            :class="{ 'trainers__card--open': activeTrainerId === trainer.id }"
          >
            <div class="trainers__photo-placeholder" aria-hidden="true">
              <span class="trainers__photo-text">Нет фото</span>
            </div>

            <div class="trainers__card-body">
              <div class="trainers__card-top">
                <div class="trainers__card-heading">
                  <h2 class="trainers__card-title">{{ trainer.name }}</h2>
                </div>

                <button
                  type="button"
                  class="trainers__card-bookmark btn-reset"
                  :aria-expanded="activeTrainerId === trainer.id"
                  :aria-controls="`trainer-details-${trainer.id}`"
                  aria-label="Открыть подробную информацию о тренере"
                  @click.stop="toggleTrainerDetails(trainer.id)"
                >
                  <span class="trainers__card-bookmark-icon" aria-hidden="true"></span>
                </button>
              </div>

              <div class="trainers__card-summary">
                <ul class="trainers__meta list-reset">
                  <li class="trainers__meta-item">
                    <span class="trainers__meta-label">Стаж</span>
                    <span class="trainers__meta-value">{{ trainer.experience }}</span>
                  </li>
                  <li class="trainers__meta-item">
                    <span class="trainers__meta-label">Основные техники для обучения</span>
                    <span class="trainers__meta-value">{{ trainer.techniques }}</span>
                  </li>
                  <li class="trainers__meta-item">
                    <span class="trainers__meta-label">Свободно мест</span>
                    <span class="trainers__meta-value">{{ trainer.availableSlots }}</span>
                  </li>
                </ul>
              </div>

              <div :id="`trainer-details-${trainer.id}`" class="trainers__card-details" @click.stop>
                <p class="trainers__card-detail-text">{{ trainer.focus }}</p>
                <p class="trainers__card-detail-text">{{ trainer.approach }}</p>
                <p class="trainers__card-detail-text">{{ trainer.result }}</p>
              </div>

              <a href="tel:+79167290773" class="trainers__card-action link-reset">
                Записаться к тренеру
              </a>
            </div>
          </article>
        </div>
      </section>
    </div>

    <HomeFooterSection />
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import HomeFooterSection from '@/pages/home/components/HomeFooterSection.vue'
import { trainers, trainersHeroStats } from '@/pages/trainers/trainersData'

const activeTrainerId = ref(null)
function toggleTrainerDetails(trainerId) {
  activeTrainerId.value = activeTrainerId.value === trainerId ? null : trainerId
}

function handleGlobalPointerDown() {
  if (!activeTrainerId.value) {
    return
  }

  activeTrainerId.value = null
}

onMounted(() => {
  window.addEventListener('pointerdown', handleGlobalPointerDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', handleGlobalPointerDown)
})
</script>

<style scoped>
.trainers {
  padding-top: 8px;
}

.trainers__hero,
.trainers__grid-section {
  position: relative;
}

.trainers__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(280px, 0.82fr);
  gap: 22px;
  padding: 28px 0 34px;
  margin-bottom: 44px;
  align-items: stretch;
}

.trainers__hero::before {
  content: '';
  position: absolute;
  inset: 0;
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  background: linear-gradient(
    90deg,
    var(--very-light-blue) 0%,
    var(--very-light-blue) 50%,
    var(--white) 50%,
    var(--white) 100%
  );
  z-index: -1;
}

.trainers__hero-copy,
.trainers__hero-aside,
.trainers__fact-card,
.trainers__card {
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  box-shadow:
    0 20px 50px rgb(from var(--black) r g b / 9%),
    inset 0 1px 0 rgb(from var(--white) r g b / 28%);
}

.trainers__hero-copy {
  display: grid;
  align-content: center;
  gap: 18px;
  padding: 44px 28px;
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 50%);
}

.trainers__title,
.trainers__card-title {
  margin: 0;
  font-family: Oswald, sans-serif;
  line-height: 0.96;
}

.trainers__title {
  font-size: clamp(40px, 6vw, 52px);
}

.trainers__text,
.trainers__fact-label,
.trainers__card-detail-text,
.trainers__meta-value,
.trainers__meta-label {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
}

.trainers__hero-aside {
  display: grid;
  gap: 16px;
  padding: 0;
  border: none;
  box-shadow: none;
  background: transparent;
}

.trainers__fact-card {
  display: grid;
  gap: 8px;
  padding: 22px;
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 76%);
}

.trainers__fact-value {
  font-family: Oswald, sans-serif;
  font-size: 28px;
  line-height: 1;
}

.trainers__fact-label,
.trainers__card-detail-text,
.trainers__meta-value {
  color: color-mix(in srgb, var(--black) 68%, var(--white));
}

.trainers__grid-section {
  padding-bottom: 70px;
}

.trainers__image-showcase {
  margin-bottom: 50px;
}

.trainers__image-shell {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  box-shadow:
    0 24px 54px rgb(from var(--black) r g b / 12%),
    inset 0 1px 0 rgb(from var(--white) r g b / 28%);
}

.trainers__showcase-image {
  display: block;
  width: 100%;
  min-height: 460px;
  max-height: 620px;
}

.trainers__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
  overflow: visible;
}

.trainers__card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 520px;
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 96%);
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.trainers__card:hover,
.trainers__card:focus-within {
  border-color: color-mix(in srgb, var(--cyan) 40%, var(--white));
  box-shadow:
    0 28px 60px rgb(from var(--black) r g b / 12%),
    inset 0 1px 0 rgb(from var(--white) r g b / 34%);
}

.trainers__photo-placeholder {
  position: relative;
  flex: 0 0 220px;
  overflow: hidden;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--cyan) 20%, var(--white));
  background: transparent;
}

.trainers__photo-text {
  position: absolute;
  top: 50%;
  left: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 38px;
  padding: 8px 14px;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 46%, var(--white));
}

.trainers__card-body {
  position: relative;
  display: grid;
  flex: 1 1 auto;
  grid-template-rows: auto auto 1fr auto;
  gap: 14px;
  padding: 18px 18px 20px;
  background: rgb(from var(--white) r g b / 96%);
  z-index: 1;
}

.trainers__card-top,
.trainers__card-heading,
.trainers__card-summary {
  display: grid;
  gap: 8px;
}

.trainers__card-top {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.trainers__card-bookmark {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid color-mix(in srgb, var(--cyan) 22%, var(--white));
  border-radius: 999px;
  background: rgb(from var(--white) r g b / 90%);
  box-shadow:
    0 10px 24px rgb(from var(--black) r g b / 7%),
    inset 0 1px 0 rgb(from var(--white) r g b / 36%);
  cursor: pointer;
  transition:
    border-color 0.25s ease,
    background-color 0.25s ease,
    box-shadow 0.25s ease;
}

.trainers__card-bookmark:hover,
.trainers__card--open .trainers__card-bookmark {
  border-color: color-mix(in srgb, var(--cyan) 36%, var(--white));
  background: rgb(from var(--white) r g b / 98%);
  box-shadow:
    0 14px 28px rgb(from var(--black) r g b / 10%),
    inset 0 1px 0 rgb(from var(--white) r g b / 42%);
}

.trainers__card-bookmark-icon {
  position: relative;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--cyan) 30%, var(--white));
}

.trainers__card-bookmark-icon::before,
.trainers__card-bookmark-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  background: color-mix(in srgb, var(--black) 58%, var(--white));
  transform: translate(-50%, -50%);
  transition: transform 0.25s ease;
}

.trainers__card-bookmark-icon::before {
  width: 6px;
  height: 1px;
}

.trainers__card-bookmark-icon::after {
  width: 1px;
  height: 6px;
}

.trainers__card--open .trainers__card-bookmark-icon::after {
  transform: translate(-50%, -50%) scaleY(0);
}

.trainers__card-title {
  font-size: 24px;
}

.trainers__meta {
  display: grid;
  grid-template-rows: minmax(52px, auto) minmax(84px, auto) minmax(52px, auto);
  gap: 8px;
}

.trainers__meta-item {
  display: grid;
  align-content: start;
  gap: 1px;
}

.trainers__meta-label {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--orange);
}

.trainers__meta-value,
.trainers__card-detail-text {
  font-size: 14px;
  line-height: 1.4;
}

.trainers__card-details {
  position: absolute;
  top: 18px;
  right: 18px;
  bottom: 88px;
  width: calc(100% - 36px);
  min-height: 0;
  padding: 20px 18px;
  border-radius: 10px;
  background: linear-gradient(
    180deg,
    rgb(from var(--white) r g b / 94%) 0%,
    color-mix(in srgb, var(--very-light-blue) 24%, var(--white)) 100%
  );
  border: 1px solid color-mix(in srgb, var(--cyan) 28%, var(--white));
  backdrop-filter: blur(16px);
  opacity: 0;
  display: grid;
  align-content: start;
  gap: 12px;
  transform: translateX(100%);
  pointer-events: none;
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  z-index: 2;
  box-shadow:
    0 24px 44px rgb(from var(--black) r g b / 14%),
    inset 0 1px 0 rgb(from var(--white) r g b / 34%);
}

.trainers__card--open .trainers__card-details {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.trainers__card-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 47px;
  padding: 13.25px 30px;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--orange) 88%, var(--white)) 0%,
    color-mix(in srgb, var(--orange) 68%, var(--white)) 100%
  );
  color: var(--white);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-align: center;
  margin-top: auto;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.trainers__card-action:hover {
  transform: translateY(-1px);
}

@media (max-width: 1100px) {
  .trainers__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .trainers__hero {
    grid-template-columns: 1fr;
  }

  .trainers__hero::before {
    background: linear-gradient(180deg, var(--very-light-blue) 0%, var(--white) 100%);
  }

  .trainers__image-shell {
    min-height: 360px;
  }
}

@media (max-width: 700px) {
  .trainers__grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .trainers__hero-copy,
  .trainers__hero-aside {
    padding: 22px 18px;
  }

  .trainers__image-showcase {
    margin-bottom: 100px;
  }

  .trainers__image-shell {
    min-height: 280px;
  }

  .trainers__showcase-image {
    min-height: 280px;
  }

  .trainers__card {
    min-height: 0;
  }

  .trainers__card-body {
    padding: 16px;
  }

  .trainers__card-bookmark {
    width: 32px;
    height: 32px;
  }

  .trainers__meta {
    grid-template-rows: auto;
  }

  .trainers__card-details {
    top: 60px;
    right: 16px;
    bottom: 86px;
    left: 16px;
    width: auto;
    min-height: 0;
    padding: 16px;
  }
}
</style>

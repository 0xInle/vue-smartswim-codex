<template>
  <section class="competitions-hero">
    <div class="container competitions-hero__shell">
      <div class="competitions-hero__content">
        <div class="competitions-hero__copy">
          <h1 class="competitions-hero__title">Календарь соревнований</h1>
          <p class="competitions-hero__text">
            Серии для опытных участников, первые старты для самых юных пловцов и архив прошедших
            соревнований в одном пространстве. <Br />Выберите направление и перейдите к карточкам
            сезона.
          </p>
          <div class="competitions-hero__actions">
            <button
              type="button"
              class="competitions-hero__cta btn-reset"
              @click="$emit('explore')"
            >
              Смотреть соревнования
            </button>
            <a class="competitions-hero__phone link-reset" href="tel:+79167290773"> Позвонить </a>
          </div>
        </div>
        <div class="competitions-hero__panel">
          <div class="competitions-hero__panel-card">
            <span class="competitions-hero__panel-label">Архив соревнований</span>
            <strong class="competitions-hero__panel-value">Прошедшие старты 2022 - 2025</strong>
            <p class="competitions-hero__panel-text">Краткий обзор завершенных сезонов.</p>
          </div>
          <div class="competitions-hero__stats">
            <div class="competitions-hero__stat">
              <span class="competitions-hero__stat-number">4</span>
              <span class="competitions-hero__stat-label">архивных сезона</span>
            </div>
            <div class="competitions-hero__stat">
              <span class="competitions-hero__stat-number">33</span>
              <span class="competitions-hero__stat-label">прошедших старта</span>
            </div>
            <div class="competitions-hero__stat">
              <span class="competitions-hero__stat-number">2025</span>
              <span class="competitions-hero__stat-label">последний сезон</span>
            </div>
          </div>
          <RouterLink class="competitions-hero__archive-link link-reset" to="/competitions/archive">
            Открыть архив соревнований
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'

defineEmits(['explore'])
</script>

<style scoped>
.competitions-hero {
  margin-bottom: 50px;
  position: relative;
  z-index: 1;
  padding: 24px 0 54px;
  min-height: 100vh;
  display: flex;
  align-items: stretch;
}

.competitions-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  background-color: var(--white);
  z-index: -1;
}

.competitions-hero::after {
  content: '';
  position: absolute;
  top: 0;
  right: 50%;
  bottom: 0;
  left: calc(50% - 50vw);
  background-color: var(--very-light-blue);
  z-index: -1;
}

.competitions-hero__shell {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
}

.competitions-hero__content {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
  gap: 28px;
  align-items: stretch;
}

.competitions-hero__copy,
.competitions-hero__panel {
  min-height: 480px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  box-shadow: 0 10px 40px rgb(from var(--black) r g b / 6%);
}

.competitions-hero__copy {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: rgb(from var(--white) r g b / 28%);
}

.competitions-hero__eyebrow {
  display: inline-flex;
  margin-bottom: 14px;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  background: color-mix(in srgb, var(--white) 20%, transparent);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.competitions-hero__title {
  margin: 0 0 20px;
  /* font-family: Oswald; */
  font-size: clamp(42px, 7vw, 48px);
  line-height: 0.95;
  /* text-transform: uppercase; */
}

.competitions-hero__text {
  max-width: 680px;
  margin: 0;
  font-weight: 500;
  font-size: 16px;
  /* line-height: 1.65; */
}

.competitions-hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: auto;
  padding-top: 28px;
}

.competitions-hero__cta {
  min-height: 47px;
  padding: 11px 30px;
  border: none;
  border-radius: 10px;
  background: color-mix(in srgb, var(--cyan) 82%, var(--white));
  font-size: 15px;
  font-weight: 500;
  color: var(--white);
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.competitions-hero__cta:hover {
  background-color: color-mix(in srgb, var(--cyan) 94%, var(--white));
  transform: translateY(-1px);
}

.competitions-hero__phone {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 47px;
  padding: 11px 30px;
  border: none;
  border-radius: 10px;
  background-color: color-mix(in srgb, var(--orange) 78%, transparent);
  font-size: 15px;
  font-weight: 500;
  color: var(--black);
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.competitions-hero__phone:hover {
  background-color: color-mix(in srgb, var(--orange) 88%, transparent);
  color: var(--white);
  transform: translateY(-1px);
}

.competitions-hero__panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
  padding: 20px;
  background: rgb(from var(--white) r g b / 24%);
  border: 1px solid color-mix(in srgb, var(--white) 28%, transparent);
  border-radius: 10px;
}

.competitions-hero__panel-card {
  border: 1px solid color-mix(in srgb, var(--white) 28%, transparent);
  border-radius: 10px;
}

.competitions-hero__panel-label {
  display: inline-flex;
  margin-bottom: 10px;
  color: color-mix(in srgb, var(--black) 56%, var(--white));
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.competitions-hero__panel-value {
  display: block;
  /* font-family: Oswald; */
  font-size: 21px;
  line-height: 1;
}

.competitions-hero__panel-text {
  margin: 14px 0 0;
  /* line-height: 1.6; */
  font-weight: 500;
  font-size: 16px;
}

.competitions-hero__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.competitions-hero__stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  min-height: 132px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 24%, var(--white));
  border-radius: 10px;

  text-align: center;
}

.competitions-hero__stat-number {
  font-family: Oswald;
  font-size: 34px;
  line-height: 1;
}

.competitions-hero__stat-label {
  font-size: 13px;
  line-height: 1.4;
}

.competitions-hero__archive-link {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  width: 100%;
  justify-content: center;
  min-height: 47px;
  padding: 11px 30px;
  border: none;
  border-radius: 10px;
  background: color-mix(in srgb, var(--cyan) 82%, var(--white));
  font-size: 14px;
  font-size: 15px;
  font-weight: 500;
  color: var(--white);
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.competitions-hero__archive-link:hover {
  transform: translateY(-1px);
  background-color: color-mix(in srgb, var(--cyan) 94%, var(--white));
}

@media (max-width: 900px) {
  .competitions-hero__content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .competitions-hero {
    padding-top: 18px;
  }

  .competitions-hero__copy {
    padding: 20px;
  }

  .competitions-hero__stats {
    grid-template-columns: 1fr;
  }
}
</style>

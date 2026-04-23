<template>
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
</template>

<style scoped>
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
  font-size: clamp(42px, 7vw, 48px);
  line-height: 0.94;
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

@media (max-width: 900px) {
  .competitions-archive__intro {
    grid-template-columns: 1fr;
  }

  .competitions-archive__copy,
  .competitions-archive__summary {
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .competitions-archive__hero {
    margin-bottom: 30px;
  }

  .competitions-archive__title {
    font-size: clamp(34px, 10vw, 42px);
  }
}

@media (max-width: 520px) {
  .competitions-archive__title {
    font-size: clamp(30px, 9vw, 34px);
  }
}
</style>

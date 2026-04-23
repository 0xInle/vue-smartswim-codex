<template>
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
</template>

<script setup>
defineProps({
  camp: {
    type: Object,
    required: true,
  },
})
</script>

<style scoped>
.fee-detail__intro-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.86fr);
  gap: 22px;
  margin-top: 24px;
  margin-bottom: 50px;
}

.fee-detail__intro-copy,
.fee-detail__reservation {
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  overflow: hidden;
  box-shadow:
    0 18px 38px rgb(from var(--black) r g b / 6%),
    inset 0 1px 0 rgb(from var(--white) r g b / 28%);
  background: rgb(from var(--white) r g b / 72%);
}

.fee-detail__intro-copy {
  padding: 28px;
}

.fee-detail__reservation {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 24px;
}

.fee-detail__eyebrow,
.fee-detail__reservation-label {
  display: inline-flex;
  align-self: flex-start;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 54%, var(--white));
}

.fee-detail__section-title {
  margin: 0;
  margin-bottom: 20px;
  line-height: 0.95;
  font-size: clamp(28px, 4vw, 46px);
}

.fee-detail__text,
.fee-detail__reservation-text {
  font-size: 16px;
  margin: 0;
  line-height: 1.75;
}

.fee-detail__reservation-value {
  font-family: Oswald;
  font-size: 40px;
  line-height: 1;
}

.fee-detail__reservation-action {
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

@media (max-width: 900px) {
  .fee-detail__intro-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .fee-detail__intro-copy,
  .fee-detail__reservation {
    padding: 20px;
  }

  .fee-detail__intro-grid {
    margin-bottom: 30px;
  }
}
</style>

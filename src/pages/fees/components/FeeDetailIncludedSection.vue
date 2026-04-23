<template>
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
.fee-detail__included {
  margin-top: 24px;
  margin-bottom: 50px;
}

.fee-detail__section-head {
  margin-bottom: 18px;
}

.fee-detail__section-title {
  margin: 0;
  line-height: 0.95;
  font-size: clamp(28px, 4vw, 46px);
}

.fee-detail__price-banner,
.fee-detail__included-card {
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  overflow: hidden;
  box-shadow:
    0 18px 38px rgb(from var(--black) r g b / 6%),
    inset 0 1px 0 rgb(from var(--white) r g b / 28%);
  background: rgb(from var(--white) r g b / 72%);
}

.fee-detail__price-banner {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  padding: 24px;
  margin-bottom: 36px;
}

.fee-detail__price-value,
.fee-detail__price-note,
.fee-detail__included-text {
  line-height: 1.6;
}

.fee-detail__price-value {
  display: block;
  margin-top: 8px;
  font-family: Oswald;
  font-size: clamp(40px, 5vw, 68px);
  line-height: 1;
}

.fee-detail__price-note {
  font-size: 16px;
  margin: 0;
}

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
}

@media (max-width: 900px) {
  .fee-detail__included-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .fee-detail__price-banner {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
  }

  .fee-detail__included-grid {
    margin-bottom: 60px;
  }
}
</style>

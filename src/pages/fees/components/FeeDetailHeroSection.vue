<template>
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
.fee-detail__hero {
  margin-bottom: 28px;
}

.fee-detail__hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.86fr);
  gap: 22px;
}

.fee-detail__content,
.fee-detail__media {
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  overflow: hidden;
  box-shadow:
    0 18px 38px rgb(from var(--black) r g b / 6%),
    inset 0 1px 0 rgb(from var(--white) r g b / 28%);
}

.fee-detail__content {
  background: rgb(from var(--white) r g b / 72%);
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
.fee-detail__meta-label {
  display: inline-flex;
  align-self: flex-start;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 54%, var(--white));
}

.fee-detail__title {
  margin: 10px 0;
  font-size: clamp(34px, 5vw, 52px);
  line-height: 0.95;
}

.fee-detail__date {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 500;
}

.fee-detail__status,
.fee-detail__summary-text {
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

@media (max-width: 900px) {
  .fee-detail__hero-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .fee-detail__content {
    padding: 20px;
  }

  .fee-detail__title {
    font-size: clamp(34px, 10vw, 42px);
  }

  .fee-detail__hero-meta {
    grid-template-columns: 1fr;
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

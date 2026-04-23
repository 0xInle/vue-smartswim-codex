<template>
  <section class="competition-detail-hero">
    <div class="competition-detail-hero__grid">
      <div class="competition-detail-hero__content">
        <span class="competition-detail-hero__badge">{{ competition.badge }}</span>
        <h1 class="competition-detail-hero__title">{{ competition.title }}</h1>
        <p class="competition-detail-hero__subtitle">{{ competition.subtitle }}</p>
        <p class="competition-detail-hero__text">{{ competition.description }}</p>

        <div class="competition-detail-hero__meta">
          <div class="competition-detail-hero__meta-card">
            <span class="competition-detail-hero__meta-label">Сезон</span>
            <span class="competition-detail-hero__meta-value">{{ competition.season }}</span>
          </div>
          <div class="competition-detail-hero__meta-card">
            <span class="competition-detail-hero__meta-label">Локация</span>
            <span class="competition-detail-hero__meta-value">{{ competition.location }}</span>
          </div>
        </div>
      </div>

      <div class="competition-detail-hero__media">
        <img
          :src="competition.image"
          :alt="competition.imageAlt"
          class="competition-detail-hero__image"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  competition: {
    type: Object,
    required: true,
  },
})
</script>

<style scoped>
.competition-detail-hero {
  margin-bottom: 50px;
}

.competition-detail-hero__grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.05fr);
  gap: 22px;
  align-items: center;
}

.competition-detail-hero__media,
.competition-detail-hero__content {
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  overflow: hidden;
}

.competition-detail-hero__media {
  min-height: 360px;
}

.competition-detail-hero__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 28px;
}

.competition-detail-hero__badge {
  display: inline-flex;
  align-self: flex-start;
  margin-bottom: 20px;
  background: color-mix(in srgb, var(--white) 20%, transparent);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.competition-detail-hero__title {
  margin: 0 0 10px;
  font-family: Oswald;
  font-size: clamp(32px, 4vw, 52px);
  line-height: 0.94;
  text-transform: uppercase;
}

.competition-detail-hero__subtitle {
  margin: 0 0 18px;
  font-size: 14px;
  font-weight: 500;
}

.competition-detail-hero__text {
  max-width: 620px;
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
}

.competition-detail-hero__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 20px 0 0;
}

.competition-detail-hero__meta-card {
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

.competition-detail-hero__meta-label {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 56%, var(--white));
}

.competition-detail-hero__meta-value {
  font-size: 15px;
  font-weight: 800;
  line-height: 1.5;
  white-space: pre-line;
}

.competition-detail-hero__image {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 360px;
  object-fit: cover;
}

@media (max-width: 900px) {
  .competition-detail-hero__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .competition-detail-hero {
    margin-bottom: 30px;
  }

  .competition-detail-hero__content {
    padding: 20px;
  }

  .competition-detail-hero__title {
    font-size: clamp(34px, 10vw, 42px);
  }

  .competition-detail-hero__meta {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .competition-detail-hero__title {
    font-size: clamp(30px, 9vw, 34px);
  }
}
</style>

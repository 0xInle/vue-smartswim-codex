<template>
  <section ref="sectionRef" class="competitions-list">
    <div class="container">
      <div class="competitions-list__items">
        <article
          v-for="(item, index) in items"
          :key="item.slug"
          class="competitions-list__item"
          :class="{ 'competitions-list__item--reverse': index % 2 === 1 }"
        >
          <div class="competitions-list__media">
            <img :src="item.image" :alt="item.imageAlt" class="competitions-list__image" />
          </div>
          <div class="competitions-list__content">
            <span class="competitions-list__badge">{{ item.badge }}</span>
            <h3 class="competitions-list__item-title">{{ item.title }}</h3>
            <p class="competitions-list__item-subtitle">{{ item.subtitle }}</p>
            <p class="competitions-list__item-text">{{ item.description }}</p>

            <div class="competitions-list__meta">
              <div class="competitions-list__meta-card">
                <span class="competitions-list__meta-label">Сезон</span>
                <span class="competitions-list__meta-value">{{ item.season }}</span>
              </div>
              <div class="competitions-list__meta-card">
                <span class="competitions-list__meta-label">Локация</span>
                <span class="competitions-list__meta-value">{{ item.location }}</span>
              </div>
            </div>
            <RouterLink
              class="competitions-list__action link-reset"
              :to="`/competitions/${item.slug}`"
            >
              Открыть календарь соревнования
            </RouterLink>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

defineProps({
  items: {
    type: Array,
    required: true,
  },
})

const sectionRef = ref(null)

defineExpose({
  scrollIntoView(options) {
    sectionRef.value?.scrollIntoView(options)
  },
})
</script>

<style scoped>
.competitions-list {
  padding: 8px 0 100px;
}

.competitions-list__head {
  margin-bottom: 30px;
}

.competitions-list__eyebrow {
  display: inline-flex;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 56%, var(--white));
}

.competitions-list__title {
  margin: 0;
  font-family: Oswald;
  font-size: clamp(32px, 5vw, 54px);
  line-height: 0.96;
  text-transform: uppercase;
}

.competitions-list__items {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.competitions-list__item {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.05fr);
  gap: 22px;
  align-items: center;
}

.competitions-list__item--reverse {
  grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
}

.competitions-list__item--reverse .competitions-list__media {
  order: 2;
}

.competitions-list__item--reverse .competitions-list__content {
  order: 1;
}

.competitions-list__media,
.competitions-list__content {
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  overflow: hidden;
}

.competitions-list__media {
  min-height: 360px;
}

.competitions-list__image {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 360px;
  object-fit: cover;
}

.competitions-list__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 28px;
}

.competitions-list__badge {
  display: inline-flex;
  align-self: flex-start;
  margin-bottom: 20px;
  background: color-mix(in srgb, var(--white) 20%, transparent);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.competitions-list__item-title {
  margin: 0 0 10px;
  font-family: Oswald;
  font-size: clamp(32px, 4vw, 52px);
  line-height: 0.94;
  text-transform: uppercase;
}

.competitions-list__item-subtitle {
  margin: 0 0 18px;
  font-size: 14px;
  font-weight: 500;
}

.competitions-list__item-text {
  max-width: 620px;
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
}

.competitions-list__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 20px 0;
}

.competitions-list__meta-card {
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

.competitions-list__meta-label {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 56%, var(--white));
}

.competitions-list__meta-value {
  font-size: 15px;
  font-weight: 800;
  line-height: 1.5;
  white-space: pre-line;
}

.competitions-list__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: max-content;
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

.competitions-list__action:hover {
  transform: translateY(-1px);
  background-color: color-mix(in srgb, var(--cyan) 94%, var(--white));
}

@media (max-width: 900px) {
  .competitions-list__item,
  .competitions-list__item--reverse {
    grid-template-columns: 1fr;
  }

  .competitions-list__item--reverse .competitions-list__media,
  .competitions-list__item--reverse .competitions-list__content {
    order: initial;
  }
}

@media (max-width: 640px) {
  .competitions-list__content {
    padding: 20px;
  }

  .competitions-list__meta {
    grid-template-columns: 1fr;
  }
}
</style>

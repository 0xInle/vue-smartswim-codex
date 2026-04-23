<template>
  <section class="documents__library">
    <div class="documents__hero">
      <div class="documents__intro">
        <h1 class="documents__title">Документы</h1>
        <p class="documents__text">
          Здесь собраны основные документы школы и соревнований: положения, согласия, оферты,
          правила и шаблоны для скачивания.
        </p>
      </div>
    </div>

    <div class="documents__grid">
      <article v-for="document in documents" :key="document.url" class="documents__card">
        <div class="documents__card-head">
          <h3 class="documents__card-title">{{ document.title }}</h3>
          <span class="documents__card-icon">{{ document.format }}</span>
        </div>

        <a
          :href="document.url"
          target="_blank"
          rel="noreferrer"
          class="documents__card-action link-reset"
        >
          Скачать
        </a>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  documents: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
.documents__library {
  position: relative;
  padding: 28px 0 24px;
  margin-bottom: 50px;
}

.documents__library::before {
  content: '';
  position: absolute;
  inset: 0;
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  background-color: var(--white);
  z-index: -1;
}

.documents__library::after {
  content: '';
  position: absolute;
  top: 0;
  right: 50%;
  bottom: 0;
  left: calc(50% - 50vw);
  background-color: var(--very-light-blue);
  z-index: -1;
}

.documents__intro {
  display: grid;
  gap: 18px;
  max-width: 760px;
  padding: 44px 28px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 50%);
  box-shadow:
    0 20px 50px rgb(from var(--black) r g b / 9%),
    inset 0 1px 0 rgb(from var(--white) r g b / 28%);
}

.documents__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin-bottom: 22px;
}

.documents__title {
  margin: 0;
  font-size: clamp(42px, 7vw, 48px);
  line-height: 0.95;
}

.documents__text {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
}

.documents__grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
}

.documents__card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px 10px;
  min-height: 86px;
  padding: 14px 16px;
  grid-column: span 2;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--cyan) 22%, var(--white));
  background: rgb(from var(--white) r g b / 82%);
  box-shadow:
    inset 0 1px 0 rgb(from var(--white) r g b / 52%),
    0 10px 24px rgb(from var(--black) r g b / 4%);
  transition:
    background-color 0.25s ease,
    border-color 0.25s ease;
}

.documents__card:hover {
  background: rgb(from var(--white) r g b / 96%);
  border-color: color-mix(in srgb, var(--cyan) 42%, var(--white));
}

.documents__card:nth-last-child(2):nth-child(3n + 1),
.documents__card:last-child:nth-child(3n + 2) {
  grid-column: span 3;
}

.documents__card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  grid-column: 1 / 2;
  gap: 10px;
  min-width: 0;
}

.documents__card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  min-width: 34px;
  min-height: 22px;
  padding: 3px 6px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--cyan) 88%, var(--white));
  font-size: 8px;
  font-weight: 900;
  color: var(--white);
  letter-spacing: 0.06em;
  flex-shrink: 0;
  justify-self: end;
}

.documents__card-title {
  margin: 0;
  font-size: 16px;
  line-height: 1.2;
  min-width: 0;
}

.documents__card-action {
  --button-bg: var(--button-orange-bg);
  --button-hover-bg: var(--button-orange-hover-bg);
  --button-focus-color: var(--orange);
  --button-text: var(--black);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  grid-column: 3 / 4;
  grid-row: 1 / 2;
  min-height: 36px;
  padding: 9px 16px;
  border-radius: 10px;
  background-color: var(--button-current-bg, var(--button-bg));
  color: var(--button-text);
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 1180px) {
  .documents__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .documents__card,
  .documents__card:nth-last-child(2):nth-child(3n + 1),
  .documents__card:last-child:nth-child(3n + 2) {
    grid-column: auto;
  }
}

@media (max-width: 768px) {
  .documents__title {
    font-size: clamp(34px, 10vw, 42px);
  }
}

@media (max-width: 520px) {
  .documents__title {
    font-size: clamp(30px, 9vw, 34px);
  }
}
</style>

<template>
  <div class="fees__cards">
    <article v-for="camp in camps" :key="camp.slug" class="fees__card">
      <div class="fees__card-body">
        <div class="fees__card-top">
          <span class="fees__card-place">{{ camp.locationShort }}</span>
          <span class="fees__card-status">{{ camp.bookingStatusShort }}</span>
        </div>

        <h3 class="fees__card-title">{{ camp.title }}</h3>
        <p class="fees__card-date">{{ camp.dateLabel }}</p>
        <p class="fees__card-address">{{ camp.address }}</p>

        <div class="fees__card-meta">
          <div class="fees__meta-item">
            <span class="fees__meta-label">Возраст</span>
            <span class="fees__meta-value">{{ camp.age }}</span>
          </div>
          <div class="fees__meta-item">
            <span class="fees__meta-label">Уровень</span>
            <span class="fees__meta-value">{{ camp.level }}</span>
          </div>
          <div class="fees__meta-item">
            <span class="fees__meta-label">Стоимость</span>
            <span class="fees__meta-value">{{ camp.price }}</span>
          </div>
        </div>

        <RouterLink :to="`/fees/${camp.slug}`" class="fees__card-action link-reset">
          Открыть описание сбора
        </RouterLink>
      </div>
    </article>
  </div>
</template>

<script setup>
defineProps({
  camps: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
.fees__cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 50px;
}

.fees__card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border-radius: 10px;
  overflow: hidden;
  background: rgb(from var(--white) r g b / 56%);
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  box-shadow:
    0 20px 50px rgb(from var(--black) r g b / 9%),
    inset 0 1px 0 rgb(from var(--white) r g b / 28%);
  transition: box-shadow 0.25s ease;
}

.fees__card:hover {
  box-shadow:
    0 28px 55px rgb(from var(--black) r g b / 14%),
    inset 0 1px 0 rgb(from var(--white) r g b / 35%);
}

.fees__card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  padding: 22px;
  text-align: center;
}

.fees__card-top {
  display: flex;
  width: 100%;
  gap: 10px;
  justify-content: space-between;
  margin-bottom: 14px;
}

.fees__card-place,
.fees__card-status {
  display: inline-flex;
  align-self: flex-start;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fees__card-place {
  background: rgb(from var(--very-light-blue) r g b / 76%);
}

.fees__card-status {
  background: rgb(from var(--orange) r g b / 18%);
  color: color-mix(in srgb, var(--orange) 74%, var(--black));
}

.fees__card-title {
  font-size: 26px;
  line-height: 1;
  margin: 0;
}

.fees__card-date {
  margin: 10px 0 8px;
  font-size: 14px;
  font-weight: 800;
}

.fees__card-address {
  margin: 0 0 18px;
  color: color-mix(in srgb, var(--black) 72%, var(--white));
  line-height: 1.6;
}

.fees__card-meta {
  display: grid;
  width: 100%;
  gap: 10px;
}

.fees__meta-item {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  border: 1px solid rgb(from var(--cyan) r g b / 20%);
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 48%);
  box-shadow:
    0 10px 20px rgb(from var(--black) r g b / 5%),
    inset 0 1px 0 rgb(from var(--white) r g b / 35%);
}

.fees__card-action {
  --button-bg: var(--button-orange-bg);
  --button-hover-bg: var(--button-orange-hover-bg);
  --button-focus-color: var(--orange);
  --button-text: var(--black);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 47px;
  margin-top: auto;
  margin-top: 22px;
  padding: 11px 24px;
  border-radius: 10px;
  background-color: var(--button-current-bg, var(--button-bg));
  font-size: 15px;
  font-weight: 500;
  color: var(--button-text);
}

@media (max-width: 1100px) {
  .fees__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .fees__cards {
    margin-bottom: 30px;
    grid-template-columns: 1fr;
  }

  .fees__card-body {
    padding: 20px;
  }
}
</style>

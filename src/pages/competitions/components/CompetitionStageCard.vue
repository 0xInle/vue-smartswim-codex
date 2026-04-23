<template>
  <article
    class="competition-detail-card"
    :class="{ 'competition-detail-card--active': active }"
  >
    <div class="competition-detail-card__head">
      <span class="competition-detail-card__title">{{ card.title }}</span>
      <button
        type="button"
        class="competition-detail-card__action"
        :class="{ 'competition-detail-card__action--active': active }"
        :aria-pressed="active"
        @click="emit('open-registration')"
      >
        Подробнее
      </button>
    </div>

    <div class="competition-detail-card__body">
      <div class="competition-detail-card__date">{{ card.date }}</div>
      <div v-if="card.place" class="competition-detail-card__place">{{ card.place }}</div>
      <div class="competition-detail-card__text">
        <div class="competition-detail-card__text-column competition-detail-card__text-column--distance">
          <span
            v-for="item in descriptionParts"
            :key="`${card.title}-${item.distance}`"
            class="competition-detail-card__distance"
          >
            {{ item.distance }}
          </span>
        </div>

        <div class="competition-detail-card__text-column competition-detail-card__text-column--stroke">
          <span
            v-for="item in descriptionParts"
            :key="`${card.title}-${item.distance}-${item.label}`"
            class="competition-detail-card__stroke"
          >
            {{ item.label }}
          </span>
        </div>
      </div>
    </div>

    <div class="competition-detail-card__status">
      {{ card.status }}
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['open-registration'])

function formatCardDescription(description = '') {
  return description
    .split(',')
    .map((item) => item.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .map((item) => {
      const match = item.match(/^(\d+\s*м)\s+(.+)$/i)

      if (!match) {
        return {
          distance: item,
          label: '',
        }
      }

      return {
        distance: match[1],
        label: match[2],
      }
    })
}

const descriptionParts = computed(() => formatCardDescription(props.card.description))
</script>

<style scoped>
.competition-detail-card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border: 1px solid rgb(from var(--white) r g b / 30%);
  border-radius: 10px;
  background: linear-gradient(
    180deg,
    rgb(from var(--white) r g b / 30%) 0%,
    rgb(from var(--white) r g b / 16%) 45%,
    rgb(from var(--light-blue) r g b / 12%) 100%
  );
  box-shadow:
    inset 0 1px 0 rgb(from var(--white) r g b / 45%),
    inset 0 -1px 0 rgb(from var(--white) r g b / 12%),
    0 18px 40px rgb(from var(--black) r g b / 8%);
  overflow: hidden;
}

.competition-detail-card--active {
  border-color: color-mix(in srgb, var(--cyan) 46%, var(--white));
  box-shadow:
    inset 0 1px 0 rgb(from var(--white) r g b / 45%),
    inset 0 0 0 1px color-mix(in srgb, var(--cyan) 12%, transparent),
    0 18px 40px rgb(from var(--black) r g b / 8%);
}

.competition-detail-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--white) 18%, transparent);
}

.competition-detail-card__title {
  font-family: Oswald;
  font-size: 26px;
  line-height: 1;
  text-transform: uppercase;
}

.competition-detail-card__action {
  --button-bg: var(--button-cyan-bg);
  --button-hover-bg: var(--button-cyan-hover-bg);
  --button-focus-color: var(--cyan);
  --button-text: var(--black);
  --button-border: color-mix(in srgb, var(--cyan) 72%, var(--white));
  --button-hover-border: color-mix(in srgb, var(--cyan) 58%, transparent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 10px 18px;
  border: 1px solid var(--button-current-border, var(--button-border));
  border-radius: 10px;
  background-color: var(--button-current-bg, var(--button-bg));
  font-size: 14px;
  font-weight: 600;
  color: var(--button-text);
  cursor: pointer;
}

.competition-detail-card__action--active {
  --button-bg: var(--button-orange-bg);
  --button-hover-bg: var(--button-orange-hover-bg);
  --button-focus-color: var(--orange);
}

.competition-detail-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px 20px;
}

.competition-detail-card__date {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.15;
}

.competition-detail-card__place {
  font-size: 14px;
  font-weight: 900;
}

.competition-detail-card__text {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 16px;
  align-items: start;
}

.competition-detail-card__text-column {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.competition-detail-card__text-column--distance {
  padding-right: 16px;
  border-right: 1px solid color-mix(in srgb, var(--cyan) 48%, var(--white));
}

.competition-detail-card__distance {
  display: flex;
  align-items: center;
  font-weight: 900;
  line-height: 1.6;
  white-space: nowrap;
}

.competition-detail-card__stroke {
  display: flex;
  align-items: center;
  line-height: 1.6;
  color: color-mix(in srgb, var(--black) 82%, var(--white));
}

.competition-detail-card__status {
  margin-top: auto;
  padding: 0 20px 20px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cyan);
}

@media (max-width: 640px) {
  .competition-detail-card__head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

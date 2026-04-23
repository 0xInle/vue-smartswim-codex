<template>
  <div class="competition-faq" :class="`competition-faq--${variant}`">
    <div class="competition-faq__group" v-for="(section, sectionIndex) in sections" :key="section.title || sectionIndex">
      <div v-if="section.title" class="competition-faq__head">
        <span class="competition-faq__eyebrow">{{ section.title }}</span>
      </div>

      <div
        v-for="item in section.items"
        :key="item.question"
        class="competition-faq__item"
        :class="{ 'competition-faq__item--open': openFaqKey === getItemKey(sectionIndex, item.question) }"
      >
        <button
          type="button"
          class="competition-faq__summary"
          :aria-expanded="openFaqKey === getItemKey(sectionIndex, item.question)"
          @click="toggleFaqItem(getItemKey(sectionIndex, item.question))"
        >
          <span class="competition-faq__question">{{ item.question }}</span>
          <span class="competition-faq__icon" aria-hidden="true"></span>
        </button>

        <div class="competition-faq__answer-shell">
          <div class="competition-faq__answer">
            <div class="competition-faq__entry-answer" v-html="formatFaqAnswer(item.answer)"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { formatFaqAnswer } from '@/utils/formatFaqAnswer'

const props = defineProps({
  sections: {
    type: Array,
    default: () => [],
  },
  variant: {
    type: String,
    default: 'detail',
  },
})

const openFaqKey = ref(null)

function getItemKey(sectionIndex, question) {
  return `${sectionIndex}-${question}`
}

function toggleFaqItem(key) {
  openFaqKey.value = openFaqKey.value === key ? null : key
}

watch(
  () => props.sections,
  () => {
    openFaqKey.value = null
  },
)
</script>

<style scoped>
.competition-faq {
  display: grid;
  gap: 16px;
  width: 100%;
}

.competition-faq__group {
  display: grid;
  gap: 10px;
  width: 100%;
}

.competition-faq__head {
  display: flex;
  justify-content: center;
}

.competition-faq__eyebrow {
  display: inline-flex;
  align-self: center;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.competition-faq__item {
  display: grid;
}

.competition-faq__summary {
  display: flex;
  appearance: none;
  -webkit-appearance: none;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 18px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.competition-faq__question {
  font-family: Oswald;
  line-height: 1.35;
  letter-spacing: 0.01em;
}

.competition-faq__icon {
  position: relative;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.competition-faq__icon::before,
.competition-faq__icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 1px;
  transform: translate(-50%, -50%);
  transition: transform 0.2s ease;
}

.competition-faq__icon::after {
  transform: translate(-50%, -50%) rotate(90deg);
}

.competition-faq__answer-shell {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.32s ease;
}

.competition-faq__answer {
  min-height: 0;
  overflow: hidden;
}

.competition-faq__entry-answer {
  margin: 0;
  padding: 0 0 10px;
  opacity: 0;
  transform: translateY(-6px);
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.competition-faq__entry-answer :deep(p),
.competition-faq__entry-answer :deep(ul) {
  margin: 0 0 12px;
}

.competition-faq__entry-answer :deep(ul) {
  padding-left: 18px;
}

.competition-faq__entry-answer :deep(li) {
  margin-bottom: 8px;
}

.competition-faq__entry-answer :deep(a) {
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.competition-faq__item--open .competition-faq__answer-shell {
  grid-template-rows: 1fr;
}

.competition-faq__item--open .competition-faq__entry-answer {
  opacity: 1;
  transform: translateY(0);
}

.competition-faq__item--open .competition-faq__icon::after {
  transform: translate(-50%, -50%) rotate(0deg);
}

.competition-faq--detail .competition-faq__item {
  padding: 0 22px;
  border-top: 1px solid color-mix(in srgb, var(--black) 14%, var(--white));
  border-bottom: 1px solid color-mix(in srgb, var(--black) 14%, var(--white));
}

.competition-faq--detail .competition-faq__summary {
  padding: 16px 0;
  color: var(--black);
}

.competition-faq--detail .competition-faq__question {
  font-size: 20px;
  font-weight: 300;
}

.competition-faq--detail .competition-faq__icon::before,
.competition-faq--detail .competition-faq__icon::after {
  background: color-mix(in srgb, var(--black) 72%, var(--white));
}

.competition-faq--detail .competition-faq__entry-answer {
  font-size: 16px;
  font-weight: 300;
  line-height: 1.5;
  color: color-mix(in srgb, var(--black) 84%, var(--white));
}

.competition-faq--detail .competition-faq__entry-answer :deep(a) {
  color: var(--cyan);
}

.competition-faq--registration .competition-faq__group {
  padding: 16px 18px 18px;
  border: 1px solid color-mix(in srgb, var(--white) 22%, transparent);
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 28%);
  box-shadow:
    inset 0 1px 0 rgb(from var(--white) r g b / 24%),
    0 10px 24px rgb(from var(--black) r g b / 4%);
}

.competition-faq--registration .competition-faq__head {
  display: flex;
  justify-content: center;
}

.competition-faq--registration .competition-faq__eyebrow {
  padding: 7px 12px;
  border-radius: 999px;
  background: rgb(from var(--white) r g b / 55%);
  color: color-mix(in srgb, var(--black) 58%, var(--white));
}

.competition-faq--registration .competition-faq__item {
  border-top: 1px solid color-mix(in srgb, var(--black) 10%, var(--white));
  border-bottom: 1px solid color-mix(in srgb, var(--black) 10%, var(--white));
}

.competition-faq--registration .competition-faq__summary {
  padding: 14px 0;
  color: var(--black);
}

.competition-faq--registration .competition-faq__question {
  font-size: 18px;
  font-weight: 400;
}

.competition-faq--registration .competition-faq__icon::before,
.competition-faq--registration .competition-faq__icon::after {
  background: color-mix(in srgb, var(--black) 72%, var(--white));
}

.competition-faq--registration .competition-faq__entry-answer {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.55;
  color: color-mix(in srgb, var(--black) 82%, var(--white));
}

.competition-faq--registration .competition-faq__entry-answer :deep(a) {
  color: color-mix(in srgb, var(--orange) 68%, var(--black));
}

.competition-faq--registration .competition-faq__entry-answer :deep(a:hover) {
  color: color-mix(in srgb, var(--orange) 52%, var(--black));
}

@media (max-width: 640px) {
  .competition-faq--detail .competition-faq__item {
    padding-left: 16px;
    padding-right: 16px;
  }

  .competition-faq--detail .competition-faq__question {
    font-size: 18px;
    line-height: 1.3;
  }

  .competition-faq--detail .competition-faq__entry-answer {
    font-size: 15px;
  }
}
</style>

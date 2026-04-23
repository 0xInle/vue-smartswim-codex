<template>
  <section class="documents__faq">
    <div class="documents__faq-shell">
      <div
        v-for="(section, sectionIndex) in sections"
        :key="section.title || sectionIndex"
        class="documents__faq-group"
      >
        <div
          v-for="item in section.items"
          :key="item.question"
          :class="{
            'documents__faq-item--open': openFaqKey === `${sectionIndex}-${item.question}`,
          }"
          class="documents__faq-item"
        >
          <button
            type="button"
            class="documents__faq-summary"
            :aria-expanded="openFaqKey === `${sectionIndex}-${item.question}`"
            @click="toggleFaqItem(`${sectionIndex}-${item.question}`)"
          >
            <span class="documents__faq-question">{{ item.question }}</span>
            <span class="documents__faq-icon" aria-hidden="true"></span>
          </button>

          <div class="documents__faq-answer-shell">
            <div class="documents__faq-answer">
              <div class="documents__faq-entry-answer" v-html="formatFaqAnswer(item.answer)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { formatFaqAnswer } from '@/utils/formatFaqAnswer'

defineProps({
  sections: {
    type: Array,
    required: true,
  },
})

const openFaqKey = ref(null)

function toggleFaqItem(key) {
  openFaqKey.value = openFaqKey.value === key ? null : key
}
</script>

<style scoped>
.documents__faq {
  padding: 24px 0 0;
  margin-bottom: 50px;
}

.documents__faq-shell {
  width: 75%;
  margin: 0 auto;
}

.documents__faq-group {
  display: grid;
  gap: 10px;
}

.documents__faq-group + .documents__faq-group {
  margin-top: 50px;
}

.documents__faq-item {
  padding: 0 22px;
  border-top: 1px solid color-mix(in srgb, var(--black) 14%, var(--white));
  border-bottom: 1px solid color-mix(in srgb, var(--black) 14%, var(--white));
}

.documents__faq-summary {
  display: flex;
  appearance: none;
  -webkit-appearance: none;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 18px;
  padding: 16px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: var(--black);
}

.documents__faq-question {
  font-family: Oswald;
  font-size: 20px;
  font-weight: 300;
  line-height: 1.35;
  letter-spacing: 0.01em;
}

.documents__faq-icon {
  position: relative;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.documents__faq-icon::before,
.documents__faq-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 1px;
  background: color-mix(in srgb, var(--black) 72%, var(--white));
  transform: translate(-50%, -50%);
  transition: transform 0.2s ease;
}

.documents__faq-icon::after {
  transform: translate(-50%, -50%) rotate(90deg);
}

.documents__faq-answer-shell {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.32s ease;
}

.documents__faq-item--open .documents__faq-answer-shell {
  grid-template-rows: 1fr;
}

.documents__faq-answer {
  min-height: 0;
  overflow: hidden;
}

.documents__faq-entry-answer {
  margin: 0;
  padding: 0 0 10px;
  font-size: 16px;
  font-weight: 300;
  line-height: 1.5;
  color: color-mix(in srgb, var(--black) 84%, var(--white));
  opacity: 0;
  transform: translateY(-6px);
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.documents__faq-entry-answer :deep(p),
.documents__faq-entry-answer :deep(ul) {
  margin: 0 0 12px;
}

.documents__faq-entry-answer :deep(ul) {
  padding-left: 18px;
}

.documents__faq-entry-answer :deep(li) {
  margin-bottom: 8px;
}

.documents__faq-entry-answer :deep(a) {
  color: var(--cyan);
  font-weight: 700;
}

.documents__faq-item--open .documents__faq-entry-answer {
  opacity: 1;
  transform: translateY(0);
}

.documents__faq-item--open .documents__faq-icon::after {
  transform: translate(-50%, -50%) rotate(0deg);
}

@media (max-width: 900px) {
  .documents__faq-item {
    padding: 0 14px;
  }

  .documents__faq-shell {
    width: 100%;
  }
}
</style>

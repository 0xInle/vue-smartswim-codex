<template>
  <section class="documents">
    <div class="container">
      <section class="documents__library">
        <div class="documents__intro">
          <h1 class="documents__title">Документы</h1>
          <p class="documents__text">
            Здесь собраны основные документы школы и соревнований: положения, согласия, оферты,
            правила и шаблоны для скачивания.
          </p>
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

      <section class="documents__image-break" aria-hidden="true">
        <img src="/images/17-img.jpg" alt="" class="documents__image" />
        <div class="documents__image-decor">
          <div class="documents__image-panel">
            <p class="documents__image-contact">8 916 729 07 73</p>
          </div>
          <div class="documents__image-panel">
            <p class="documents__image-contact">cupsmartswim@yandex.ru</p>
          </div>
        </div>
      </section>

      <section class="documents__faq">
        <div class="documents__faq-shell">
          <div
            v-for="(section, sectionIndex) in faqSections"
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

      <section class="documents__footer-image">
        <img
          src="/images/20-img.jpg"
          alt="Пловец Smart Swim в воде во время тренировки"
          class="documents__footer-image-media"
        />
      </section>
    </div>

    <HomeFooterSection />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import HomeFooterSection from '@/pages/home/components/HomeFooterSection.vue'
import { documents, faqSections } from '@/pages/documents/documentsData'
import { formatFaqAnswer } from '@/utils/formatFaqAnswer'

const openFaqKey = ref(null)

function toggleFaqItem(key) {
  openFaqKey.value = openFaqKey.value === key ? null : key
}
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
  gap: 10px;
  max-width: 620px;
  margin-bottom: 22px;
}

.documents__eyebrow {
  display: inline-flex;
  align-self: flex-start;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 54%, var(--white));
}

.documents__title {
  margin: 0;
  font-size: clamp(34px, 5vw, 44px);
  line-height: 0.96;
}

.documents__text {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
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
    transform 0.25s ease,
    background-color 0.25s ease,
    border-color 0.25s ease;
}

.documents__card:hover {
  transform: translateY(-2px);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  grid-column: 3 / 4;
  grid-row: 1 / 2;
  min-height: 36px;
  padding: 9px 16px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--orange) 88%, var(--white));
  color: var(--white);
  font-size: 13px;
  font-weight: 600;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease;
}

.documents__card-action:hover {
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--orange) 96%, var(--white));
}

.documents__faq {
  padding: 24px 0 0;
  margin-bottom: 50px;
}

.documents__image-break {
  position: relative;
  margin-bottom: 50px;
  border-radius: 10px;
  overflow: hidden;
  min-height: 208px;
}

.documents__image-break::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgb(from var(--black) r g b / 22%);
}

.documents__image {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 208px;
  object-fit: cover;
}

.documents__image-decor {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(360px, 520px));
  place-content: center;
  gap: 28px;
  padding: 24px;
}

.documents__image-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  border: 1px solid rgb(from var(--white) r g b / 18%);
  border-radius: 10px;
  background: linear-gradient(
    180deg,
    rgb(from var(--white) r g b / 16%) 0%,
    rgb(from var(--white) r g b / 8%) 100%
  );
  box-shadow:
    inset 0 1px 0 rgb(from var(--white) r g b / 20%),
    0 10px 28px rgb(from var(--black) r g b / 8%);
}

.documents__image-contact {
  margin: 0;
  padding: 20px;
  font-family: Oswald;
  font-size: clamp(28px, 3.6vw, 42px);
  font-weight: 300;
  line-height: 1.1;
  text-align: center;
  color: rgb(from var(--white) r g b / 94%);
  overflow-wrap: anywhere;
  text-transform: uppercase;
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
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 18px;
  padding: 16px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
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

.documents__footer-image {
  margin-bottom: 120px;
  border-radius: 10px;
  overflow: hidden;
}

.documents__footer-image-media {
  display: block;
  width: 100%;
  height: 600px;
  object-fit: cover;
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

@media (max-width: 900px) {
  .documents__faq-item {
    padding: 0 14px;
  }

  .documents__faq-shell {
    width: 100%;
  }

  .documents__image-break {
    min-height: 190px;
  }

  .documents__image {
    min-height: 190px;
  }

  .documents__image-decor {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
    gap: 18px;
  }

  .documents__image-panel {
    min-height: 240px;
  }
}

@media (max-width: 640px) {
  .documents__library {
    padding-top: 20px;
    margin-bottom: 30px;
  }

  .documents__title {
    font-size: clamp(34px, 10vw, 42px);
  }

  .documents__grid {
    grid-template-columns: 1fr;
  }

  .documents__card {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 14px;
    min-height: auto;
  }

  .documents__card-head {
    grid-column: auto;
  }

  .documents__card-icon {
    grid-column: auto;
    grid-row: auto;
    justify-self: start;
  }

  .documents__card-action {
    grid-column: auto;
    grid-row: auto;
    justify-self: start;
  }

  .documents__faq-question {
    font-size: 18px;
    line-height: 1.3;
  }

  .documents__faq-entry-answer {
    font-size: 15px;
  }

  .documents__image-break {
    min-height: 168px;
    margin-bottom: 30px;
  }

  .documents__image {
    min-height: 168px;
  }

  .documents__image-decor {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
    gap: 14px;
    padding: 16px;
  }

  .documents__image-panel {
    min-height: 180px;
    border-radius: 10px;
  }

  .documents__image-contact {
    font-size: 20px;
  }

  .documents__faq {
    margin-bottom: 30px;
  }
}

@media (max-width: 420px) {
  .documents__title {
    font-size: clamp(30px, 9vw, 34px);
  }
}
</style>

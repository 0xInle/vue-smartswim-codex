<template>
  <section class="contacts">
    <div class="container">
      <section class="contacts__hero">
        <div class="contacts__hero-shell">
          <div class="contacts__hero-copy contacts__card-shell contacts__card-shell--blue">
            <div class="contacts__hero-head">
              <h1 class="contacts__title">Контакты</h1>
            </div>

            <div class="contacts__card-grid">
              <article v-for="item in contactCards" :key="item.title" class="contacts__item">
                <span class="contacts__item-accent" aria-hidden="true">{{ item.accent }}</span>

                <div class="contacts__item-copy">
                  <span class="contacts__item-label">{{ item.title }}</span>

                  <a
                    v-if="item.href"
                    :href="item.href"
                    class="contacts__item-value contacts__item-value--link link-reset"
                  >
                    {{ item.value }}
                  </a>

                  <p v-else class="contacts__item-value">
                    {{ item.value }}
                  </p>

                  <p v-if="item.description" class="contacts__item-description">
                    {{ item.description }}
                  </p>
                </div>
              </article>
            </div>
          </div>

          <aside class="contacts__aside">
            <div class="contacts__panel contacts__panel--visual">
              <img
                :src="contactsImage"
                alt="Пловцы Smart Swim на бортике бассейна"
                class="contacts__image"
              />
              <div class="contacts__overlay-card">
                <span class="contacts__overlay-label">Быстрый контакт</span>
                <a href="tel:+79167290773" class="contacts__overlay-link link-reset">
                  +7 (916) 729-07-73
                </a>
                <a href="mailto:cupsmartswim@yandex.ru" class="contacts__overlay-link link-reset">
                  cupsmartswim@yandex.ru
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>

    <HomeFooterSection />
  </section>
</template>

<script setup>
import HomeFooterSection from '@/pages/home/components/HomeFooterSection.vue'
import { contactCards } from '@/pages/contacts/contactsData'
import { publicAsset } from '@/utils/publicAsset'

const contactsImage = publicAsset('/images/18-img.jpg')
</script>

<style scoped>
.contacts__hero {
  position: relative;
  padding: 28px 0 120px;
}

.contacts__hero::before {
  content: '';
  position: absolute;
  inset: 0;
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  background: linear-gradient(
    90deg,
    var(--very-light-blue) 0%,
    var(--very-light-blue) 50%,
    var(--white) 50%,
    var(--white) 100%
  );
  z-index: -1;
}

.contacts__hero-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 22px;
  align-items: stretch;
}

.contacts__hero-copy,
.contacts__card-shell,
.contacts__panel,
.contacts__item {
  border: 1px solid color-mix(in srgb, var(--white) 28%, transparent);
  box-shadow:
    0 20px 50px rgb(from var(--black) r g b / 9%),
    inset 0 1px 0 rgb(from var(--white) r g b / 26%);
}

.contacts__hero-copy {
  display: grid;
  gap: 22px;
  min-height: 100%;
  padding: 44px 28px;
  border-radius: 10px;
}

.contacts__hero-head {
  display: grid;
  gap: 12px;
}

.contacts__item-label,
.contacts__overlay-label {
  display: inline-flex;
  align-self: flex-start;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--orange);
}

.contacts__title {
  margin: 0;
  font-size: clamp(42px, 7vw, 48px);
  line-height: 0.95;
}

.contacts__item-value,
.contacts__item-description {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.contacts__card-shell {
  padding: 22px;
  border-radius: 10px;
}

.contacts__card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.contacts__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 16px;
  align-items: flex-start;
  padding: 20px;
  border-radius: 10px;
  transition:
    border-color 0.25s ease,
    background-color 0.25s ease;
}

.contacts__item:hover,
.contacts__panel:hover {
  border-color: color-mix(in srgb, var(--cyan) 30%, var(--white));
}

.contacts__item-accent {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  padding: 0;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--cyan) 20%, var(--white));
  background: color-mix(in srgb, var(--cyan) 16%, var(--white));
  color: color-mix(in srgb, var(--black) 68%, var(--white));
  font-family: Oswald, sans-serif;
  font-size: 16px;
  line-height: 1;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.contacts__item-copy,
.contacts__overlay-card {
  display: grid;
  gap: 10px;
}

.contacts__item-value,
.contacts__item-description {
  line-height: 1.45;
  color: var(--black);
}

.contacts__item-description {
  font-size: 14px;
  color: color-mix(in srgb, var(--black) 62%, var(--white));
}

.contacts__item-value--link,
.contacts__overlay-link {
  transition:
    color 0.25s ease,
    transform 0.25s ease;
}

.contacts__item-value--link:hover,
.contacts__overlay-link:hover {
  transform: translateX(2px);
}

.contacts__aside {
  display: flex;
}

.contacts__panel {
  overflow: hidden;
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 76%);
  transition:
    transform 0.25s ease,
    border-color 0.25s ease;
}

.contacts__panel--visual {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 100%;
}

.contacts__image {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  flex: 1 1 auto;
}

.contacts__panel--visual::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgb(from var(--black) r g b / 8%) 0%,
    rgb(from var(--black) r g b / 46%) 100%
  );
  pointer-events: none;
}

.contacts__overlay-card {
  position: absolute;
  top: 18px;
  right: 18px;
  left: 18px;
  z-index: 1;
  padding: 18px;
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 20%);
}

.contacts__overlay-link {
  width: fit-content;
  font-size: 20px;
  font-weight: 700;
  color: var(--white);
}

@media (max-width: 960px) {
  .contacts__hero {
    padding-bottom: 120px;
  }

  .contacts__hero-shell {
    grid-template-columns: 1fr;
  }

  .contacts__hero-copy {
    padding: 38px 24px;
  }

  .contacts__card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .contacts__item:nth-child(4) {
    order: 1;
  }

  .contacts__item:nth-child(5) {
    order: 2;
  }

  .contacts__item:nth-child(1) {
    order: 3;
  }

  .contacts__item:nth-child(2) {
    order: 4;
  }

  .contacts__item:nth-child(3) {
    order: 5;
    grid-column: 1 / -1;
  }

  .contacts__aside {
    display: none;
  }
}

@media (max-width: 640px) {
  .contacts__hero {
    padding-top: 18px;
  }

  .contacts__title {
    font-size: clamp(34px, 10vw, 42px);
  }

  .contacts__hero::before {
    background: linear-gradient(
      180deg,
      var(--very-light-blue) 0%,
      var(--very-light-blue) 52%,
      var(--white) 52%,
      var(--white) 100%
    );
  }

  .contacts__hero-copy,
  .contacts__card-shell,
  .contacts__panel--visual {
    padding: 18px;
  }

  .contacts__item {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .contacts__item-accent {
    min-width: 48px;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    font-size: 16px;
  }

  .contacts__overlay-link {
    font-size: 16px;
    word-break: break-word;
  }
}

@media (max-width: 700px) {
  .contacts__card-grid {
    grid-template-columns: 1fr;
  }

  .contacts__item:nth-child(3) {
    grid-column: auto;
  }
}

@media (max-width: 420px) {
  .contacts__title {
    font-size: clamp(30px, 9vw, 34px);
  }
}
</style>

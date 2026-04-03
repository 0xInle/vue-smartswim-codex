<template>
  <section class="fees">
    <div class="container">
      <div class="fees__hero">
        <div class="fees__hero-copy">
          <h1 class="fees__title">Сборы по плаванию</h1>
          <p class="fees__text">
            Команда SmartSwimTeam организует сборы по плаванию для детей и взрослых для различных
            уровней подготовленности.
          </p>
          <p class="fees__text">
            У каждого тренера в группе от 10 до 15 человек, группы делятся по уровню
            подготовленности вне зависимости от возраста. Помимо занятий мы организуем насыщенную
            программу: экскурсии, лекции, мотивирующие беседы и мастер-классы.
          </p>
          <p class="fees__text">
            Команда SmartSwim организовала более 70 сборов по России и Белоруссии. К нам приезжают
            спортсмены из разных городов России. Побывав однажды с нами на сборах, ваше
            представление о них изменится навсегда.
          </p>
        </div>

        <aside class="fees__hero-aside">
          <div class="fees__fact-card">
            <span class="fees__fact-label">Формат</span>
            <strong class="fees__fact-value">Тренировки + восстановление</strong>
            <p class="fees__fact-text">
              Два водных занятия, зал, растяжка и вечерняя программа в одном ритме дня.
            </p>
          </div>
          <div class="fees__fact-card">
            <span class="fees__fact-label">Группы</span>
            <strong class="fees__fact-value">10-15 спортсменов</strong>
            <p class="fees__fact-text">
              Деление по уровню подготовки, чтобы каждая смена работала в комфортном темпе.
            </p>
          </div>
        </aside>
      </div>

      <div class="fees__cards">
        <RouterLink
          v-for="camp in feeCamps"
          :key="camp.slug"
          :to="`/fees/${camp.slug}`"
          class="fees__card link-reset"
        >
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

            <span class="fees__card-action">Открыть описание сбора</span>
          </div>
        </RouterLink>
      </div>

      <section class="fees__features">
        <div class="fees__feature-grid">
          <article class="fees__feature-card fees__feature-card--cyan">
            <span class="fees__feature-number">01</span>
            <h3 class="fees__feature-title">Ритм дня</h3>
            <p class="fees__feature-text">
              Два бассейна, зал, восстановление и вечерние активности собираются в один спортивный
              режим без случайных пауз.
            </p>
          </article>

          <article class="fees__feature-card fees__feature-card--blue">
            <span class="fees__feature-number">02</span>
            <h3 class="fees__feature-title">Техника и контроль</h3>
            <p class="fees__feature-text">
              В фокусе техника плавания, дыхание, старты, повороты и контрольные тесты по ходу всей
              смены.
            </p>
          </article>

          <article class="fees__feature-card fees__feature-card--orange">
            <span class="fees__feature-number">03</span>
            <h3 class="fees__feature-title">Командная атмосфера</h3>
            <p class="fees__feature-text">
              Сборы дают не только объем работы, но и сильную среду, в которую спортсменам хочется
              возвращаться снова.
            </p>
          </article>
        </div>
      </section>
    </div>

    <HomeFooterSection />
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import HomeFooterSection from '@/pages/home/components/HomeFooterSection.vue'
import { feeCamps } from '@/pages/fees/feesData'
</script>

<style scoped>
.fees__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: 22px;
  padding: 28px 0 36px;
  margin-bottom: 50px;
  align-items: center;
}

.fees__hero::before {
  content: '';
  position: absolute;
  inset: 0;
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  background: linear-gradient(
    90deg,
    var(--very-light-blue) 0%,
    var(--very-light-blue) 52%,
    var(--white) 52%,
    var(--white) 100%
  );
  z-index: -1;
}

.fees__hero-copy,
.fees__hero-aside,
.fees__card,
.fees__feature-card {
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  box-shadow:
    0 20px 50px rgb(from var(--black) r g b / 9%),
    inset 0 1px 0 rgb(from var(--white) r g b / 28%);
}

.fees__hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  padding: 100px 20px;
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 50%);
}

.fees__hero-aside {
  display: grid;
  gap: 16px;
  align-self: center;
  height: fit-content;
  padding: 20px;
  border-radius: 10px;
  background: rgb(from var(--cyan) r g b / 20%);
}

.fees__eyebrow {
  display: inline-flex;
  align-self: flex-start;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 54%, var(--white));
}

.fees__title,
.fees__card-title,
.fees__feature-title {
  margin: 0;
  font-size: clamp(42px, 7vw, 48px);
  line-height: 0.95;
}

.fees__title {
  font-size: clamp(42px, 7vw, 48px);
}

.fees__text,
.fees__feature-text,
.fees__fact-text {
  margin: 0;
  font-weight: 500;
  font-size: 16px;
}

.fees__fact-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px;
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 42%);
}

.fees__fact-label,
.fees__meta-label {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 54%, var(--white));
}

.fees__fact-value,
.fees__meta-value {
  line-height: 1.4;
}

.fees__fact-value {
  font-size: 21px;

  line-height: 1;
}

.fees__cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 84px;
}

.fees__card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border-radius: 10px;
  overflow: hidden;
  background: rgb(from var(--white) r g b / 56%);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.fees__card:hover {
  transform: translateY(-6px);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 47px;
  margin-top: auto;
  margin-top: 22px;
  padding: 11px 24px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--orange) 88%, var(--white));
  font-size: 15px;
  font-weight: 500;
  color: var(--white);
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.fees__card:hover .fees__card-action {
  background: color-mix(in srgb, var(--orange) 96%, var(--white));
}

.fees__features {
  padding: 12px 0 120px;
}

.fees__feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 36px;
}

.fees__feature-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 572px;
  padding: 58px 34px;
  border-radius: 10px;
  text-align: center;
}

.fees__feature-card--cyan {
  justify-content: flex-start;
  background: rgb(from var(--aqua) r g b / 34%);
}

.fees__feature-card--blue {
  justify-content: center;
  background: rgb(from var(--light-blue) r g b / 40%);
}

.fees__feature-card--orange {
  justify-content: flex-end;
  background: rgb(from var(--orange) r g b / 28%);
}

.fees__feature-number {
  font-family: Oswald;
  font-size: 56px;
  line-height: 1;
}

.fees__feature-title {
  font-size: 24px;
  line-height: 1;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .fees__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fees__feature-grid {
    gap: 24px;
  }
}

@media (max-width: 900px) {
  .fees__hero {
    grid-template-columns: 1fr;
  }

  .fees__hero::before {
    background: var(--very-light-blue);
  }

  .fees__hero-aside {
    justify-self: stretch;
  }

  .fees__feature-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .fees__cards {
    grid-template-columns: 1fr;
  }

  .fees__hero-copy,
  .fees__hero-aside,
  .fees__card-body {
    padding: 20px;
  }

  .fees__feature-card {
    min-height: 360px;
    padding: 36px 24px;
  }
}
</style>

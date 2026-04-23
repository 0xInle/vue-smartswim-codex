<template>
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
        спортсмены из разных городов России. Побывав однажды с нами на сборах, ваше представление
        о них изменится навсегда.
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
</template>

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
.fees__hero-aside {
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

.fees__title {
  margin: 0;
  font-size: clamp(42px, 7vw, 48px);
  line-height: 0.95;
}

.fees__text,
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

.fees__fact-label {
  display: inline-flex;
  align-self: flex-start;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 54%, var(--white));
}

.fees__fact-value {
  font-size: 21px;
  line-height: 1;
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
}

@media (max-width: 720px) {
  .fees__hero {
    margin-bottom: 30px;
  }

  .fees__hero-copy,
  .fees__hero-aside {
    padding: 20px;
  }

  .fees__title {
    font-size: clamp(34px, 10vw, 42px);
  }
}

@media (max-width: 420px) {
  .fees__title {
    font-size: clamp(30px, 9vw, 34px);
  }
}
</style>

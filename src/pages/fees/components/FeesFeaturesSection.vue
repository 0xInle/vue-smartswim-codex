<template>
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
</template>

<style scoped>
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
  margin: 0;
}

.fees__feature-text {
  margin: 0;
}

@media (max-width: 1100px) {
  .fees__feature-grid {
    gap: 24px;
  }
}

@media (max-width: 900px) {
  .fees__feature-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .fees__feature-card {
    min-height: 360px;
    padding: 36px 24px;
  }
}
</style>

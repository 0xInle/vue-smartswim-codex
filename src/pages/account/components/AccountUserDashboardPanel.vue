<template>
  <ElCard class="account__panel account-user-dashboard" shadow="never">
    <div class="account-user-dashboard__grid">
      <article class="account-user-dashboard__tile">
        <span class="account-user-dashboard__label">Профиль</span>
        <strong class="account-user-dashboard__value">—</strong>
      </article>
      <article class="account-user-dashboard__tile">
        <span class="account-user-dashboard__label">Спортсмены</span>
        <strong class="account-user-dashboard__value">—</strong>
      </article>
      <article class="account-user-dashboard__tile">
        <span class="account-user-dashboard__label">Документы</span>
        <strong class="account-user-dashboard__value">—</strong>
      </article>
      <article class="account-user-dashboard__tile">
        <span class="account-user-dashboard__label">Регистрации</span>
        <strong class="account-user-dashboard__value">—</strong>
      </article>
    </div>
  </ElCard>
</template>

<script setup>
import { ElCard } from 'element-plus'
</script>

<style scoped>
.account-user-dashboard__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.account-user-dashboard__tile {
  display: grid;
  gap: 6px;
  min-height: 110px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: linear-gradient(180deg, rgb(246 251 255 / 0.92) 0%, rgb(255 255 255 / 0.86) 100%);
}

.account-user-dashboard__label {
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
}

.account-user-dashboard__value {
  font-family: Oswald, sans-serif;
  font-size: 36px;
  line-height: 1;
  text-transform: uppercase;
  color: var(--black);
}

@media (max-width: 640px) {
  .account-user-dashboard__grid {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <section class="account">
    <div class="account__layout">
      <aside class="account__sidebar">
        <div class="account__brand">
          <p class="account__brand-eyebrow">Smart Swim CRM</p>
          <h1 class="account__brand-title">Admin Panel</h1>
          <p class="account__brand-text">Система управления клиентами и контентом сайта.</p>
        </div>

        <nav class="account__nav" aria-label="Навигация CRM">
          <button
            v-for="item in navigationItems"
            :key="item.id"
            type="button"
            class="account__nav-button btn-reset"
            :class="{ 'account__nav-button--active': activeSection === item.id }"
            @click="activeSection = item.id"
          >
            <span class="account__nav-button-label">{{ item.label }}</span>
            <span class="account__nav-button-meta">{{ item.meta }}</span>
          </button>
        </nav>

        <RouterLink class="account__back link-reset" to="/">Вернуться на сайт</RouterLink>
      </aside>

      <main class="account__content">
        <header class="account__topbar">
          <div class="account__topbar-copy">
            <p class="account__eyebrow">CRM Dashboard</p>
            <h2 class="account__title">{{ currentSectionTitle }}</h2>
            <p class="account__subtitle">{{ currentSectionDescription }}</p>
          </div>

          <div class="account__topbar-actions">
            <div class="account__topbar-status">
              <span class="account__status-label">Система</span>
              <strong class="account__status-value">Онлайн</strong>
            </div>
            <div class="account__topbar-status">
              <span class="account__status-label">Пользователи</span>
              <strong class="account__status-value">{{ registeredUsers.length }}</strong>
            </div>
          </div>
        </header>

        <template v-if="activeSection === 'dashboard'">
          <section class="account__stats">
            <article class="account__stat-card">
              <span class="account__stat-label">Всего пользователей</span>
              <strong class="account__stat-value">{{ registeredUsers.length }}</strong>
            </article>
            <article class="account__stat-card">
              <span class="account__stat-label">Последняя регистрация</span>
              <strong class="account__stat-value">{{ latestUserName }}</strong>
            </article>
            <article class="account__stat-card">
              <span class="account__stat-label">Последний email</span>
              <strong class="account__stat-value">{{ latestUserEmail }}</strong>
            </article>
            <article class="account__stat-card">
              <span class="account__stat-label">Дата регистрации</span>
              <strong class="account__stat-value">{{ latestUserRegistrationDate }}</strong>
            </article>
          </section>

          <section class="account__grid">
            <article class="account__panel">
              <div class="account__panel-header">
                <div>
                  <p class="account__panel-eyebrow">Обзор клиентов</p>
                  <h3 class="account__panel-title">Последний зарегистрированный пользователь</h3>
                </div>
                <span class="account__panel-badge">
                  {{ latestUser ? 'Данные получены' : 'Ожидаем регистрацию' }}
                </span>
              </div>

              <dl v-if="latestUser" class="account__details">
                <div class="account__detail-row">
                  <dt class="account__detail-label">Имя</dt>
                  <dd class="account__detail-value">{{ latestUser.name || 'Не указано' }}</dd>
                </div>
                <div class="account__detail-row">
                  <dt class="account__detail-label">Почта</dt>
                  <dd class="account__detail-value">{{ latestUser.email }}</dd>
                </div>
                <div class="account__detail-row">
                  <dt class="account__detail-label">Дата регистрации</dt>
                  <dd class="account__detail-value">{{ latestUserRegistrationDate }}</dd>
                </div>
              </dl>

              <p v-else class="account__empty">
                После первой регистрации здесь появятся данные клиента.
              </p>
            </article>

            <article class="account__panel">
              <div class="account__panel-header">
                <div>
                  <p class="account__panel-eyebrow">Управление</p>
                  <h3 class="account__panel-title">Ключевые действия CRM</h3>
                </div>
              </div>

              <ul class="account__checklist list-reset">
                <li class="account__check-item">Контроль новых регистраций клиентов.</li>
                <li class="account__check-item">Подготовка панели для заявок и лидов.</li>
                <li class="account__check-item">
                  Будущее управление страницами и контентом сайта.
                </li>
                <li class="account__check-item">
                  Мониторинг контактных данных и статуса клиентов.
                </li>
              </ul>
            </article>
          </section>
        </template>

        <template v-else-if="activeSection === 'users'">
          <section class="account__panel account__panel--table">
            <div class="account__panel-header">
              <div>
                <p class="account__panel-eyebrow">База клиентов</p>
                <h3 class="account__panel-title">Зарегистрированные пользователи</h3>
              </div>
              <span class="account__panel-badge">{{ registeredUsers.length }} записей</span>
            </div>

            <div v-if="registeredUsers.length" class="account__table-wrap">
              <table class="account__table">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>Почта</th>
                    <th>Дата регистрации</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in registeredUsers" :key="user.email">
                    <td>{{ user.name || 'Не указано' }}</td>
                    <td>{{ user.email }}</td>
                    <td>{{ formatRegistrationDate(user.registeredAt) }}</td>
                    <td>
                      <span class="account__table-status">Активен</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p v-else class="account__empty">Зарегистрированных пользователей пока нет.</p>
          </section>
        </template>

        <template v-else>
          <section class="account__placeholder">
            <div class="account__placeholder-card">
              <p class="account__panel-eyebrow">Раздел в разработке</p>
              <h3 class="account__panel-title">{{ currentSectionTitle }}</h3>
              <p class="account__note">
                Это базовый прототип CRM. Раздел уже присутствует в навигации как часть классической
                admin-системы и может быть наполнен реальными данными следующим шагом.
              </p>
            </div>
          </section>
        </template>
      </main>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getRegisteredUsersSnapshot, loadRegisteredUser } from '@/utils/accountStorage'

const navigationItems = [
  { id: 'dashboard', label: 'Дашборд', meta: 'Обзор системы' },
  { id: 'users', label: 'Пользователи', meta: 'Клиенты и база' },
  { id: 'leads', label: 'Заявки', meta: 'Лиды и обращения' },
  { id: 'content', label: 'Контент', meta: 'Страницы сайта' },
  { id: 'analytics', label: 'Аналитика', meta: 'Отчеты и метрики' },
  { id: 'settings', label: 'Настройки', meta: 'Права и конфигурация' },
]

const activeSection = ref('dashboard')
const registeredUser = loadRegisteredUser()
const registeredUsers = getRegisteredUsersSnapshot()

function formatRegistrationDate(date) {
  if (!date) {
    return 'Неизвестно'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

const latestUser = computed(() => registeredUsers[0] || registeredUser || null)
const latestUserName = computed(() => latestUser.value?.name || 'Нет данных')
const latestUserEmail = computed(() => latestUser.value?.email || 'Нет данных')
const latestUserRegistrationDate = computed(() =>
  latestUser.value ? formatRegistrationDate(latestUser.value.registeredAt) : 'Нет данных',
)

const currentSectionTitle = computed(() => {
  const sectionTitles = {
    dashboard: 'Главный дашборд',
    users: 'Пользователи',
    leads: 'Заявки',
    content: 'Контент сайта',
    analytics: 'Аналитика',
    settings: 'Настройки системы',
  }

  return sectionTitles[activeSection.value]
})

const currentSectionDescription = computed(() => {
  const sectionDescriptions = {
    dashboard: 'Сводка по регистрации клиентов и текущему состоянию CRM-системы.',
    users: 'Список пользователей, зарегистрированных через форму на сайте.',
    leads: 'Раздел для работы с новыми обращениями и клиентскими заявками.',
    content: 'Управление страницами, блоками сайта и редакционным контентом.',
    analytics: 'Отчеты по воронке, регистрациям и активности пользователей.',
    settings: 'Базовая конфигурация CRM, роли и служебные параметры системы.',
  }

  return sectionDescriptions[activeSection.value]
})
</script>

<style scoped>
.account {
  min-height: var(--app-screen-height);
  background: #f1f5f9;
}

.account__layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: var(--app-screen-height);
}

.account__sidebar {
  display: grid;
  align-content: start;
  gap: 20px;
  padding: 24px 18px;
  background: #0f172a;
  color: var(--white);
}

.account__brand {
  display: grid;
  gap: 10px;
}

.account__brand-eyebrow,
.account__eyebrow,
.account__panel-eyebrow,
.account__stat-label,
.account__detail-label,
.account__status-label,
.account__nav-button-meta {
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.account__brand-eyebrow {
  color: #60a5fa;
}

.account__brand-title,
.account__title,
.account__panel-title {
  margin: 0;
  font-family: inherit;
  letter-spacing: normal;
}

.account__brand-title {
  font-size: 24px;
  line-height: 1.1;
}

.account__brand-text,
.account__subtitle,
.account__detail-value,
.account__empty,
.account__note,
.account__check-item,
.account__nav-button-label {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
}

.account__brand-text {
  color: #cbd5e1;
}

.account__nav {
  display: grid;
  gap: 8px;
}

.account__nav-button {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  text-align: left;
  color: var(--white);
}

.account__nav-button:hover {
  background: #1f2937;
}

.account__nav-button--active {
  border-color: #334155;
  background: #1e293b;
}

.account__nav-button-label {
  font-size: 14px;
  line-height: 1.25;
}

.account__nav-button-meta {
  color: #94a3b8;
}

.account__back {
  --button-bg: var(--button-orange-bg);
  --button-hover-bg: var(--button-orange-hover-bg);
  --button-focus-color: var(--orange);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 12px 18px;
  border-radius: 10px;
  background-color: var(--button-current-bg, var(--button-bg));
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--black);
}

.account__content {
  display: grid;
  align-content: start;
  gap: 16px;
  padding: 20px;
}

.account__topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
}

.account__topbar-copy {
  display: grid;
  gap: 8px;
}

.account__eyebrow,
.account__panel-eyebrow,
.account__stat-label,
.account__detail-label,
.account__status-label {
  color: #64748b;
}

.account__title {
  font-size: clamp(22px, 2.6vw, 30px);
  line-height: 1.1;
}

.account__subtitle {
  color: #475569;
}

.account__topbar-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
  gap: 10px;
}

.account__topbar-status {
  display: grid;
  align-content: center;
  gap: 6px;
  min-width: 160px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

.account__status-value {
  font-size: 18px;
  line-height: 1.15;
}

.account__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.account__stat-card {
  display: grid;
  gap: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 8px 20px rgb(15 23 42 / 0.04);
}

.account__stat-value {
  font-size: 17px;
  line-height: 1.2;
  color: #0f172a;
}

.account__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 16px;
}

.account__panel {
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 8px 20px rgb(15 23 42 / 0.04);
}

.account__panel--table {
  align-content: start;
}

.account__panel-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.account__panel-title {
  font-size: 20px;
  line-height: 1.1;
}

.account__panel-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #dbeafe;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1d4ed8;
}

.account__details {
  display: grid;
  gap: 10px;
  margin: 0;
}

.account__detail-row {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

.account__detail-value {
  color: #0f172a;
}

.account__checklist {
  display: grid;
  gap: 10px;
}

.account__check-item {
  position: relative;
  padding: 12px 14px 12px 38px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #334155;
}

.account__check-item::before {
  content: '';
  position: absolute;
  top: 16px;
  left: 14px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #2563eb;
  box-shadow: 0 0 0 5px rgb(37 99 235 / 0.12);
}

.account__note {
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #475569;
}

.account__table-wrap {
  overflow-x: auto;
}

.account__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 680px;
}

.account__table th,
.account__table td {
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
  text-align: left;
  color: #0f172a;
}

.account__table th {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
  background: #f8fafc;
}

.account__table-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #dcfce7;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #166534;
}

.account__placeholder {
  display: grid;
}

.account__placeholder-card {
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 8px 20px rgb(15 23 42 / 0.04);
}

@media (max-width: 1200px) {
  .account__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .account__layout,
  .account__grid,
  .account__topbar,
  .account__stats {
    grid-template-columns: 1fr;
  }

  .account__topbar-actions {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 767px) {
  .account__layout {
    grid-template-columns: 1fr;
  }

  .account__content,
  .account__sidebar {
    padding: 18px;
  }

  .account__topbar,
  .account__stat-card,
  .account__panel,
  .account__placeholder-card {
    padding: 20px 18px;
  }

  .account__panel-header {
    flex-direction: column;
  }

  .account__topbar-actions {
    grid-template-columns: 1fr;
  }
}
</style>

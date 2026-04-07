<template>
  <section class="account">
    <el-container class="account__shell">
      <el-aside class="account__sidebar" width="280px">
        <div class="account__brand">
          <span class="account__brand-badge">Smart Swim CRM</span>
          <h1 class="account__brand-title">Operations Panel</h1>
        </div>

        <el-scrollbar class="account__menu-scroll">
          <el-menu
            :default-active="activeSection"
            class="account__menu"
            @select="handleSectionSelect"
          >
            <el-menu-item v-for="item in navigationItems" :key="item.id" :index="item.id">
              <el-icon><component :is="item.icon" /></el-icon>
              <div class="account__menu-copy">
                <span class="account__menu-label">{{ item.label }}</span>
                <span class="account__menu-meta">{{ item.meta }}</span>
              </div>
            </el-menu-item>
          </el-menu>
        </el-scrollbar>
      </el-aside>

      <el-container class="account__content-shell">
        <el-header class="account__header">
          <div class="account__header-copy">
            <h2 class="account__title">{{ currentSectionTitle }}</h2>
            <p class="account__subtitle">{{ currentSectionDescription }}</p>
            <div class="account__header-statuses">
              <el-card class="account__header-card" shadow="never">
                <span class="account__header-label">Система</span>
                <strong class="account__header-value">Online</strong>
              </el-card>
              <el-card class="account__header-card" shadow="never">
                <span class="account__header-label">Пользователи</span>
                <strong class="account__header-value">
                  {{ isUsersLoading ? '...' : registeredUsers.length }}
                </strong>
              </el-card>
            </div>
          </div>

          <el-button class="account__back-button" type="primary" @click="handleSignOut">
            Выйти
          </el-button>
        </el-header>

        <el-main class="account__main">
          <el-alert
            v-if="usersLoadError"
            :title="usersLoadError"
            type="warning"
            show-icon
            :closable="false"
            class="account__sync-alert"
          />

          <template v-if="activeSection === 'dashboard'">
            <div class="account__metrics">
              <div
                v-for="metric in dashboardMetrics"
                :key="metric.label"
                class="account__metric-col"
              >
                <el-card class="account__metric-card" shadow="hover">
                  <div class="account__metric-top">
                    <div class="account__metric-copy">
                      <span class="account__metric-label">{{ metric.label }}</span>
                      <strong class="account__metric-value">{{ metric.value }}</strong>
                    </div>
                    <el-tag :type="metric.tagType" effect="light" round>{{ metric.tag }}</el-tag>
                  </div>
                  <p class="account__metric-note">{{ metric.note }}</p>
                </el-card>
              </div>
            </div>

            <div class="account__dashboard-grid">
              <div class="account__dashboard-main">
                <el-card class="account__panel" shadow="never">
                  <template #header>
                    <div class="account__panel-head">
                      <div>
                        <p class="account__panel-eyebrow">Клиентский профиль</p>
                        <h3 class="account__panel-title">Профиль текущего пользователя</h3>
                      </div>
                      <el-tag :type="latestUser ? 'success' : 'info'" effect="light" round>
                        {{ latestUser ? 'Данные получены' : 'Ожидаем регистрацию' }}
                      </el-tag>
                    </div>
                  </template>

                  <template v-if="latestUser">
                    <el-descriptions :column="1" border class="account__descriptions">
                      <el-descriptions-item label="Имя">
                        {{ latestUser.name || 'Не указано' }}
                      </el-descriptions-item>
                      <el-descriptions-item label="Почта">
                        {{ latestUser.email }}
                      </el-descriptions-item>
                      <el-descriptions-item label="Дата регистрации">
                        {{ latestUserRegistrationDate }}
                      </el-descriptions-item>
                      <el-descriptions-item label="Статус">
                        <el-tag type="success" effect="light" round>Активен</el-tag>
                      </el-descriptions-item>
                    </el-descriptions>
                  </template>

                  <el-empty
                    v-else
                    description="После входа здесь появятся данные текущего пользователя."
                  />
                </el-card>
              </div>

              <div class="account__dashboard-side">
                <el-card class="account__panel" shadow="never">
                  <template #header>
                    <div class="account__panel-head">
                      <div>
                        <p class="account__panel-eyebrow">Операции</p>
                        <h3 class="account__panel-title">Ключевые действия CRM</h3>
                      </div>
                    </div>
                  </template>

                  <el-timeline>
                    <el-timeline-item
                      v-for="item in keyActions"
                      :key="item.title"
                      :timestamp="item.timestamp"
                      placement="top"
                      type="primary"
                    >
                      <div class="account__timeline-card">
                        <strong class="account__timeline-title">{{ item.title }}</strong>
                        <p class="account__timeline-text">{{ item.text }}</p>
                      </div>
                    </el-timeline-item>
                  </el-timeline>
                </el-card>
              </div>
            </div>
          </template>

          <template v-else-if="activeSection === 'users'">
            <el-card class="account__panel" shadow="never">
              <template #header>
                <div class="account__panel-head">
                  <div>
                    <p class="account__panel-eyebrow">База клиентов</p>
                    <h3 class="account__panel-title">Текущий профиль</h3>
                  </div>
                  <el-tag type="primary" effect="light" round>
                    {{ registeredUsers.length }} записей
                  </el-tag>
                </div>
              </template>

              <el-table
                :data="registeredUsers"
                row-key="email"
                border
                stripe
                empty-text="Профиль текущего пользователя пока недоступен."
              >
                <el-table-column label="Имя" min-width="180">
                  <template #default="{ row }">
                    {{ row.name || 'Не указано' }}
                  </template>
                </el-table-column>
                <el-table-column prop="email" label="Почта" min-width="240" />
                <el-table-column label="Дата регистрации" min-width="220">
                  <template #default="{ row }">
                    {{ formatRegistrationDate(row.registeredAt) }}
                  </template>
                </el-table-column>
                <el-table-column label="Статус" width="140" align="center">
                  <template #default>
                    <el-tag type="success" effect="light" round>Активен</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </template>

          <template v-else>
            <el-card class="account__panel" shadow="never">
              <template #header>
                <div class="account__panel-head">
                  <div>
                    <p class="account__panel-eyebrow">Roadmap</p>
                    <h3 class="account__panel-title">{{ currentSectionTitle }}</h3>
                  </div>
                  <el-tag type="warning" effect="light" round>Раздел в разработке</el-tag>
                </div>
              </template>

              <el-alert
                :title="currentSectionDescription"
                type="info"
                show-icon
                :closable="false"
                class="account__alert"
              />

              <div class="account__roadmap-grid">
                <div v-for="item in currentSectionRoadmap" :key="item.title">
                  <div class="account__roadmap-card">
                    <span class="account__roadmap-step">{{ item.step }}</span>
                    <strong class="account__roadmap-title">{{ item.title }}</strong>
                    <p class="account__roadmap-text">{{ item.text }}</p>
                  </div>
                </div>
              </div>
            </el-card>
          </template>
        </el-main>
      </el-container>
    </el-container>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Files, Histogram, Monitor, Setting, User } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import {
  getCurrentSession,
  normalizeAuthUser,
  signOutCurrentUser,
  subscribeToAuthStateChange,
} from '@/utils/supabaseAuth'
import { fetchCrmUsers } from '@/utils/supabaseDatabase'

const navigationItems = [
  { id: 'dashboard', label: 'Дашборд', meta: 'Обзор системы', icon: Monitor },
  { id: 'users', label: 'Пользователи', meta: 'Клиенты и база', icon: User },
  { id: 'leads', label: 'Заявки', meta: 'Лиды и обращения', icon: Files },
  { id: 'content', label: 'Контент', meta: 'Страницы сайта', icon: Files },
  { id: 'analytics', label: 'Аналитика', meta: 'Отчеты и метрики', icon: Histogram },
  { id: 'settings', label: 'Настройки', meta: 'Права и конфигурация', icon: Setting },
]

const keyActions = [
  {
    timestamp: 'Сейчас',
    title: 'Контроль новых регистраций',
    text: 'Отслеживание новых аккаунтов и сохранение контактных данных клиентов.',
  },
  {
    timestamp: 'Следующий этап',
    title: 'Подключение лидов',
    text: 'Подготовка таблиц для заявок, обратных звонков и входящих обращений.',
  },
  {
    timestamp: 'Roadmap',
    title: 'Контент и аналитика',
    text: 'Управление страницами сайта, публикациями и ключевыми показателями.',
  },
]

const sectionContent = {
  dashboard: {
    title: 'Панель управления',
  },
  users: {
    title: 'Пользователи',
    description: 'Список пользователей, зарегистрированных через форму на сайте.',
  },
  leads: {
    title: 'Заявки',
    description: 'Раздел для работы с новыми обращениями и клиентскими заявками.',
  },
  content: {
    title: 'Контент сайта',
    description: 'Управление страницами, блоками сайта и редакционным контентом.',
  },
  analytics: {
    title: 'Аналитика',
    description: 'Отчеты по воронке, регистрациям и активности пользователей.',
  },
  settings: {
    title: 'Настройки системы',
    description: 'Базовая конфигурация CRM, роли и служебные параметры системы.',
  },
}

const sectionRoadmaps = {
  leads: [
    {
      step: '01',
      title: 'Единый inbox',
      text: 'Собрать заявки из всех форм сайта в одну таблицу со статусами и ответственными.',
    },
    {
      step: '02',
      title: 'Сценарии обработки',
      text: 'Добавить этапы “Новая”, “В работе”, “Связались”, “Закрыта” для менеджеров.',
    },
    {
      step: '03',
      title: 'Приоритет клиентов',
      text: 'Показывать срочные обращения и горячие лиды отдельно в CRM-виджетах.',
    },
  ],
  content: [
    {
      step: '01',
      title: 'Редактор блоков',
      text: 'Подготовить управление hero-блоками, карточками и CTA внутренних страниц.',
    },
    {
      step: '02',
      title: 'Медиа-материалы',
      text: 'Организовать загрузку изображений для тренеров, сборов и соревнований.',
    },
    {
      step: '03',
      title: 'Публикация изменений',
      text: 'Добавить сценарии черновиков и контроля финального контента перед релизом.',
    },
  ],
  analytics: [
    {
      step: '01',
      title: 'Воронка регистраций',
      text: 'Показывать динамику входящих регистраций и подтвержденных пользователей.',
    },
    {
      step: '02',
      title: 'Маршруты трафика',
      text: 'Собирать данные по основным страницам и точкам входа клиентов на сайт.',
    },
    {
      step: '03',
      title: 'Операционные отчеты',
      text: 'Подготовить карточки по заявкам, конверсии и источникам обращений.',
    },
  ],
  settings: [
    {
      step: '01',
      title: 'Роли доступа',
      text: 'Разделить права администратора, менеджера и редактора контента.',
    },
    {
      step: '02',
      title: 'Интеграции',
      text: 'Подключить сервисы уведомлений, CRM-почту и внутренние webhook-события.',
    },
    {
      step: '03',
      title: 'Служебные параметры',
      text: 'Добавить централизованное управление контактами, ссылками и системными флагами.',
    },
  ],
}

const activeSection = ref('dashboard')
const registeredUser = ref(null)
const registeredUsers = ref([])
const isUsersLoading = ref(false)
const usersLoadError = ref('')
const router = useRouter()

let authSubscription = null

async function syncRegisteredUsers() {
  isUsersLoading.value = true

  try {
    const session = await getCurrentSession()

    if (!session?.user) {
      router.replace('/')
      return
    }

    registeredUser.value = normalizeAuthUser(session.user)
    registeredUsers.value = await fetchCrmUsers()
    usersLoadError.value = ''
  } catch (error) {
    usersLoadError.value =
      error instanceof Error ? error.message : 'Не удалось загрузить пользователей из Supabase.'
  } finally {
    isUsersLoading.value = false
  }
}

async function handleSignOut() {
  try {
    await signOutCurrentUser()
    usersLoadError.value = ''
    await router.push('/')
  } catch (error) {
    usersLoadError.value =
      error instanceof Error ? error.message : 'Не удалось завершить сессию.'
  }
}

function handleSectionSelect(sectionId) {
  activeSection.value = sectionId
}

function formatRegistrationDate(date) {
  if (!date) {
    return 'Неизвестно'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

const latestUser = computed(() => registeredUsers.value[0] || registeredUser.value || null)
const latestUserName = computed(() => latestUser.value?.name || 'Нет данных')
const latestUserEmail = computed(() => latestUser.value?.email || 'Нет данных')
const latestUserRegistrationDate = computed(() =>
  latestUser.value ? formatRegistrationDate(latestUser.value.registeredAt) : 'Нет данных',
)
const currentSectionTitle = computed(() => sectionContent[activeSection.value].title)
const currentSectionDescription = computed(() => sectionContent[activeSection.value].description)
const currentSectionRoadmap = computed(() => sectionRoadmaps[activeSection.value] || [])

const dashboardMetrics = computed(() => [
  {
    label: 'Активная сессия',
    value: registeredUsers.value.length,
    tag: registeredUsers.value.length ? 'Есть доступ' : 'Проверка',
    tagType: 'primary',
    note: 'Профиль доступен только для пользователя с активной Supabase-сессией.',
  },
  {
    label: 'Имя профиля',
    value: latestUserName.value,
    tag: latestUser.value ? 'Активно' : 'Пусто',
    tagType: latestUser.value ? 'success' : 'info',
    note: 'Имя пользователя, связанного с текущей сессией.',
  },
  {
    label: 'Email профиля',
    value: latestUserEmail.value,
    tag: 'Контакт',
    tagType: 'warning',
    note: 'Почта текущего авторизованного пользователя.',
  },
  {
    label: 'Создание аккаунта',
    value: latestUserRegistrationDate.value,
    tag: 'Время',
    tagType: 'danger',
    note: 'Дата и время создания текущей учетной записи.',
  },
])

function handleWindowFocus() {
  void syncRegisteredUsers()
}

function handleVisibilityChange() {
  if (document.visibilityState !== 'visible') {
    return
  }

  void syncRegisteredUsers()
}

onMounted(() => {
  void syncRegisteredUsers()
  authSubscription = subscribeToAuthStateChange((_event, session) => {
    if (!session) {
      registeredUser.value = null
      registeredUsers.value = []
      router.replace('/')
      return
    }

    void syncRegisteredUsers()
  })
  window.addEventListener('focus', handleWindowFocus)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  authSubscription?.unsubscribe()
  window.removeEventListener('focus', handleWindowFocus)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.account {
  min-height: var(--app-screen-height);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.account__shell {
  min-height: calc(var(--app-screen-height) - 48px);
  border: 1px solid #dbe4f0;
  border-radius: 10px;
  background: rgb(255 255 255 / 0.88);
  box-shadow: 0 24px 60px rgb(15 23 42 / 0.12);
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.account__sidebar {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 24px;
  padding: 24px 18px;
  background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
  border-right: 1px solid rgb(148 163 184 / 0.14);
}

.account__brand {
  display: grid;
  gap: 12px;
}

.account__brand-badge,
.account__eyebrow,
.account__panel-eyebrow,
.account__metric-label,
.account__header-label,
.account__roadmap-step {
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.account__brand-badge {
  color: #93c5fd;
}

.account__brand-title,
.account__title,
.account__panel-title {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #0f172a;
}

.account__brand-title {
  font-size: 24px;
  line-height: 1.1;
  color: #fff;
}

.account__brand-text,
.account__subtitle,
.account__metric-note,
.account__timeline-text,
.account__roadmap-text {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.55;
}

.account__brand-text {
  color: #cbd5e1;
}

.account__menu-scroll {
  min-height: 0;
}

.account__menu-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.account__menu-label {
  font-size: 13px;
  font-weight: 700;
  color: #e5edf8;
}

.account__menu-meta {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}

.account__back-link {
  display: inline-flex;
}

.account__back-button {
  min-width: 120px;
  min-height: 44px;
  font-weight: 800;
}

.account__content-shell {
  min-width: 0;
  background: transparent;
}

.account__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  height: auto;
  min-height: 112px;
  padding: 24px;
  border-bottom: 1px solid #e5eaf3;
  background: rgb(255 255 255 / 0.72);
}

.account__header-copy {
  display: grid;
  gap: 8px;
  flex: 1 1 auto;
}

.account__eyebrow,
.account__panel-eyebrow,
.account__metric-label,
.account__header-label,
.account__roadmap-step {
  color: #64748b;
}

.account__title {
  font-size: clamp(22px, 2.2vw, 30px);
  line-height: 1.1;
}

.account__subtitle {
  color: #475569;
}

.account__header-statuses {
  display: grid;
  grid-template-columns: repeat(2, minmax(150px, 1fr));
  gap: 12px;
  align-items: start;
  margin-top: 10px;
  max-width: 360px;
}

.account__header-card {
  border-radius: 10px;
}

.account__header-value {
  display: block;
  margin-top: 6px;
  font-size: 17px;
  line-height: 1.15;
  color: #0f172a;
}

.account__main {
  display: grid;
  gap: 16px;
  padding: 24px;
}

.account__sync-alert {
  margin-bottom: 4px;
}

.account__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
  row-gap: 18px;
  margin-bottom: 16px;
}

.account__metric-col {
  min-width: 0;
}

.account__dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 16px;
}

.account__dashboard-main,
.account__dashboard-side {
  min-width: 0;
}

.account__metric-card,
.account__panel {
  border: 1px solid #e5eaf3;
  border-radius: 10px;
}

.account__metric-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account__metric-copy {
  display: grid;
  gap: 10px;
}

.account__metric-value {
  font-size: 18px;
  line-height: 1.25;
  color: #0f172a;
}

.account__metric-note {
  margin-top: 14px;
  color: #64748b;
}

.account__panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account__panel-title {
  margin-top: 6px;
  font-size: 18px;
  line-height: 1.15;
}

.account__descriptions {
  overflow: hidden;
  border-radius: 10px;
}

.account__timeline-card {
  display: grid;
  gap: 6px;
  padding: 4px 0 10px;
}

.account__timeline-title,
.account__roadmap-title {
  font-size: 14px;
  line-height: 1.4;
  color: #0f172a;
}

.account__timeline-text,
.account__roadmap-text {
  color: #64748b;
}

.account__alert {
  margin-bottom: 16px;
}

.account__roadmap-card {
  display: grid;
  gap: 10px;
  height: 100%;
  padding: 18px;
  border: 1px solid #e5eaf3;
  border-radius: 10px;
  background: linear-gradient(180deg, #fff 0%, #f8fbff 100%);
}

.account__roadmap-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

:deep(.account__menu.el-menu) {
  border-right: 0;
  background: transparent;
}

:deep(.account__menu .el-menu-item) {
  display: flex;
  align-items: center;
  gap: 12px;
  height: auto;
  min-height: 56px;
  margin-bottom: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  line-height: 1.3;
  color: #e2e8f0;
}

:deep(.account__menu .el-menu-item .el-icon) {
  margin-right: 0;
  font-size: 18px;
  color: #93c5fd;
}

:deep(.account__menu .el-menu-item:hover) {
  background: rgb(30 41 59 / 0.9);
}

:deep(.account__menu .el-menu-item.is-active) {
  background: linear-gradient(180deg, #1d4ed8 0%, #2563eb 100%);
}

:deep(.account__menu .el-menu-item.is-active .account__menu-label),
:deep(.account__menu .el-menu-item.is-active .account__menu-meta),
:deep(.account__menu .el-menu-item.is-active .el-icon) {
  color: #fff;
}

:deep(.account__header-card .el-card__body) {
  padding: 14px 16px;
  border-radius: 10px;
}

:deep(.account__metric-card .el-card__body),
:deep(.account__panel .el-card__body) {
  padding: 18px 20px;
  border-radius: 10px;
}

:deep(.account__panel .el-card__header) {
  padding: 18px 18px 0;
  border-bottom: 0;
  border-radius: 10px 10px 0 0;
}

:deep(.account__descriptions .el-descriptions__label) {
  width: 180px;
  font-weight: 700;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table th.el-table__cell) {
  font-size: 11px;
  font-weight: 700;
}

:deep(.el-tag) {
  font-size: 11px;
}

:deep(.el-descriptions__label),
:deep(.el-descriptions__content),
:deep(.el-alert__description),
:deep(.el-timeline-item__timestamp) {
  font-size: 13px;
}

:deep(.el-table th.el-table__cell) {
  background: #f8fbff;
}

:deep(.el-card),
:deep(.el-alert),
:deep(.el-descriptions__body),
:deep(.el-table),
:deep(.el-button) {
  border-radius: 10px;
}

@media (max-width: 1199px) {
  .account {
    padding: 18px;
  }

  .account__shell {
    min-height: calc(var(--app-screen-height) - 36px);
  }

  .account__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .account__header-statuses {
    width: 100%;
    max-width: none;
  }

  .account__dashboard-grid {
    grid-template-columns: 1fr;
  }

  .account__roadmap-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1023px) {
  .account__shell {
    display: block;
  }

  .account__sidebar {
    width: 100%;
    border-right: 0;
    border-bottom: 1px solid rgb(148 163 184 / 0.14);
  }
}

@media (max-width: 767px) {
  .account {
    padding: 12px;
  }

  .account__shell {
    min-height: calc(var(--app-screen-height) - 24px);
    border-radius: 10px;
  }

  .account__header,
  .account__main {
    padding: 18px;
  }

  .account__header-statuses {
    grid-template-columns: 1fr;
  }

  .account__metrics {
    grid-template-columns: 1fr;
  }

  .account__roadmap-grid {
    grid-template-columns: 1fr;
  }

  .account__panel-head,
  .account__metric-top {
    flex-direction: column;
  }
}
</style>

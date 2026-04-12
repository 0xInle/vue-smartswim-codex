<template>
  <section class="account">
    <ElContainer class="account__shell">
      <ElAside class="account__sidebar" width="240px">
        <div class="account__sidebar-copy">
          <p class="account__sidebar-eyebrow">Личный кабинет</p>
          <h1 class="account__sidebar-title">Smart Swim</h1>
        </div>

        <ElMenu
          :default-active="activeSection"
          class="account__menu"
          @select="handleSectionSelect"
        >
          <ElMenuItem v-for="item in navigationItems" :key="item.id" :index="item.id">
            <ElIcon><component :is="item.icon" /></ElIcon>
            <span class="account__menu-label">{{ item.label }}</span>
          </ElMenuItem>
        </ElMenu>
      </ElAside>

      <ElContainer class="account__content-shell">
        <ElHeader class="account__header">
          <div class="account__header-copy">
            <h2 class="account__title">{{ currentSectionTitle }}</h2>
          </div>

          <ElButton class="account__back-button" type="primary" @click="handleSignOut">
            Выйти
          </ElButton>
        </ElHeader>

        <ElMain class="account__main">
          <ElAlert
            v-if="profileLoadError"
            :title="profileLoadError"
            type="warning"
            show-icon
            :closable="false"
            class="account__sync-alert"
          />

          <ElAlert
            v-if="adminDataError"
            :title="adminDataError"
            type="warning"
            show-icon
            :closable="false"
            class="account__sync-alert"
          />

          <div v-if="isProfileLoading && !currentUser" class="account__loading-state">
            Загружаем кабинет...
          </div>

          <template v-else-if="activeSection === 'dashboard'">
            <ElCard class="account__panel" shadow="never">
              <div class="account__dashboard-empty"></div>
            </ElCard>
          </template>

          <template v-else-if="isAdmin && activeSection === 'consultations'">
            <ElCard class="account__panel" shadow="never">
              <template #header>
                <div class="account__panel-head">
                  <div>
                    <p class="account__panel-eyebrow">Консультация</p>
                    <h3 class="account__panel-title">Заявки с главной страницы</h3>
                  </div>

                  <div class="account__panel-actions">
                    <ElTag type="primary" effect="light" round>
                      {{ consultationRequests.length }} заявок
                    </ElTag>
                    <ElButton text type="primary" @click="handleConsultationRefresh">
                      Обновить
                    </ElButton>
                  </div>
                </div>
              </template>

              <div
                v-if="isAdminDataLoading && !consultationRequests.length"
                class="account__loading-state"
              >
                Загружаем заявки...
              </div>

              <ElTable
                v-else-if="consultationRequests.length"
                :data="consultationRequests"
                row-key="id"
                border
                stripe
                empty-text="Новых заявок пока нет."
              >
                <ElTableColumn label="Клиент" min-width="220">
                  <template #default="{ row }">
                    <div class="account__table-primary">
                      {{ formatConsultationFullName(row) }}
                    </div>
                  </template>
                </ElTableColumn>

                <ElTableColumn prop="phone" label="Телефон" min-width="180" />

                <ElTableColumn label="Дата и время" min-width="220">
                  <template #default="{ row }">
                    {{ formatConsultationSlot(row) }}
                  </template>
                </ElTableColumn>

                <ElTableColumn label="Получена" min-width="220">
                  <template #default="{ row }">
                    {{ formatDateTime(row.createdAt) }}
                  </template>
                </ElTableColumn>

                <ElTableColumn label="Статус" width="140" align="center">
                  <template #default="{ row }">
                    <ElTag :type="consultationStatusType(row.status)" effect="light" round>
                      {{ formatConsultationStatus(row.status) }}
                    </ElTag>
                  </template>
                </ElTableColumn>
              </ElTable>

              <ElEmpty v-else description="Новых заявок пока нет." />
            </ElCard>
          </template>
        </ElMain>
      </ElContainer>
    </ElContainer>
  </section>
</template>

<script setup>
import { Calendar, Monitor } from '@element-plus/icons-vue'
import {
  ElAlert,
  ElAside,
  ElButton,
  ElCard,
  ElContainer,
  ElEmpty,
  ElHeader,
  ElIcon,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CRM_ROLE, isAdminRole } from '@/utils/crmRoles'
import { signOutCurrentUser, subscribeToAuthStateChange } from '@/utils/supabaseAuth'
import {
  fetchConsultationRequests,
  fetchCurrentCrmUser,
  subscribeToConsultationRequests,
} from '@/utils/supabaseDatabase'
import 'element-plus/es/components/alert/style/css'
import 'element-plus/es/components/aside/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/card/style/css'
import 'element-plus/es/components/container/style/css'
import 'element-plus/es/components/empty/style/css'
import 'element-plus/es/components/header/style/css'
import 'element-plus/es/components/icon/style/css'
import 'element-plus/es/components/main/style/css'
import 'element-plus/es/components/menu/style/css'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/tag/style/css'

const router = useRouter()
const activeSection = ref('dashboard')
const currentUser = ref(null)
const consultationRequests = ref([])
const isProfileLoading = ref(false)
const isAdminDataLoading = ref(false)
const profileLoadError = ref('')
const adminDataError = ref('')

let authSubscription = null
let unsubscribeConsultationFeed = null
let currentUserSyncPromise = null
let adminDataSyncPromise = null
let accountSyncPromise = null
let lastAccountSyncAt = 0

const ACCOUNT_SYNC_COOLDOWN_MS = 1200

function getErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback
}

function consultationStatusType(status) {
  if (status === 'contacted') {
    return 'primary'
  }

  if (status === 'scheduled') {
    return 'success'
  }

  if (status === 'closed') {
    return 'info'
  }

  return 'warning'
}

function formatConsultationStatus(status) {
  if (status === 'contacted') {
    return 'Связались'
  }

  if (status === 'scheduled') {
    return 'Запланирована'
  }

  if (status === 'closed') {
    return 'Закрыта'
  }

  return 'Новая'
}

function formatDateTime(value) {
  if (!value) {
    return 'Неизвестно'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatConsultationDate(value) {
  if (!value) {
    return 'Не указана'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
  }).format(new Date(`${value}T00:00:00`))
}

function formatConsultationSlot(request) {
  if (!request?.consultationDate || !request?.consultationTime) {
    return 'Не указано'
  }

  return `${formatConsultationDate(request.consultationDate)}, ${request.consultationTime}`
}

function formatConsultationFullName(request) {
  return [request?.firstName, request?.lastName].filter(Boolean).join(' ') || 'Не указано'
}

async function syncCurrentUser() {
  if (currentUserSyncPromise) {
    return currentUserSyncPromise
  }

  isProfileLoading.value = true

  currentUserSyncPromise = (async () => {
    try {
      currentUser.value = await fetchCurrentCrmUser()
      profileLoadError.value = ''
    } catch (error) {
      currentUser.value = null
      profileLoadError.value = getErrorMessage(error, 'Не удалось загрузить профиль кабинета.')
    } finally {
      isProfileLoading.value = false
      currentUserSyncPromise = null
    }
  })()

  return currentUserSyncPromise
}

async function syncAdminData({ silent = false } = {}) {
  if (!isAdmin.value) {
    consultationRequests.value = []
    adminDataError.value = ''
    return
  }

  if (adminDataSyncPromise) {
    return adminDataSyncPromise
  }

  const shouldShowLoader = !silent

  if (shouldShowLoader) {
    isAdminDataLoading.value = true
  }

  adminDataSyncPromise = (async () => {
    try {
      consultationRequests.value = await fetchConsultationRequests()
      adminDataError.value = ''
    } catch (error) {
      adminDataError.value = getErrorMessage(error, 'Не удалось загрузить CRM-данные.')
    } finally {
      if (shouldShowLoader) {
        isAdminDataLoading.value = false
      }

      adminDataSyncPromise = null
    }
  })()

  return adminDataSyncPromise
}

async function syncAccountData({ force = false } = {}) {
  const now = Date.now()

  if (!force && now - lastAccountSyncAt < ACCOUNT_SYNC_COOLDOWN_MS) {
    return accountSyncPromise
  }

  if (accountSyncPromise) {
    return accountSyncPromise
  }

  lastAccountSyncAt = now
  accountSyncPromise = (async () => {
    try {
      await syncCurrentUser()
      await syncAdminData()
    } finally {
      accountSyncPromise = null
    }
  })()

  return accountSyncPromise
}

function stopConsultationFeed() {
  unsubscribeConsultationFeed?.()
  unsubscribeConsultationFeed = null
}

function ensureConsultationFeed() {
  if (!isAdmin.value || unsubscribeConsultationFeed) {
    return
  }

  unsubscribeConsultationFeed = subscribeToConsultationRequests(() => {
    void syncAdminData({ silent: true })
  })
}

async function handleSignOut() {
  try {
    await signOutCurrentUser()
    profileLoadError.value = ''
    adminDataError.value = ''
    await router.push('/')
  } catch (error) {
    adminDataError.value = getErrorMessage(error, 'Не удалось завершить сессию.')
  }
}

function handleSectionSelect(sectionId) {
  activeSection.value = sectionId
}

function handleConsultationRefresh() {
  void syncAdminData({ silent: false })
}

function handleWindowFocus() {
  void syncAccountData()
}

function handleVisibilityChange() {
  if (document.visibilityState !== 'visible') {
    return
  }

  void syncAccountData()
}

const currentRole = computed(() => currentUser.value?.role || CRM_ROLE.USER)
const isAdmin = computed(() => isAdminRole(currentRole.value))

const navigationItems = computed(() => {
  if (isAdmin.value) {
    return [
      { id: 'dashboard', label: 'Дашборд', icon: Monitor },
      { id: 'consultations', label: 'Консультации', icon: Calendar },
    ]
  }

  return [{ id: 'dashboard', label: 'Кабинет', icon: Monitor }]
})

const sectionContent = computed(() => {
  if (isAdmin.value) {
    return {
      dashboard: {
        title: 'Дашборд',
      },
      consultations: {
        title: 'Консультации',
      },
    }
  }

  if (currentRole.value === CRM_ROLE.TRAINER) {
    return {
      dashboard: {
        title: 'Кабинет тренера',
      },
    }
  }

  return {
    dashboard: {
      title: 'Личный кабинет',
    },
  }
})

const currentSectionTitle = computed(
  () => sectionContent.value[activeSection.value]?.title || 'Кабинет',
)

watch(
  navigationItems,
  (items) => {
    if (!items.some((item) => item.id === activeSection.value)) {
      activeSection.value = items[0]?.id || 'dashboard'
    }
  },
  { immediate: true },
)

watch(
  isAdmin,
  (value) => {
    if (value) {
      ensureConsultationFeed()
      return
    }

    stopConsultationFeed()
    consultationRequests.value = []
    adminDataError.value = ''
  },
  { immediate: true },
)

onMounted(() => {
  void syncAccountData({ force: true })

  authSubscription = subscribeToAuthStateChange((_event, session) => {
    if (!session) {
      currentUser.value = null
      consultationRequests.value = []
      stopConsultationFeed()
      router.replace('/')
      return
    }

    void syncAccountData({ force: true })
  })

  window.addEventListener('focus', handleWindowFocus)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  authSubscription?.unsubscribe()
  stopConsultationFeed()
  window.removeEventListener('focus', handleWindowFocus)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.account {
  min-height: var(--app-screen-height);
  padding: 24px;
  font-family: Nunito, sans-serif;
}

.account__shell {
  min-height: calc(var(--app-screen-height) - 48px);
  border: 1px solid color-mix(in srgb, var(--cyan) 12%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.9);
  box-shadow: 0 24px 60px rgb(15 23 42 / 0.12);
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.account__sidebar {
  display: grid;
  align-content: start;
  gap: 20px;
  padding: 24px 16px;
  background: linear-gradient(180deg, #0d3f62 0%, #083450 100%);
  border-right: 1px solid rgb(255 255 255 / 0.12);
}

.account__sidebar-copy,
.account__header-copy {
  display: grid;
  gap: 8px;
}

.account__sidebar-eyebrow,
.account__panel-eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
}

.account__sidebar-eyebrow {
  color: color-mix(in srgb, var(--aqua) 72%, white);
}

.account__sidebar-title,
.account__title,
.account__panel-title {
  margin: 0;
  font-family: Oswald, sans-serif;
  line-height: 1.05;
  text-transform: uppercase;
}

.account__sidebar-title {
  font-size: 30px;
  color: var(--white);
}

.account__content-shell {
  min-width: 0;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.82) 0%, rgb(245 251 255 / 0.92) 100%);
}

.account__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  height: auto;
  padding: 24px;
  border-bottom: 1px solid #e5eaf3;
  background: rgb(255 255 255 / 0.74);
}

.account__title {
  font-size: clamp(26px, 2.5vw, 34px);
  color: var(--black);
}

.account__back-button {
  min-width: 138px;
  min-height: 47px;
  padding-inline: 20px;
  font-weight: 800;
}

.account__main {
  display: grid;
  gap: 16px;
  padding: 24px;
}

.account__sync-alert {
  margin-bottom: 0;
}

.account__panel {
  border: 1px solid #e5eaf3;
  border-radius: 10px;
  background: rgb(255 255 255 / 0.84);
}

.account__panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account__panel-title {
  margin-top: 6px;
  font-size: 22px;
  color: var(--black);
}

.account__panel-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.account__loading-state {
  padding: 32px 16px;
  text-align: center;
  font-size: 14px;
  font-weight: 800;
  color: #64748b;
}

.account__dashboard-empty {
  min-height: 420px;
  border: 1px dashed color-mix(in srgb, var(--cyan) 20%, white);
  border-radius: 10px;
  background: linear-gradient(180deg, rgb(248 251 255 / 0.9) 0%, rgb(255 255 255 / 0.72) 100%);
}

.account__table-primary {
  font-weight: 800;
  color: var(--black);
}

.account__menu-label {
  font-size: 14px;
  font-weight: 800;
  color: #eaf6ff;
}

:deep(.account__menu.el-menu) {
  border-right: 0;
  background: transparent;
}

:deep(.account__menu .el-menu-item) {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  margin-bottom: 10px;
  padding: 14px 16px;
  border-radius: 10px;
  color: #eaf6ff;
}

:deep(.account__menu .el-menu-item .el-icon) {
  margin-right: 0;
  font-size: 18px;
  color: color-mix(in srgb, var(--aqua) 70%, white);
}

:deep(.account__menu .el-menu-item:hover) {
  background: rgb(255 255 255 / 0.12);
}

:deep(.account__menu .el-menu-item.is-active) {
  background: linear-gradient(180deg, #1aa6d8 0%, #0f7fb4 100%);
}

:deep(.account__menu .el-menu-item.is-active .account__menu-label),
:deep(.account__menu .el-menu-item.is-active .el-icon) {
  color: #fff;
}

:deep(.account__panel .el-card__header) {
  padding: 18px 18px 0;
  border-bottom: 0;
}

:deep(.account__panel .el-card__body) {
  padding: 18px;
}

:deep(.el-table) {
  border-radius: 10px;
}

:deep(.el-table th.el-table__cell) {
  font-size: 11px;
  font-weight: 800;
  background: #f8fbff;
}

:deep(.el-tag) {
  font-weight: 800;
}

:deep(.el-descriptions__label),
:deep(.el-descriptions__content),
:deep(.el-alert__description) {
  font-size: 13px;
}

:deep(.el-card),
:deep(.el-alert),
:deep(.el-descriptions__body),
:deep(.el-table) {
  border-color: #e5eaf3;
}

@media (max-width: 1279px) {
  .account__header {
    flex-direction: column;
  }
}

@media (max-width: 1023px) {
  .account {
    padding: 12px;
  }

  .account__shell {
    min-height: calc(var(--app-screen-height) - 24px);
  }

  .account__sidebar {
    width: 100%;
    border-right: 0;
    border-bottom: 1px solid rgb(255 255 255 / 0.12);
  }
}

@media (max-width: 767px) {
  .account__header,
  .account__main {
    padding: 16px;
  }

  .account__panel-head {
    flex-direction: column;
  }

  .account__panel-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>

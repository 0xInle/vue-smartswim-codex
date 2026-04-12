<template>
  <section class="account">
    <ElContainer class="account__shell">
      <AccountSidebar
        :active-section="activeSection"
        :navigation-items="navigationItems"
        @select="handleSectionSelect"
      />

      <ElContainer class="account__content-shell">
        <AccountHeaderBar :title="currentSectionTitle" @sign-out="handleSignOutClick" />

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

          <AccountDashboardPanel
            v-else-if="activeSection === 'dashboard'"
            :current-user="currentUser"
            :current-role-label="currentRoleLabel"
          />

          <AccountSettingsPanel
            v-else-if="activeSection === 'settings'"
            :form="passwordChangeForm"
            :errors="passwordChangeErrors"
            :visibility="passwordVisibility"
            :status="passwordChangeStatus"
            :message="passwordChangeMessage"
            :min-password-length="minPasswordLength"
            :password-field-type="passwordFieldType"
            @submit="handlePasswordChange"
            @toggle-visibility="togglePasswordVisibility"
          />

          <AccountConsultationsPanel
            v-else-if="isAdmin && activeSection === 'consultations'"
            :requests="consultationRequests"
            :rows="consultationTableRows"
            :is-loading="isAdminDataLoading"
            :search="consultationSearch"
            :status-filter="consultationStatusFilter"
            :status-options="consultationStatusOptions"
            :new-count="newConsultationRequestsCount"
            :total="filteredConsultationRequestsTotal"
            :loading-id="consultationStatusLoadingId"
            :get-draft-status="getConsultationDraftStatus"
            :span-method="consultationTableSpanMethod"
            @refresh="handleConsultationRefresh"
            @update:search="consultationSearch = $event"
            @update:status-filter="consultationStatusFilter = $event"
            @mark-processed="handleConsultationMarkProcessed"
            @draft-change="handleConsultationDraftChange"
            @apply-draft="handleConsultationApplyDraft"
            @reset-status="handleConsultationResetStatus"
          />

          <AccountUsersPanel
            v-else-if="isAdmin && activeSection === 'users'"
            :users="paginatedUsers"
            :search="usersSearch"
            :role-filter="usersRoleFilter"
            :total="filteredUsersTotal"
            :page="usersPage"
            :page-count="usersPageCount"
            :is-edit-dialog-open="isUserEditDialogOpen"
            :is-delete-dialog-open="isUserDeleteDialogOpen"
            :edit-form="userEditForm"
            :pending-delete-user="userPendingDelete"
            @update:search="usersSearch = $event"
            @update:role-filter="usersRoleFilter = $event"
            @page-change="handleUsersPageChange"
            @edit-user="handleOpenUserEdit"
            @delete-user="handleOpenUserDelete"
            @close-edit="handleCloseUserEdit"
            @submit-edit="handleUserEditSubmit"
            @close-delete="handleCloseUserDelete"
            @confirm-delete="handleConfirmUserDelete"
          />
        </ElMain>
      </ElContainer>
    </ElContainer>
  </section>
</template>

<script setup>
import { Calendar, Monitor, Setting, User } from '@element-plus/icons-vue'
import { ElAlert, ElContainer, ElMain } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AccountConsultationsPanel from '@/pages/account/components/AccountConsultationsPanel.vue'
import AccountDashboardPanel from '@/pages/account/components/AccountDashboardPanel.vue'
import AccountHeaderBar from '@/pages/account/components/AccountHeaderBar.vue'
import AccountSettingsPanel from '@/pages/account/components/AccountSettingsPanel.vue'
import AccountSidebar from '@/pages/account/components/AccountSidebar.vue'
import AccountUsersPanel from '@/pages/account/components/AccountUsersPanel.vue'
import { useAccountPasswordChange } from '@/pages/account/composables/useAccountPasswordChange'
import { useAccountSession } from '@/pages/account/composables/useAccountSession'
import { useAccountUsers } from '@/pages/account/composables/useAccountUsers'
import { useConsultationRequests } from '@/pages/account/composables/useConsultationRequests'
import { ACCOUNT_SYNC_COOLDOWN_MS } from '@/pages/account/utils/accountConstants'
import { CRM_ROLE } from '@/utils/crmRoles'
import { subscribeToAuthStateChange } from '@/utils/supabaseAuth'
import 'element-plus/es/components/alert/style/css'
import 'element-plus/es/components/aside/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/card/style/css'
import 'element-plus/es/components/container/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/empty/style/css'
import 'element-plus/es/components/header/style/css'
import 'element-plus/es/components/icon/style/css'
import 'element-plus/es/components/main/style/css'
import 'element-plus/es/components/menu/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/pagination/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/tag/style/css'
import '@/pages/account/account.css'

const router = useRouter()
const activeSection = ref('dashboard')
let authSubscription = null
let accountSyncPromise = null
let lastAccountSyncAt = 0

const {
  currentUser,
  currentRole,
  currentRoleLabel,
  isAdmin,
  isProfileLoading,
  profileLoadError,
  syncCurrentUser,
  clearCurrentUser,
  handleSignOut,
} = useAccountSession({ router })

const {
  passwordChangeStatus,
  passwordChangeMessage,
  passwordChangeForm,
  passwordChangeErrors,
  passwordVisibility,
  passwordFieldType,
  togglePasswordVisibility,
  handlePasswordChange,
  minPasswordLength,
} = useAccountPasswordChange({ currentUser })

const {
  consultationRequests,
  consultationStatusLoadingId,
  isAdminDataLoading,
  adminDataError,
  consultationSearch,
  consultationStatusFilter,
  consultationStatusOptions,
  newConsultationRequestsCount,
  filteredConsultationRequestsTotal,
  consultationTableRows,
  handleConsultationRefresh,
  handleConsultationDraftChange,
  getConsultationDraftStatus,
  handleConsultationMarkProcessed,
  handleConsultationApplyDraft,
  handleConsultationResetStatus,
  consultationTableSpanMethod,
  syncAdminData,
  stopConsultationFeed,
  clearConsultationState,
} = useConsultationRequests({ isAdmin })

const {
  usersPage,
  usersSearch,
  usersRoleFilter,
  filteredUsersTotal,
  usersPageCount,
  paginatedUsers,
  isUserEditDialogOpen,
  isUserDeleteDialogOpen,
  userPendingDelete,
  userEditForm,
  handleUsersPageChange,
  resetUsersPage,
  handleOpenUserEdit,
  handleCloseUserEdit,
  handleUserEditSubmit,
  handleOpenUserDelete,
  handleCloseUserDelete,
  handleConfirmUserDelete,
} = useAccountUsers()

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

function handleSectionSelect(sectionId) {
  activeSection.value = sectionId
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

function handleSignOutClick() {
  void handleSignOut({
    onSuccess: () => {
      clearConsultationState()
    },
    onError: (message) => {
      adminDataError.value = message
    },
  })
}

const navigationItems = computed(() => {
  if (isAdmin.value) {
    return [
      { id: 'dashboard', label: 'Дашборд', icon: Monitor },
      { id: 'consultations', label: 'Консультации', icon: Calendar },
      { id: 'users', label: 'Пользователи', icon: User },
      { id: 'settings', label: 'Настройки', icon: Setting },
    ]
  }

  return [
    { id: 'dashboard', label: 'Кабинет', icon: Monitor },
    { id: 'settings', label: 'Настройки', icon: Setting },
  ]
})

const sectionContent = computed(() => {
  if (isAdmin.value) {
    return {
      dashboard: { title: 'Дашборд' },
      consultations: { title: 'Консультации' },
      users: { title: 'Пользователи' },
      settings: { title: 'Настройки' },
    }
  }

  if (currentRole.value === CRM_ROLE.TRAINER) {
    return {
      dashboard: { title: 'Кабинет тренера' },
      settings: { title: 'Настройки' },
    }
  }

  return {
    dashboard: { title: 'Личный кабинет' },
    settings: { title: 'Настройки' },
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

watch(activeSection, (value) => {
  if (value === 'users') {
    resetUsersPage()
  }
})

onMounted(() => {
  void syncAccountData({ force: true })

  authSubscription = subscribeToAuthStateChange((_event, session) => {
    if (!session) {
      clearCurrentUser()
      clearConsultationState()
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

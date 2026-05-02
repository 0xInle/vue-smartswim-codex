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

          <ElAlert
            v-if="trainerBookingsError"
            :title="trainerBookingsError"
            type="warning"
            show-icon
            :closable="false"
            class="account__sync-alert"
          />

          <ElAlert
            v-if="ownTrainerBookingsError"
            :title="ownTrainerBookingsError"
            type="warning"
            show-icon
            :closable="false"
            class="account__sync-alert"
          />

          <div v-if="isProfileLoading && !currentUser" class="account__loading-state">
            Загружаем кабинет...
          </div>

          <AccountDashboardPanel
            v-else-if="isAdmin && activeSection === 'dashboard'"
            :consultation-requests="consultationRequests"
            :trainer-bookings="trainerBookings"
            :users="users"
            @select-section="handleSectionSelect"
          />

          <AccountUserDashboardPanel v-else-if="!isAdmin && activeSection === 'dashboard'" />

          <AccountProfilePanel v-else-if="!isAdmin && activeSection === 'profile'" :current-user="currentUser" />

          <AccountAthletesPanel
            v-else-if="!isAdmin && activeSection === 'athletes'"
            :current-user="currentUser"
          />

          <AccountCompetitionRegistrationsPanel
            v-else-if="!isAdmin && activeSection === 'competitions'"
            :current-user="currentUser"
            :initial-target="competitionRegistrationTarget"
            @consume-target="handleCompetitionTargetConsumed"
          />

          <AccountSettingsPanel
            v-else-if="!isAdmin && activeSection === 'settings'"
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

          <AccountTrainerBookingsPanel
            v-else-if="isAdmin && activeSection === 'trainer-bookings'"
            :bookings="filteredTrainerBookings"
            :is-loading="trainerBookingsLoading"
            :search="trainerBookingsSearch"
            :status-filter="trainerBookingsStatusFilter"
            :status-options="trainerBookingsStatusOptions"
            :new-count="newTrainerBookingsCount"
            :total="filteredTrainerBookingsTotal"
            @refresh="handleTrainerBookingsRefresh"
            @update:search="trainerBookingsSearch = $event"
            @update:status-filter="trainerBookingsStatusFilter = $event"
          />

          <AccountCompetitionsPanel
            v-else-if="isAdmin && activeSection === 'competitions'"
            :rows="filteredCompetitionStages"
            :is-loading="false"
            :competition-filter="competitionFilter"
            :competition-options="competitionOptions"
            :total="filteredCompetitionStagesTotal"
            :open-count="filteredOpenCompetitionRegistrationsCount"
            :get-stage-distances="getCompetitionStageDescription"
            @update:competition-filter="competitionFilter = $event"
            @update-stage="handleCompetitionStageUpdate"
            @update-stage-links="handleCompetitionStageLinksUpdate"
            @update-stage-distances="handleCompetitionStageDistancesUpdate"
            @create-stage="handleCompetitionStageCreate"
            @delete-stage="handleCompetitionStageDelete"
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

          <AccountSettingsPanel
            v-else-if="isAdmin && activeSection === 'settings'"
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
        </ElMain>
      </ElContainer>
    </ElContainer>
  </section>
</template>

<script setup>
import { Calendar, Monitor, Setting, Trophy, User } from '@element-plus/icons-vue'
import { ElAlert, ElContainer, ElMain } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AccountCompetitionRegistrationsPanel from '@/pages/account/components/AccountCompetitionRegistrationsPanel.vue'
import AccountCompetitionsPanel from '@/pages/account/components/AccountCompetitionsPanel.vue'
import AccountConsultationsPanel from '@/pages/account/components/AccountConsultationsPanel.vue'
import AccountDashboardPanel from '@/pages/account/components/AccountDashboardPanel.vue'
import AccountAthletesPanel from '@/pages/account/components/AccountAthletesPanel.vue'
import AccountHeaderBar from '@/pages/account/components/AccountHeaderBar.vue'
import AccountProfilePanel from '@/pages/account/components/AccountProfilePanel.vue'
import AccountUserDashboardPanel from '@/pages/account/components/AccountUserDashboardPanel.vue'
import AccountSettingsPanel from '@/pages/account/components/AccountSettingsPanel.vue'
import AccountSidebar from '@/pages/account/components/AccountSidebar.vue'
import AccountTrainerBookingsPanel from '@/pages/account/components/AccountTrainerBookingsPanel.vue'
import AccountUsersPanel from '@/pages/account/components/AccountUsersPanel.vue'
import { useOwnTrainerBookings } from '@/pages/account/composables/useOwnTrainerBookings'
import { useAccountPasswordChange } from '@/pages/account/composables/useAccountPasswordChange'
import { useAccountSession } from '@/pages/account/composables/useAccountSession'
import { useCompetitionStages } from '@/pages/account/composables/useCompetitionStages'
import { useAccountUsers } from '@/pages/account/composables/useAccountUsers'
import { useConsultationRequests } from '@/pages/account/composables/useConsultationRequests'
import { useTrainerBookings } from '@/pages/account/composables/useTrainerBookings'
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
const route = useRoute()
const activeSection = ref('dashboard')
const competitionRegistrationTarget = ref(null)
let authSubscription = null
let accountSyncPromise = null
let lastAccountSyncAt = 0

const {
  currentUser,
  currentRole,
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

const { ownTrainerBookingsError, syncOwnTrainerBookings, clearOwnTrainerBookings } =
  useOwnTrainerBookings()

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
  trainerBookingsLoading,
  trainerBookingsError,
  trainerBookings,
  trainerBookingsSearch,
  trainerBookingsStatusFilter,
  trainerBookingsStatusOptions,
  newTrainerBookingsCount,
  filteredTrainerBookings,
  filteredTrainerBookingsTotal,
  handleTrainerBookingsRefresh,
  syncTrainerBookings,
  stopTrainerBookingsFeed,
  clearTrainerBookingsState,
} = useTrainerBookings({ isAdmin })

const {
  competitionFilter,
  competitionOptions,
  filteredCompetitionStages,
  filteredCompetitionStagesTotal,
  filteredOpenCompetitionRegistrationsCount,
  updateCompetitionStage,
  updateCompetitionStageLinks,
  updateCompetitionStageDistances,
  getCompetitionStageDescription,
  deleteCompetitionStage,
  createCompetitionStage,
} = useCompetitionStages()

function handleCompetitionStageUpdate(payload) {
  updateCompetitionStage(payload.stageId, payload)
}

function handleCompetitionStageLinksUpdate(payload) {
  updateCompetitionStageLinks(payload.stageId, payload)
}

function handleCompetitionStageDistancesUpdate(payload) {
  updateCompetitionStageDistances(payload.stageId, payload.description)
}

function handleCompetitionStageCreate(payload) {
  createCompetitionStage(payload)
}

function handleCompetitionStageDelete(stageId) {
  deleteCompetitionStage(stageId)
}

function handleCompetitionTargetConsumed() {
  competitionRegistrationTarget.value = null

  const nextQuery = { ...route.query }
  delete nextQuery.section
  delete nextQuery.competitionSlug
  delete nextQuery.stageId

  void router.replace({
    path: '/account',
    query: nextQuery,
  })
}

const {
  users,
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
      await syncTrainerBookings()
      if (isAdmin.value) {
        clearOwnTrainerBookings()
      } else {
        await syncOwnTrainerBookings()
      }
    } finally {
      accountSyncPromise = null
    }
  })()

  return accountSyncPromise
}

function handleSectionSelect(sectionId) {
  activeSection.value = sectionId
}

function handleSignOutClick() {
  void handleSignOut({
    onSuccess: () => {
      clearConsultationState()
      clearTrainerBookingsState()
      clearOwnTrainerBookings()
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
      { id: 'trainer-bookings', label: 'Записи к тренерам', icon: Calendar },
      { id: 'competitions', label: 'Соревнования', icon: Trophy },
      { id: 'users', label: 'Пользователи', icon: User },
      { id: 'settings', label: 'Настройки', icon: Setting },
    ]
  }

  return [
    { id: 'dashboard', label: 'Дашборд', icon: Monitor },
    { id: 'profile', label: 'Личная информация', icon: User },
    { id: 'athletes', label: 'Спортсмены', icon: Trophy },
    { id: 'competitions', label: 'Соревнования', icon: Trophy },
    { id: 'settings', label: 'Настройки', icon: Setting },
  ]
})

const sectionContent = computed(() => {
  if (isAdmin.value) {
    return {
      dashboard: { title: 'Дашборд' },
      consultations: { title: 'Консультации' },
      'trainer-bookings': { title: 'Записи к тренерам' },
      competitions: { title: 'Соревнования' },
      users: { title: 'Пользователи' },
      settings: { title: 'Настройки' },
    }
  }

  if (currentRole.value === CRM_ROLE.TRAINER) {
    return {
      dashboard: { title: 'Дашборд' },
      profile: { title: 'Личная информация' },
      athletes: { title: 'Спортсмены' },
      competitions: { title: 'Соревнования' },
      settings: { title: 'Настройки' },
    }
  }

  return {
    dashboard: { title: 'Дашборд' },
    profile: { title: 'Личная информация' },
    athletes: { title: 'Спортсмены' },
    competitions: { title: 'Соревнования' },
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

watch(
  () => [route.query.section, route.query.competitionSlug, route.query.stageId],
  () => {
    const section = typeof route.query.section === 'string' ? route.query.section : ''
    const competitionSlug =
      typeof route.query.competitionSlug === 'string' ? route.query.competitionSlug : ''
    const stageId = typeof route.query.stageId === 'string' ? route.query.stageId : ''

    if (section === 'competitions') {
      activeSection.value = 'competitions'
      competitionRegistrationTarget.value =
        competitionSlug || stageId ? { competitionSlug, stageId } : null
      return
    }

    if (competitionRegistrationTarget.value) {
      competitionRegistrationTarget.value = null
    }
  },
  { immediate: true },
)

onMounted(() => {
  void syncAccountData({ force: true })

  authSubscription = subscribeToAuthStateChange((_event, session) => {
    if (!session) {
      clearCurrentUser()
      clearConsultationState()
      clearTrainerBookingsState()
      clearOwnTrainerBookings()
      stopConsultationFeed()
      stopTrainerBookingsFeed()
      router.replace('/')
      return
    }

    void syncAccountData({ force: true })
  })
})

onBeforeUnmount(() => {
  authSubscription?.unsubscribe()
  stopConsultationFeed()
  stopTrainerBookingsFeed()
})
</script>

<template>
  <section class="account">
    <ElContainer class="account__shell">
      <AccountSidebar
        v-if="isAccountShellReady"
        :active-section="activeSection"
        :navigation-items="navigationItems"
        @select="handleSectionSelect"
      />

      <ElContainer class="account__content-shell">
        <AccountHeaderBar
          v-if="isAccountShellReady"
          :title="currentSectionTitle"
          @sign-out="handleSignOutClick"
        />

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

          <div v-if="!isAccountShellReady" class="account__loading-state">
            Загружаем кабинет...
          </div>

          <template v-else>
            <template v-if="accountMode === 'trainer'">
              <AccountTrainerDashboardPanel
                v-show="activeSection === 'dashboard'"
                :current-user="currentUser"
              />

              <AccountTrainerProfilePanel
                v-show="activeSection === 'profile'"
                :current-user="currentUser"
              />

              <AccountTrainerAthletesPanel
                v-show="activeSection === 'athletes'"
                :current-user="currentUser"
              />

              <AccountSettingsPanel
                v-show="activeSection === 'settings'"
                :form="passwordChangeForm"
                :errors="passwordChangeErrors"
                :visibility="passwordVisibility"
                :status="passwordChangeStatus"
                :message="passwordChangeMessage"
                :min-password-length="minPasswordLength"
                :password-field-type="passwordFieldType"
                @update-field="updatePasswordChangeField"
                @submit="handlePasswordChange"
                @toggle-visibility="togglePasswordVisibility"
              />
            </template>

            <template v-else-if="isAdmin">
              <AccountDocumentReviewsPanel
                v-show="activeSection === 'documents'"
                :current-user="currentUser"
              />

              <AccountDashboardPanel
                v-show="activeSection === 'dashboard'"
                :consultation-requests="consultationRequests"
                :trainer-bookings="trainerBookings"
                :users="users"
                :open-competition-registrations-count="openCompetitionRegistrationsCount"
                @select-section="handleSectionSelect"
              />

              <AccountConsultationsPanel
                v-show="activeSection === 'consultations'"
                :requests="consultationRequests"
                :rows="consultationTableRows"
                :is-loading="isAdminDataLoading"
                :search="consultationSearch"
                :status-filter="consultationStatusFilter"
                :status-options="consultationStatusOptions"
                :new-count="newConsultationRequestsCount"
                :total="filteredConsultationRequestsTotal"
                :loading-id="consultationStatusLoadingId"
                @refresh="handleConsultationRefresh"
                @update:search="consultationSearch = $event"
                @update:status-filter="consultationStatusFilter = $event"
                @open-details="openConsultationDetailsDialog"
              />

              <AccountConsultationDetailsDialog
                v-if="activeSection === 'consultations'"
                :model-value="isConsultationDetailsDialogOpen"
                :request="selectedConsultationRequest"
                :status-options="consultationStatusOptions"
                :error-message="consultationDetailsError"
                :is-saving="
                  Boolean(
                    selectedConsultationRequest &&
                      consultationStatusLoadingId === selectedConsultationRequest.id,
                  )
                "
                @close="closeConsultationDetailsDialog"
                @closed="clearConsultationDetailsDialog"
                @save="handleConsultationDetailsSubmit"
              />

              <AccountTrainerBookingsPanel
                v-show="activeSection === 'trainer-bookings'"
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

              <AccountCompetitionRegistrationsAdminPanel
                v-show="activeSection === 'registrations'"
              />

              <AccountCompetitionsPanel
                v-show="activeSection === 'competitions'"
                :rows="filteredCompetitionStages"
                :is-loading="false"
                :competition-filter="competitionFilter"
                :competition-view-filter="competitionViewFilter"
                :competition-options="competitionOptions"
                :total="filteredCompetitionStagesTotal"
                :active-count="activeCompetitionStagesCount"
                :archived-count="archivedCompetitionStagesCount"
                :open-count="filteredOpenCompetitionRegistrationsCount"
                :get-stage-distances="getCompetitionStageDescription"
                :get-stage-active-registrations-count="getStageActiveRegistrationsCount"
                @update:competition-filter="competitionFilter = $event"
                @update:competition-view-filter="competitionViewFilter = $event"
                @update-stage="handleCompetitionStageUpdate"
                @update-stage-links="handleCompetitionStageLinksUpdate"
                @update-stage-distances="handleCompetitionStageDistancesUpdate"
                @create-stage="handleCompetitionStageCreate"
                @delete-stage="handleCompetitionStageDelete"
              />

              <AccountUsersPanel
                v-show="activeSection === 'users'"
                :users="paginatedUsers"
                :search="usersSearch"
                :role-filter="usersRoleFilter"
                :sort-key="usersSortKey"
                :sort-direction="usersSortDirection"
                :total="filteredUsersTotal"
                :page="usersPage"
                :page-count="usersPageCount"
                :is-edit-dialog-open="isUserEditDialogOpen"
                :is-delete-dialog-open="isUserDeleteDialogOpen"
                :edit-form="userEditForm"
                :pending-delete-user="userPendingDelete"
                :document-upload-state="documentUploadState"
                @update:search="usersSearch = $event"
                @update:role-filter="usersRoleFilter = $event"
                @page-change="handleUsersPageChange"
                @toggle-sort="handleUsersSortChange"
                @edit-user="handleOpenUserEdit"
                @delete-user="handleOpenUserDelete"
                @close-edit="handleCloseUserEdit"
                @submit-edit="handleUserEditSubmit"
                @close-delete="handleCloseUserDelete"
                @confirm-delete="handleConfirmUserDelete"
                @open-document-upload="openDocumentUploadDialog"
                @close-document-upload="closeDocumentUploadDialog"
                @submit-document-upload="handleDocumentUploadSubmit"
                @remove-document="handleDocumentRemove"
              />

              <AccountSettingsPanel
                v-show="activeSection === 'settings'"
                :form="passwordChangeForm"
                :errors="passwordChangeErrors"
                :visibility="passwordVisibility"
                :status="passwordChangeStatus"
                :message="passwordChangeMessage"
                :min-password-length="minPasswordLength"
                :password-field-type="passwordFieldType"
                @update-field="updatePasswordChangeField"
                @submit="handlePasswordChange"
                @toggle-visibility="togglePasswordVisibility"
              />
            </template>

            <template v-else>
              <AccountUserDashboardPanel
                v-show="activeSection === 'dashboard'"
                :current-user="currentUser"
                :open-competitions-count="openCompetitionRegistrationsCount"
              />

              <AccountProfilePanel
                v-show="activeSection === 'profile'"
                :current-user="currentUser"
              />

              <AccountAthletesPanel
                v-show="activeSection === 'athletes'"
                :current-user="currentUser"
              />

              <AccountCompetitionRegistrationsPanel
                v-show="activeSection === 'competitions'"
                :current-user="currentUser"
                :initial-target="competitionRegistrationTarget"
                @consume-target="handleCompetitionTargetConsumed"
              />

              <AccountSettingsPanel
                v-show="activeSection === 'settings'"
                :form="passwordChangeForm"
                :errors="passwordChangeErrors"
                :visibility="passwordVisibility"
                :status="passwordChangeStatus"
                :message="passwordChangeMessage"
                :min-password-length="minPasswordLength"
                :password-field-type="passwordFieldType"
                @update-field="updatePasswordChangeField"
                @submit="handlePasswordChange"
                @toggle-visibility="togglePasswordVisibility"
              />
            </template>
          </template>
        </ElMain>
      </ElContainer>
    </ElContainer>
  </section>
</template>

<script setup>
import { Calendar, Document, Monitor, Setting, Trophy, User } from '@element-plus/icons-vue'
import { ElAlert, ElContainer, ElMain } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AccountTrainerAthletesPanel from '@/pages/account/components/trainer/AccountTrainerAthletesPanel.vue'
import AccountTrainerDashboardPanel from '@/pages/account/components/trainer/AccountTrainerDashboardPanel.vue'
import AccountTrainerProfilePanel from '@/pages/account/components/trainer/AccountTrainerProfilePanel.vue'
import AccountCompetitionRegistrationsPanel from '@/pages/account/components/competition-registrations/AccountCompetitionRegistrationsPanel.vue'
import AccountCompetitionRegistrationsAdminPanel from '@/pages/account/components/competition-registrations/AccountCompetitionRegistrationsAdminPanel.vue'
import AccountCompetitionsPanel from '@/pages/account/components/competitions/AccountCompetitionsPanel.vue'
import AccountConsultationDetailsDialog from '@/pages/account/components/consultations/AccountConsultationDetailsDialog.vue'
import AccountDocumentReviewsPanel from '@/pages/account/components/documents/AccountDocumentReviewsPanel.vue'
import AccountConsultationsPanel from '@/pages/account/components/consultations/AccountConsultationsPanel.vue'
import AccountDashboardPanel from '@/pages/account/components/dashboard/AccountDashboardPanel.vue'
import AccountAthletesPanel from '@/pages/account/components/athletes/AccountAthletesPanel.vue'
import AccountHeaderBar from '@/pages/account/components/layout/AccountHeaderBar.vue'
import AccountProfilePanel from '@/pages/account/components/profile/AccountProfilePanel.vue'
import AccountUserDashboardPanel from '@/pages/account/components/dashboard/AccountUserDashboardPanel.vue'
import AccountSettingsPanel from '@/pages/account/components/profile/AccountSettingsPanel.vue'
import AccountSidebar from '@/pages/account/components/layout/AccountSidebar.vue'
import AccountTrainerBookingsPanel from '@/pages/account/components/trainer-bookings/AccountTrainerBookingsPanel.vue'
import AccountUsersPanel from '@/pages/account/components/users/AccountUsersPanel.vue'
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
const accountMode = computed(() => {
  if (isAdmin.value) {
    return 'admin'
  }

  if (currentRole.value === CRM_ROLE.TRAINER) {
    return 'trainer'
  }

  return 'user'
})
const isAccountShellReady = computed(() => Boolean(currentUser.value) && !isProfileLoading.value)

const {
  passwordChangeStatus,
  passwordChangeMessage,
  passwordChangeForm,
  passwordChangeErrors,
  passwordVisibility,
  passwordFieldType,
  updatePasswordChangeField,
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
  selectedConsultationRequest,
  isConsultationDetailsDialogOpen,
  consultationDetailsError,
  openConsultationDetailsDialog,
  closeConsultationDetailsDialog,
  clearConsultationDetailsDialog,
  handleConsultationDetailsSubmit,
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
  competitionViewFilter,
  competitionOptions,
  filteredCompetitionStages,
  filteredCompetitionStagesTotal,
  activeCompetitionStagesCount,
  archivedCompetitionStagesCount,
  filteredOpenCompetitionRegistrationsCount,
  openCompetitionRegistrationsCount,
  updateCompetitionStage,
  updateCompetitionStageLinks,
  updateCompetitionStageDistances,
  getCompetitionStageDescription,
  deleteCompetitionStage,
  getStageActiveRegistrationsCount,
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
  usersSortKey,
  usersSortDirection,
  filteredUsersTotal,
  usersPageCount,
  paginatedUsers,
  isUserEditDialogOpen,
  isUserDeleteDialogOpen,
  userPendingDelete,
  userEditForm,
  documentUploadState,
  handleUsersPageChange,
  handleUsersSortChange,
  resetUsersPage,
  handleOpenUserEdit,
  handleCloseUserEdit,
  handleUserEditSubmit,
  handleOpenUserDelete,
  handleCloseUserDelete,
  handleConfirmUserDelete,
  openDocumentUploadDialog,
  closeDocumentUploadDialog,
  handleDocumentUploadSubmit,
  handleDocumentRemove,
} = useAccountUsers()

async function syncAccountData({ force = false, silent = false } = {}) {
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
      await syncCurrentUser({ silent })
      if (accountMode.value === 'admin') {
        await syncAdminData({ silent })
        await syncTrainerBookings({ silent })
        clearOwnTrainerBookings()
      } else if (accountMode.value === 'trainer') {
        clearConsultationState()
        clearTrainerBookingsState()
        clearOwnTrainerBookings()
      } else {
        clearConsultationState()
        clearTrainerBookingsState()
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

  if (sectionId !== 'consultations') {
    closeConsultationDetailsDialog()
  }
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
  if (accountMode.value === 'admin') {
    return [
      { id: 'dashboard', label: 'Дашборд', icon: Monitor },
      { id: 'users', label: 'Пользователи', icon: User },
      { id: 'competitions', label: 'Соревнования', icon: Trophy },
      { id: 'trainer-bookings', label: 'Запись к тренерам', icon: Calendar },
      { id: 'consultations', label: 'Консультации', icon: Calendar },
      { id: 'registrations', label: 'Заявки', icon: Trophy },
      { id: 'documents', label: 'Документы', icon: Document },
      { id: 'settings', label: 'Настройки', icon: Setting },
    ]
  }

  if (accountMode.value === 'trainer') {
    return [
      { id: 'dashboard', label: 'Дашборд', icon: Monitor },
      { id: 'profile', label: 'Личная информация', icon: User },
      { id: 'athletes', label: 'Спортсмены', icon: Trophy },
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
  if (accountMode.value === 'admin') {
    return {
      dashboard: { title: 'Дашборд' },
      consultations: { title: 'Консультации' },
      'trainer-bookings': { title: 'Записи к тренерам' },
      documents: { title: 'Проверка документов' },
      registrations: { title: 'Заявки на соревнования' },
      competitions: { title: 'Соревнования' },
      users: { title: 'Пользователи' },
      settings: { title: 'Настройки' },
    }
  }

  if (accountMode.value === 'trainer') {
    return {
      dashboard: { title: 'Дашборд' },
      profile: { title: 'Личная информация' },
      athletes: { title: 'Спортсмены' },
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
    if (!isAccountShellReady.value) {
      return
    }

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
  () => [
    isAccountShellReady.value,
    accountMode.value,
    route.query.section,
    route.query.competitionSlug,
    route.query.stageId,
  ],
  () => {
    if (!isAccountShellReady.value) {
      return
    }

    const section = typeof route.query.section === 'string' ? route.query.section : ''
    const competitionSlug =
      typeof route.query.competitionSlug === 'string' ? route.query.competitionSlug : ''
    const stageId = typeof route.query.stageId === 'string' ? route.query.stageId : ''
    const allowedSections = new Set(navigationItems.value.map((item) => item.id))

    if (accountMode.value === 'admin' && section === 'competitions') {
      activeSection.value = 'competitions'
      competitionRegistrationTarget.value =
        competitionSlug || stageId ? { competitionSlug, stageId } : null
      return
    }

    if (section && allowedSections.has(section)) {
      activeSection.value = section
      competitionRegistrationTarget.value = null
      return
    }

    if (competitionRegistrationTarget.value) {
      competitionRegistrationTarget.value = null
    }

    if (section) {
      activeSection.value = navigationItems.value[0]?.id || 'dashboard'
    }
  },
  { immediate: true },
)

onMounted(() => {
  void syncAccountData({ force: true })

  authSubscription = subscribeToAuthStateChange((event, session) => {
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

    if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
      return
    }

    if (event === 'SIGNED_IN' && currentUser.value?.id === session.user.id) {
      return
    }

    void syncAccountData({ force: true, silent: Boolean(currentUser.value) })
  })
})

onBeforeUnmount(() => {
  authSubscription?.unsubscribe()
  stopConsultationFeed()
  stopTrainerBookingsFeed()
})
</script>

<template>
  <section class="account">
    <ElContainer class="account__shell">
      <AccountSidebar
        v-if="isAccountShellReady"
        :key="accountSidebarKey"
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
                v-if="hasVisitedSection('dashboard')"
                v-show="activeSection === 'dashboard'"
                :current-user="currentUser"
                :bookings="ownTrainerBookings"
                :is-loading="ownTrainerBookingsLoading"
                :show-initial-skeleton="isSectionInitialSkeletonVisible('dashboard')"
                @select-section="handleSectionSelect"
              />

              <AccountTrainerProfilePanel
                v-if="hasVisitedSection('profile')"
                v-show="activeSection === 'profile'"
                :current-user="currentUser"
              />

              <AccountTrainerAthletesPanel
                v-if="hasVisitedSection('athletes')"
                v-show="activeSection === 'athletes'"
                :current-user="currentUser"
                :bookings="ownTrainerBookings"
                :is-loading="ownTrainerBookingsLoading"
                :show-initial-skeleton="isSectionInitialSkeletonVisible('athletes')"
              />

              <AccountOwnTrainerBookingsPanel
                v-if="hasVisitedSection('trainer-bookings')"
                v-show="activeSection === 'trainer-bookings'"
                :bookings="ownTrainerBookings"
                :is-loading="ownTrainerBookingsLoading"
                :show-initial-skeleton="isSectionInitialSkeletonVisible('trainer-bookings')"
                :total="ownTrainerBookingsTotal"
                mode="trainer"
                can-update-status
                @update-status="handleOwnTrainerBookingStatusUpdate"
              />

              <AccountSettingsPanel
                v-if="hasVisitedSection('settings')"
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
              <AccountDashboardPanel
                v-if="hasVisitedSection('dashboard')"
                v-show="activeSection === 'dashboard'"
                :is-loading="isAdminDashboardLoading"
                :show-initial-skeleton="isSectionInitialSkeletonVisible('dashboard')"
                :consultation-requests="consultationRequests"
                :trainer-bookings="trainerBookings"
                :users="users"
                :dashboard-summary="adminDashboardSummary"
                :latest-documents="adminLatestDocuments"
                :open-competition-registrations-count="openCompetitionRegistrationsCount"
                @select-section="handleSectionSelect"
              />

              <AccountConsultationsPanel
                v-if="hasVisitedSection('consultations')"
                v-show="activeSection === 'consultations'"
                :requests="consultationRequests"
                :rows="consultationTableRows"
                :is-loading="isAdminDataLoading"
                :show-initial-skeleton="isSectionInitialSkeletonVisible('consultations')"
                :search="consultationSearch"
                :status-filter="consultationStatusFilter"
                :status-options="consultationStatusOptions"
                :new-count="newConsultationRequestsCount"
                :total="filteredConsultationRequestsTotal"
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
                v-if="hasVisitedSection('trainer-bookings')"
                v-show="activeSection === 'trainer-bookings'"
                :bookings="filteredTrainerBookings"
                :is-loading="trainerBookingsLoading"
                :show-initial-skeleton="isSectionInitialSkeletonVisible('trainer-bookings')"
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
                v-if="hasVisitedSection('registrations')"
                v-show="activeSection === 'registrations'"
                @open-account="handleOpenAccountFromRegistration"
              />

              <AccountEmailPanel
                v-if="hasVisitedSection('email')"
                v-show="activeSection === 'email'"
                :show-initial-skeleton="isSectionInitialSkeletonVisible('email')"
                :users="users"
              />

              <AccountCompetitionsPanel
                v-if="hasVisitedSection('competitions')"
                v-show="activeSection === 'competitions'"
                :rows="filteredCompetitionStages"
                :is-loading="isCompetitionStagesLoading"
                :show-initial-skeleton="isSectionInitialSkeletonVisible('competitions')"
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
                v-if="hasVisitedSection('users')"
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
                :is-edit-submitting="userEditSubmitting"
                :is-delete-submitting="userDeleteSubmitting"
                :is-edit-dialog-loading="isUserEditDetailsLoading"
                :document-action-id="userDocumentActionId"
                :admission-action-id="userAdmissionActionId"
                :is-loading="isUsersLoading"
                :show-initial-skeleton="isSectionInitialSkeletonVisible('users')"
                @update:search="usersSearch = $event"
                @update:role-filter="usersRoleFilter = $event"
                @page-change="handleUsersPageChange"
                @toggle-sort="handleUsersSortChange"
                @edit-user="handleOpenUserEdit"
                @delete-user="handleOpenUserDelete"
                @close-edit="handleCloseUserEdit"
                @closed-edit="handleUserEditDialogClosed"
                @submit-edit="handleUserEditSubmit"
                @close-delete="handleCloseUserDelete"
                @confirm-delete="handleConfirmUserDelete"
                @open-document-upload="openDocumentUploadDialog"
                @close-document-upload="closeDocumentUploadDialog"
                @submit-document-upload="handleDocumentUploadSubmit"
                @remove-document="handleDocumentRemove"
                @approve-document="handleApproveUserDocument"
                @request-document-reupload="handleRequestUserDocumentReupload"
                @admit-document-group="handleAdmitUserDocumentGroup"
                @update-edit-field="handleUserEditFieldUpdate"
              />

              <AccountSettingsPanel
                v-if="hasVisitedSection('settings')"
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
                v-if="hasVisitedSection('dashboard')"
                v-show="activeSection === 'dashboard'"
                :current-user="currentUser"
                :open-competitions-count="openCompetitionRegistrationsCount"
              />

              <AccountProfilePanel
                v-if="hasVisitedSection('profile')"
                v-show="activeSection === 'profile'"
                :current-user="currentUser"
              />

              <AccountAthletesPanel
                v-if="hasVisitedSection('athletes')"
                v-show="activeSection === 'athletes'"
                :current-user="currentUser"
              />

              <AccountTrainerRequestPanel
                v-if="hasVisitedSection('trainers')"
                v-show="activeSection === 'trainers'"
                :current-user="currentUser"
              />

              <AccountCompetitionRegistrationsPanel
                v-if="hasVisitedSection('competitions')"
                v-show="activeSection === 'competitions'"
                :current-user="currentUser"
                :initial-target="competitionRegistrationTarget"
                @consume-target="handleCompetitionTargetConsumed"
              />

              <AccountMaterialsPanel
                v-if="hasVisitedSection('materials')"
                v-show="activeSection === 'materials'"
              />

              <AccountUserEmailPanel
                v-if="hasVisitedSection('email')"
                v-show="activeSection === 'email'"
              />

              <AccountSettingsPanel
                v-if="hasVisitedSection('settings')"
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
import { Calendar, Collection, Message, Monitor, Setting, Trophy, User } from '@element-plus/icons-vue'
import { ElAlert, ElContainer, ElMain } from 'element-plus'
import {
  computed,
  defineAsyncComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchEffect,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AccountHeaderBar from '@/pages/account/components/layout/AccountHeaderBar.vue'
import AccountSidebar from '@/pages/account/components/layout/AccountSidebar.vue'
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
import { loadLatestAccountDocumentReviewsForAdmin } from '@/domains/account-documents/documentRepository'
import { loadAccountUsersDashboardSummaryForAdmin } from '@/domains/account-users/accountUsersRepository'
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

const AccountTrainerAthletesPanel = defineAsyncComponent(() =>
  import('@/pages/account/components/trainer/AccountTrainerAthletesPanel.vue'),
)
const AccountTrainerDashboardPanel = defineAsyncComponent(() =>
  import('@/pages/account/components/trainer/AccountTrainerDashboardPanel.vue'),
)
const AccountTrainerProfilePanel = defineAsyncComponent(() =>
  import('@/pages/account/components/trainer/AccountTrainerProfilePanel.vue'),
)
const AccountCompetitionRegistrationsPanel = defineAsyncComponent(() =>
  import(
    '@/pages/account/components/competition-registrations/AccountCompetitionRegistrationsPanel.vue'
  ),
)
const AccountCompetitionRegistrationsAdminPanel = defineAsyncComponent(() =>
  import(
    '@/pages/account/components/competition-registrations/AccountCompetitionRegistrationsAdminPanel.vue'
  ),
)
const AccountCompetitionsPanel = defineAsyncComponent(() =>
  import('@/pages/account/components/competitions/AccountCompetitionsPanel.vue'),
)
const AccountConsultationDetailsDialog = defineAsyncComponent(() =>
  import('@/pages/account/components/consultations/AccountConsultationDetailsDialog.vue'),
)
const AccountConsultationsPanel = defineAsyncComponent(() =>
  import('@/pages/account/components/consultations/AccountConsultationsPanel.vue'),
)
const AccountDashboardPanel = defineAsyncComponent(() =>
  import('@/pages/account/components/dashboard/AccountDashboardPanel.vue'),
)
const AccountEmailPanel = defineAsyncComponent(() =>
  import('@/pages/account/components/email/AccountEmailPanel.vue'),
)
const AccountUserEmailPanel = defineAsyncComponent(() =>
  import('@/pages/account/components/email/AccountUserEmailPanel.vue'),
)
const AccountAthletesPanel = defineAsyncComponent(() =>
  import('@/pages/account/components/athletes/AccountAthletesPanel.vue'),
)
const AccountMaterialsPanel = defineAsyncComponent(() =>
  import('@/pages/account/components/materials/AccountMaterialsPanel.vue'),
)
const AccountProfilePanel = defineAsyncComponent(() =>
  import('@/pages/account/components/profile/AccountProfilePanel.vue'),
)
const AccountUserDashboardPanel = defineAsyncComponent(() =>
  import('@/pages/account/components/dashboard/AccountUserDashboardPanel.vue'),
)
const AccountSettingsPanel = defineAsyncComponent(() =>
  import('@/pages/account/components/profile/AccountSettingsPanel.vue'),
)
const AccountTrainerRequestPanel = defineAsyncComponent(() =>
  import('@/pages/account/components/trainer-bookings/AccountTrainerRequestPanel.vue'),
)
const AccountTrainerBookingsPanel = defineAsyncComponent(() =>
  import('@/pages/account/components/trainer-bookings/AccountTrainerBookingsPanel.vue'),
)
const AccountOwnTrainerBookingsPanel = defineAsyncComponent(() =>
  import('@/pages/account/components/trainer-bookings/AccountOwnTrainerBookingsPanel.vue'),
)
const AccountUsersPanel = defineAsyncComponent(() =>
  import('@/pages/account/components/users/AccountUsersPanel.vue'),
)

const router = useRouter()
const route = useRoute()
const activeSection = ref('dashboard')
const visitedSections = ref(new Set(['dashboard']))
const loadedSectionData = ref(new Set())
const initialSectionSkeletons = ref(new Set())
const competitionRegistrationTarget = ref(null)
let authSubscription = null
let accountSyncPromise = null
let lastAccountSyncAt = 0
let adminDashboardSnapshotPromise = null

function hasVisitedSection(sectionId) {
  return visitedSections.value.has(sectionId)
}

function markSectionVisited(sectionId) {
  if (!sectionId || visitedSections.value.has(sectionId)) {
    return
  }

  visitedSections.value = new Set([...visitedSections.value, sectionId])
}

function resetVisitedSections() {
  visitedSections.value = new Set(['dashboard'])
  loadedSectionData.value = new Set()
  initialSectionSkeletons.value = new Set()
}

function hasLoadedSectionData(sectionId) {
  return loadedSectionData.value.has(sectionId)
}

function markSectionDataLoaded(sectionId) {
  if (!sectionId || loadedSectionData.value.has(sectionId)) {
    return
  }

  loadedSectionData.value = new Set([...loadedSectionData.value, sectionId])
}

function isSectionInitialSkeletonVisible(sectionId) {
  return initialSectionSkeletons.value.has(sectionId)
}

async function runInitialSectionLoad(sectionId, loader) {
  const isFirstLoad = !loadedSectionData.value.has(sectionId)

  if (isFirstLoad) {
    initialSectionSkeletons.value = new Set([...initialSectionSkeletons.value, sectionId])
  }

  try {
    await loader()
  } finally {
    if (isFirstLoad) {
      const next = new Set(initialSectionSkeletons.value)
      next.delete(sectionId)
      initialSectionSkeletons.value = next
    }

    markSectionDataLoaded(sectionId)
  }
}

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
const isAdminDashboardEnabled = computed(
  () => isAdmin.value && hasVisitedSection('dashboard'),
)
const isAdminUsersEnabled = computed(() => isAdmin.value && hasVisitedSection('users'))
const isAdminConsultationsEnabled = computed(
  () => isAdmin.value && (hasVisitedSection('dashboard') || hasVisitedSection('consultations')),
)
const isAdminTrainerBookingsEnabled = computed(
  () =>
    isAdmin.value && (hasVisitedSection('dashboard') || hasVisitedSection('trainer-bookings')),
)
const isAdminCompetitionsEnabled = computed(
  () => isAdmin.value && hasVisitedSection('competitions'),
)

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

const {
  ownTrainerBookings,
  ownTrainerBookingsLoading,
  ownTrainerBookingsError,
  ownTrainerBookingsTotal,
  syncOwnTrainerBookings,
  updateOwnTrainerBookingStatus,
  clearOwnTrainerBookings,
} = useOwnTrainerBookings()

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
} = useConsultationRequests({ isAdmin: isAdminConsultationsEnabled })

const adminDashboardSummary = ref({
  usersCount: 0,
  trainersCount: 0,
  unpaidUsersCount: 0,
})
const adminLatestDocuments = ref([])
const isAdminDashboardSnapshotLoading = ref(false)

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
} = useTrainerBookings({ isAdmin: isAdminTrainerBookingsEnabled })

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
  isCompetitionStagesLoading,
} = useCompetitionStages({ isEnabled: isAdminCompetitionsEnabled })

async function handleCompetitionStageUpdate(payload = {}) {
  const { done, ...stagePayload } = payload

  try {
    await updateCompetitionStage(stagePayload.stageId, stagePayload)
    done?.(true)
  } catch {
    done?.(false)
  }
}

function handleCompetitionStageLinksUpdate(payload) {
  updateCompetitionStageLinks(payload.stageId, payload)
}

function handleCompetitionStageDistancesUpdate(payload) {
  updateCompetitionStageDistances(payload.stageId, payload.description)
}

async function handleCompetitionStageCreate(payload = {}) {
  const { done, ...stagePayload } = payload

  try {
    await createCompetitionStage(stagePayload)
    done?.(true)
  } catch {
    done?.(false)
  }
}

async function handleCompetitionStageDelete(payload = {}) {
  const { done, stageId } = payload

  try {
    await deleteCompetitionStage(stageId)
    done?.(true)
  } catch {
    done?.(false)
  }
}

function handleOpenAccountFromRegistration(accountKey) {
  const normalizedAccountKey = String(accountKey || '').trim()

  if (!normalizedAccountKey) {
    return
  }

  markSectionVisited('users')
  void handleOpenUserEdit({
    id: normalizedAccountKey,
    isAthleteRecord: false,
  })
}

function handleUserEditFieldUpdate({ field, value } = {}) {
  if (!field || !Object.prototype.hasOwnProperty.call(userEditForm, field)) {
    return
  }

  userEditForm[field] = value
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
  isUsersLoading,
  isUserEditDetailsLoading,
  usersSortKey,
  usersSortDirection,
  filteredUsersTotal,
  usersPageCount,
  paginatedUsers,
  ensureUsersLoaded,
  isUserEditDialogOpen,
  isUserDeleteDialogOpen,
  userPendingDelete,
  userEditForm,
  documentUploadState,
  userEditSubmitting,
  userDeleteSubmitting,
  userDocumentActionId,
  userAdmissionActionId,
  handleUsersPageChange,
  handleUsersSortChange,
  resetUsersPage,
  handleOpenUserEdit,
  handleCloseUserEdit,
  handleUserEditDialogClosed,
  handleUserEditSubmit,
  handleOpenUserDelete,
  handleCloseUserDelete,
  handleConfirmUserDelete,
  openDocumentUploadDialog,
  closeDocumentUploadDialog,
  handleDocumentUploadSubmit,
  handleDocumentRemove,
  handleApproveUserDocument,
  handleRequestUserDocumentReupload,
  handleAdmitUserDocumentGroup,
  clearUsersState,
} = useAccountUsers({
  currentUser,
  isEnabled: isAdminUsersEnabled,
  shouldRefresh: isAdminUsersEnabled,
})

async function syncAdminDashboardSnapshot({ silent = false } = {}) {
  if (!isAdminDashboardEnabled.value) {
    adminDashboardSummary.value = {
      usersCount: 0,
      trainersCount: 0,
      unpaidUsersCount: 0,
    }
    adminLatestDocuments.value = []
    return
  }

  if (adminDashboardSnapshotPromise) {
    return adminDashboardSnapshotPromise
  }

  if (!silent) {
    isAdminDashboardSnapshotLoading.value = true
  }

  adminDashboardSnapshotPromise = (async () => {
    try {
      const [summary, latestDocuments] = await Promise.all([
        loadAccountUsersDashboardSummaryForAdmin(),
        loadLatestAccountDocumentReviewsForAdmin({ limit: 4 }),
      ])

      adminDashboardSummary.value = summary
      adminLatestDocuments.value = latestDocuments
    } finally {
      if (!silent) {
        isAdminDashboardSnapshotLoading.value = false
      }

      adminDashboardSnapshotPromise = null
    }
  })()

  return adminDashboardSnapshotPromise
}

async function syncActiveAccountSectionData({ silent = false } = {}) {
  if (accountMode.value === 'admin') {
    if (activeSection.value === 'dashboard') {
      await runInitialSectionLoad('dashboard', () =>
        Promise.all([
          syncAdminData({ silent }),
          syncTrainerBookings({ silent }),
          syncAdminDashboardSnapshot({ silent }),
        ]),
      )
      return
    }

    if (activeSection.value === 'consultations') {
      await runInitialSectionLoad('consultations', async () => {
        if (!hasLoadedSectionData('consultations')) {
          clearConsultationState()
        }

        await syncAdminData({ silent })
      })
      return
    }

    if (activeSection.value === 'trainer-bookings') {
      await runInitialSectionLoad('trainer-bookings', async () => {
        if (!hasLoadedSectionData('trainer-bookings')) {
          clearTrainerBookingsState()
        }

        await syncTrainerBookings({ silent })
      })
      return
    }

    if (activeSection.value === 'users') {
      await runInitialSectionLoad('users', async () => {
        if (!hasLoadedSectionData('users')) {
          clearUsersState()
        }

        await ensureUsersLoaded()
      })
    }

    return
  }

  clearConsultationState()
  clearTrainerBookingsState()

  if (accountMode.value === 'trainer') {
    const trainerSection = activeSection.value

    if (['dashboard', 'athletes', 'trainer-bookings'].includes(trainerSection)) {
      await runInitialSectionLoad(trainerSection, async () => {
        if (trainerSection === 'trainer-bookings' && !hasLoadedSectionData('trainer-bookings')) {
          clearOwnTrainerBookings()
        }

        await syncOwnTrainerBookings()
      })
    }

    return
  }

  if (activeSection.value === 'dashboard' || activeSection.value === 'trainers') {
    await syncOwnTrainerBookings()
    markSectionDataLoaded(activeSection.value)
  }
}

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
      await syncActiveAccountSectionData({ silent })
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
      resetVisitedSections()
      clearConsultationState()
      clearTrainerBookingsState()
      clearOwnTrainerBookings()
    },
    onError: (message) => {
      adminDataError.value = message
    },
  })
}

async function handleOwnTrainerBookingStatusUpdate(payload = {}) {
  const { done, id, status, comment } = payload

  try {
    await updateOwnTrainerBookingStatus(id, status, comment)
    done?.(true)
  } catch {
    done?.(false)
  }
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
      { id: 'email', label: 'Письма', icon: Message },
      { id: 'settings', label: 'Настройки', icon: Setting },
    ]
  }

  if (accountMode.value === 'trainer') {
    return [
      { id: 'dashboard', label: 'Дашборд', icon: Monitor },
      { id: 'profile', label: 'Личная информация', icon: User },
      { id: 'athletes', label: 'Спортсмены', icon: Trophy },
      { id: 'trainer-bookings', label: 'Заявки', icon: Calendar },
      { id: 'settings', label: 'Настройки', icon: Setting },
    ]
  }

  return [
    { id: 'dashboard', label: 'Дашборд', icon: Monitor },
    { id: 'profile', label: 'Личная информация', icon: User },
    { id: 'athletes', label: 'Спортсмены', icon: Trophy },
    { id: 'trainers', label: 'Тренеры', icon: Calendar },
    { id: 'competitions', label: 'Соревнования', icon: Trophy },
    { id: 'materials', label: 'Материалы', icon: Collection },
    { id: 'email', label: 'Письма', icon: Message },
    { id: 'settings', label: 'Настройки', icon: Setting },
  ]
})

const sectionContent = computed(() => {
  if (accountMode.value === 'admin') {
    return {
      dashboard: { title: 'Дашборд' },
      consultations: { title: 'Консультации' },
      'trainer-bookings': { title: 'Записи к тренерам' },
      email: { title: 'Письма' },
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
      'trainer-bookings': { title: 'Заявки к тренеру' },
      settings: { title: 'Настройки' },
    }
  }

  return {
    dashboard: { title: 'Дашборд' },
    profile: { title: 'Личная информация' },
    athletes: { title: 'Спортсмены' },
    trainers: { title: 'Тренеры' },
    competitions: { title: 'Соревнования' },
    materials: { title: 'Материалы' },
    email: { title: 'Письма' },
    settings: { title: 'Настройки' },
  }
})

const currentSectionTitle = computed(
  () => sectionContent.value[activeSection.value]?.title || 'Кабинет',
)
const accountSidebarKey = computed(() => {
  const navigationSignature = navigationItems.value.map((item) => item.id).join('|')

  return `${accountMode.value}:${navigationSignature}`
})
const isAdminDashboardLoading = computed(
  () =>
    isAdminDataLoading.value ||
    trainerBookingsLoading.value ||
    isAdminDashboardSnapshotLoading.value,
)

watchEffect(() => {
  if (!isAccountShellReady.value) {
    return
  }

  const items = navigationItems.value

  if (!items.some((item) => item.id === activeSection.value)) {
    activeSection.value = items[0]?.id || 'dashboard'
  }
})

watch(
  activeSection,
  (value) => {
    markSectionVisited(value)

    if (value === 'users') {
      resetUsersPage()
    }
  },
  { immediate: true },
)

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

watch(
  () => [isAccountShellReady.value, accountMode.value, activeSection.value],
  ([shellReady]) => {
    if (!shellReady) {
      return
    }

    markSectionVisited(activeSection.value)
    void syncActiveAccountSectionData({ silent: false })
  },
  { immediate: true },
)

onMounted(() => {
  void syncAccountData({ force: true })

  authSubscription = subscribeToAuthStateChange((event, session) => {
    if (!session) {
      resetVisitedSections()
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

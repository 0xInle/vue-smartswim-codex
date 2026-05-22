<template>
  <ElCard class="account__panel account-competition-registrations-admin" shadow="never">
    <div class="account-competition-registrations-admin__header">
      <div class="account__panel-head">
        <div class="account__panel-actions">
          <ElTag type="primary" effect="light" round>{{ summary.total }} заявок</ElTag>
          <ElTag type="success" effect="light" round>{{ summary.active }} активных</ElTag>
          <ElTag type="danger" effect="light" round>{{ summary.withdrawn }} снятых</ElTag>
        </div>
      </div>

      <div class="account-competition-registrations-admin__filters">
        <label class="account__field account__field--search">
          <span class="account__field-label">Поиск</span>
          <input
            v-model.trim="search"
            class="account__input account__input--toolbar"
            type="search"
            name="competition-registrations-search"
            placeholder="ФИО, соревнование, владелец"
          />
        </label>

        <label class="account__field account__field--filter">
          <span class="account__field-label">Статус</span>
          <ElSelect
            v-model="statusFilter"
            class="account__select"
            popper-class="account__select-popper"
            placeholder="Все статусы"
          >
            <ElOption label="Все статусы" value="all" />
            <ElOption
              v-for="option in registrationStatusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </label>
      </div>
    </div>

    <div
      v-if="registrationsError"
      class="account-competition-registrations-admin__notice account-competition-registrations-admin__notice--error"
    >
      {{ registrationsError }}
    </div>

    <div
      v-else-if="isRegistrationsLoading && !filteredRegistrations.length"
      class="account-competition-registrations-admin__notice"
    >
      Заявки загружаются...
    </div>

    <div v-else-if="filteredRegistrations.length" class="account__native-table-wrap">
      <table class="account__native-table account__native-table--competition-admin-registrations">
        <thead class="account__native-table-head">
          <tr>
            <th class="account__native-table-head-cell--sortable">
              <button
                type="button"
                class="account__table-sort-button account__table-sort-button--left btn-reset"
                :class="{ 'account__table-sort-button--active': sortKey === 'participantName' }"
                :aria-label="getSortAriaLabel('ФИО', 'participantName')"
                @click="toggleSort('participantName')"
              >
                <span>ФИО</span>
                <span
                  class="account__table-sort-indicator"
                  :data-direction="getSortDirection('participantName')"
                  aria-hidden="true"
                ></span>
              </button>
            </th>
            <th>Соревнование</th>
            <th>Статус</th>
            <th>Действие</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="registration in sortedRegistrations"
            :key="registration.id"
            class="account__native-table-row"
            :class="`account-competition-registrations-admin__row--${registration.status}`"
          >
            <td class="account__native-table-cell">
              <span class="account__table-primary account-competition-registrations-admin__nowrap">
                {{ registration.participantName || 'Без имени' }}
              </span>
            </td>
            <td class="account__native-table-cell">
              <span class="account__table-primary account-competition-registrations-admin__nowrap">
                {{ registration.competitionName || 'Соревнование не указано' }}
              </span>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <div class="account-competition-registrations-admin__status-cell">
                <ElTag
                  :type="competitionRegistrationRecordStatusType(registration.status)"
                  effect="light"
                  round
                >
                  {{ formatCompetitionRegistrationRecordStatus(registration.status) }}
                </ElTag>
                <span class="account-competition-registrations-admin__status-hint">
                  {{ getRegistrationLifecycleSummary(registration).responsibleLabel }}
                </span>
              </div>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <button
                type="button"
                class="account__table-action account__table-action--edit btn-reset"
                @click="openDetailsDialog(registration)"
              >
                Подробнее
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else description="Заявки не найдены." />

    <AccountCompetitionRegistrationDetailsDialog
      :model-value="isDetailsDialogOpen"
      :registration="selectedRegistration"
      :stage-options="stageOptions"
      :can-edit-stage="false"
      :can-edit-registration-kind="false"
      :can-edit-status="true"
      :show-save-button="true"
      :show-withdraw-button="false"
      :status-options="selectedRegistrationStatusOptions"
      :status-tag-type="
        selectedRegistration
          ? competitionRegistrationRecordStatusType(selectedRegistration.status)
          : 'info'
      "
      :status-label="
        selectedRegistration
          ? formatCompetitionRegistrationRecordStatus(selectedRegistration.status)
          : ''
      "
      :lifecycle-label="selectedRegistrationLifecycleSummary?.label || ''"
      :lifecycle-description="selectedRegistrationLifecycleSummary?.description || ''"
      :lifecycle-next-action="selectedRegistrationLifecycleSummary?.nextAction || ''"
      :lifecycle-responsible-label="selectedRegistrationLifecycleSummary?.responsibleLabel || ''"
      :lifecycle-blocks-admission="Boolean(selectedRegistrationLifecycleSummary?.blocksAdmission)"
      :documents-status-tag-type="selectedRegistrationDocumentsStatus?.tagType || 'info'"
      :documents-status-label="selectedRegistrationDocumentsStatus?.label || ''"
      :documents-status-description="selectedRegistrationDocumentsStatus?.description || ''"
      @close="closeDetailsDialog"
      @save="handleRegistrationSave"
    />
  </ElCard>
</template>

<script setup>
import { ElCard, ElEmpty, ElOption, ElSelect, ElTag } from 'element-plus'
import { computed } from 'vue'
import { COMPETITION_REGISTRATION_RECORD_STATUS_OPTIONS } from '@/pages/account/utils/accountConstants'
import { useAccountCompetitionRegistrationsAdmin } from '@/pages/account/composables/useAccountCompetitionRegistrationsAdmin'
import { useTriStateTextSort } from '@/pages/account/composables/useTriStateTextSort'
import AccountCompetitionRegistrationDetailsDialog from '@/pages/account/components/competition-registrations/AccountCompetitionRegistrationDetailsDialog.vue'

const {
  search,
  statusFilter,
  filteredRegistrations,
  summary,
  isRegistrationsLoading,
  registrationsError,
  stageOptions,
  selectedRegistration,
  isDetailsDialogOpen,
  openDetailsDialog,
  closeDetailsDialog,
  selectedRegistrationDocumentsStatus,
  selectedRegistrationLifecycleSummary,
  selectedRegistrationStatusOptions,
  getRegistrationLifecycleSummary,
  competitionRegistrationRecordStatusType,
  formatCompetitionRegistrationRecordStatus,
  handleRegistrationSave,
} = useAccountCompetitionRegistrationsAdmin()

const registrationStatusOptions = COMPETITION_REGISTRATION_RECORD_STATUS_OPTIONS
const { sortKey, toggleSort, getSortState, sortItems } =
  useTriStateTextSort('participantName')

const sortedRegistrations = computed(() =>
  sortItems(filteredRegistrations.value, {
    participantName: (registration) => registration.participantName || '',
  }),
)

function getSortIndicator(columnKey) {
  const state = getSortState(columnKey)

  if (!state.isActive) {
    return 'none'
  }

  return state.direction === 'desc' ? 'desc' : 'asc'
}

function getSortDirection(columnKey) {
  return getSortIndicator(columnKey)
}

function getSortAriaLabel(label, columnKey) {
  const state = getSortState(columnKey)

  if (!state.isActive) {
    return `Сортировать по ${label} по возрастанию`
  }

  if (state.direction === 'asc') {
    return `Сортировать по ${label} по убыванию`
  }

  return `Сбросить сортировку по ${label}`
}
</script>

<style scoped>
.account-competition-registrations-admin__header {
  display: grid;
  gap: 18px;
  padding: 18px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--aqua) 14%, transparent);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(247, 250, 255, 0.72));
}

.account-competition-registrations-admin__header .account__panel-actions {
  margin-left: auto;
}

.account-competition-registrations-admin__filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
  align-items: end;
}

.account-competition-registrations-admin__filters .account__field {
  min-width: 0;
}

.account-competition-registrations-admin__row--withdrawn {
  background: transparent;
}

.account-competition-registrations-admin__row--withdrawn .account__native-table-cell {
  color: #8b4d38;
}

.account-competition-registrations-admin__nowrap {
  white-space: nowrap;
}

.account-competition-registrations-admin__notice {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.9);
  color: #31526b;
  font-weight: 800;
}

.account-competition-registrations-admin__notice--error {
  border-color: color-mix(in srgb, #d7502f 24%, white);
  color: #9f341f;
}

.account-competition-registrations-admin__status-cell {
  display: grid;
  justify-items: center;
  gap: 5px;
  min-width: 0;
}

.account-competition-registrations-admin__status-hint {
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
  color: #64748b;
}

.account__native-table--competition-admin-registrations {
  min-width: 100%;
}

.account__native-table--competition-admin-registrations th:not(:first-child),
.account__native-table--competition-admin-registrations td:not(:first-child) {
  text-align: center;
}

.account-competition-registrations-admin .account__native-table-wrap {
  background: transparent;
}

.account-competition-registrations-admin .account__native-table-row:nth-child(even) {
  background: transparent;
}

@media (max-width: 1180px) {
  .account-competition-registrations-admin__filters {
    grid-template-columns: 1fr;
  }
}
</style>

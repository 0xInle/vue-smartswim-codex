<template>
  <ElCard class="account__panel account-competitions" shadow="never">
    <div class="account__competitions-toolbar">
      <label class="account__field account__field--filter">
        <ElSelect
          :model-value="competitionFilter"
          class="account__select"
          popper-class="account__select-popper account__select-popper--full"
          placeholder="Все соревнования"
          @update:model-value="emit('update:competition-filter', $event)"
        >
          <ElOption
            v-for="option in competitionOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </label>

      <div class="account__competition-view-switch" role="group" aria-label="Фильтр соревнований">
        <button
          type="button"
          class="account__competition-view-button btn-reset"
          :class="{
            'account__competition-view-button--active': competitionViewFilter === 'active',
          }"
          :aria-pressed="competitionViewFilter === 'active'"
          @click="emit('update:competition-view-filter', 'active')"
        >
          <span class="account__competition-view-button-label">Активные</span>
          <span class="account__competition-view-button-count">{{ activeCount }}</span>
        </button>

        <button
          type="button"
          class="account__competition-view-button btn-reset"
          :class="{
            'account__competition-view-button--active': competitionViewFilter === 'archived',
          }"
          :aria-pressed="competitionViewFilter === 'archived'"
          @click="emit('update:competition-view-filter', 'archived')"
        >
          <span class="account__competition-view-button-label">Архив</span>
          <span class="account__competition-view-button-count">{{ archivedCount }}</span>
        </button>
      </div>

      <button
        type="button"
        class="account__table-action account__table-action--edit account__competition-add btn-reset"
        @click="openCreateCompetitionDialog"
      >
        Добавить
      </button>
    </div>

    <div v-if="isLoading && !rows.length" class="account__loading-state">
      Загружаем соревнования...
    </div>

    <div v-else-if="rows.length" class="account__native-table-wrap">
      <table class="account__native-table account__native-table--competitions">
        <thead class="account__native-table-head">
          <tr>
            <th>Название соревнования</th>
            <th>Этап</th>
            <th>Дата</th>
            <th>Регистрация</th>
            <th>Места</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="row in competitionRows"
            :key="row.id"
            class="account__native-table-row account-competitions__table-row"
            tabindex="0"
            role="button"
            :class="{ 'account__native-table-row--archived': row.isArchived }"
            @click="openCompetitionDetailsDialog(row)"
            @keydown.enter.prevent="openCompetitionDetailsDialog(row)"
            @keydown.space.prevent="openCompetitionDetailsDialog(row)"
          >
            <td class="account__native-table-cell account__native-table-cell--primary">
              <div class="account__competition-name">
                <div class="account__competition-name-copy">
                  <span class="account__table-primary">
                    {{ formatCompetitionName(row.competitionName) }}
                  </span>
                </div>
              </div>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <span class="account__competition-stage">
                {{ formatCompetitionStageLabel(row.stage) }}
              </span>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              {{ formatCompetitionCalendarDateShort(row.date) }}
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <span class="account__competition-registration-window">
                {{ formatCompetitionRegistrationWindow(row.registration) }}
              </span>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <span class="account__competition-registration-window">
                {{ formatStageCapacity(row) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else :description="emptyStateDescription" />

    <AccountCompetitionCreateDialog
      :model-value="isCreateCompetitionDialogOpen"
      :is-submitting="actionLoading === 'create-stage'"
      @close="closeCreateCompetitionDialog"
      @submit="saveCreateCompetitionDialog"
    />

    <AccountCompetitionDetailsDialog
      :model-value="isCompetitionDialogOpen"
      :stage="competitionDialogStage"
      :action-loading="actionLoading"
      @close="closeCompetitionDialog"
      @save-stage="saveCompetitionDialog"
      @delete-stage="openDeleteCompetitionDialog"
      @update-links="saveCompetitionLinks"
      @update-distances="saveCompetitionDistances"
      @closed="resetCompetitionDialog"
    />

    <AccountCompetitionDeleteDialog
      :model-value="isDeleteCompetitionDialogOpen"
      :stage="deleteCompetitionStage"
      :active-registrations-count="deleteCompetitionActiveRegistrationsCount"
      :is-submitting="actionLoading === 'delete-stage'"
      @close="closeDeleteCompetitionDialog"
      @confirm="confirmDeleteCompetition"
    />
  </ElCard>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElCard, ElEmpty, ElOption, ElSelect } from 'element-plus'
import {
  formatCompetitionCalendarDateShort,
  formatCompetitionName,
  formatCompetitionRegistrationWindow,
  formatCompetitionStageLabel,
} from '@/pages/account/utils/accountFormatters'
import AccountCompetitionCreateDialog from '@/pages/account/components/competitions/AccountCompetitionCreateDialog.vue'
import AccountCompetitionDetailsDialog from '@/pages/account/components/competitions/AccountCompetitionDetailsDialog.vue'
import AccountCompetitionDeleteDialog from '@/pages/account/components/competitions/AccountCompetitionDeleteDialog.vue'
import { toCompetitionDateTime } from '@/utils/competitionRegistration'

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    required: true,
  },
  competitionFilter: {
    type: String,
    required: true,
  },
  competitionViewFilter: {
    type: String,
    required: true,
  },
  competitionOptions: {
    type: Array,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  activeCount: {
    type: Number,
    required: true,
  },
  archivedCount: {
    type: Number,
    required: true,
  },
  openCount: {
    type: Number,
    required: true,
  },
  actionLoading: {
    type: String,
    default: '',
  },
  getStageDistances: {
    type: Function,
    required: true,
  },
  getStageActiveRegistrationsCount: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'update:competition-filter',
  'update:competition-view-filter',
  'update-stage',
  'update-stage-links',
  'update-stage-distances',
  'create-stage',
  'delete-stage',
])

const isCompetitionDialogOpen = ref(false)
const isCreateCompetitionDialogOpen = ref(false)
const isDeleteCompetitionDialogOpen = ref(false)
const competitionDialogStage = ref(null)
const deleteCompetitionStage = ref(null)

const competitionRows = computed(() =>
  props.rows.map((row) => ({
    ...row,
    isArchived: isCompetitionArchived(row),
  })),
)

const emptyStateDescription = computed(() =>
  props.competitionViewFilter === 'archived'
    ? 'Архив соревнований пока пуст.'
    : 'Активные соревнования не найдены.',
)

const deleteCompetitionActiveRegistrationsCount = computed(() => {
  if (!deleteCompetitionStage.value) {
    return 0
  }

  return props.getStageActiveRegistrationsCount(deleteCompetitionStage.value.id)
})

function isCompetitionArchived(row, now = Date.now()) {
  const archiveTimestamp = Date.parse(toCompetitionDateTime(row?.date, { endOfDay: true }))

  return Number.isFinite(archiveTimestamp) ? now >= archiveTimestamp : false
}

function formatStageCapacity(row) {
  const activeCount = props.getStageActiveRegistrationsCount(row.id)
  const limit = Number(row.registrationLimit ?? row.registration?.participantLimit ?? 0)

  if (!limit) {
    return `${activeCount}/0`
  }

  return `${activeCount}/${limit}`
}

function openCompetitionDetailsDialog(row) {
  competitionDialogStage.value = row
  isCompetitionDialogOpen.value = true
}

function closeCompetitionDialog() {
  isCompetitionDialogOpen.value = false
}

function resetCompetitionDialog() {
  competitionDialogStage.value = null
}

function saveCompetitionDialog(payload) {
  emit('update-stage', {
    ...payload,
    done: (isSuccess) => {
      if (isSuccess) {
        closeCompetitionDialog()
      }
    },
  })
}

function openCreateCompetitionDialog() {
  isCreateCompetitionDialogOpen.value = true
}

function closeCreateCompetitionDialog() {
  if (props.actionLoading === 'create-stage') {
    return
  }

  isCreateCompetitionDialogOpen.value = false
}

function saveCreateCompetitionDialog(payload) {
  emit('create-stage', {
    ...payload,
    done: (isSuccess) => {
      if (isSuccess) {
        closeCreateCompetitionDialog()
      }
    },
  })
}

function openDeleteCompetitionDialog(row) {
  deleteCompetitionStage.value = row
  isDeleteCompetitionDialogOpen.value = true
}

function closeDeleteCompetitionDialog() {
  if (props.actionLoading === 'delete-stage') {
    return
  }

  isDeleteCompetitionDialogOpen.value = false
  deleteCompetitionStage.value = null
}

function confirmDeleteCompetition(stageId) {
  emit('delete-stage', {
    stageId,
    done: (isSuccess) => {
      if (isSuccess) {
        closeDeleteCompetitionDialog()
      }
    },
  })
}

function saveCompetitionLinks(payload) {
  emit('update-stage-links', {
    ...payload,
    actionKey: `save-link:${payload.linkKey || 'all'}`,
  })
}

function saveCompetitionDistances(payload) {
  emit('update-stage-distances', payload)
}
</script>

<style scoped>
.account-competitions :deep(.el-card__body) {
  padding-top: 18px;
}

.account__competitions-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr) auto;
  gap: 14px;
  align-items: end;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2f7;
}

.account__competition-view-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-self: start;
  width: 100%;
}

.account__competition-view-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex: 1 1 0;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--cyan) 22%, white);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #5d6b7d;
  background: rgb(255 255 255 / 0.9);
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.account__competition-view-button:nth-child(1) {
  color: #2f8f5b;
  border-color: #dbe9dd;
}

.account__competition-view-button:nth-child(1) .account__competition-view-button-count {
  background: #e7f7ed;
  color: #2f8f5b;
}

.account__competition-view-button:nth-child(2) {
  color: #d76034;
  border-color: color-mix(in srgb, var(--orange) 28%, white);
}

.account__competition-view-button:nth-child(2) .account__competition-view-button-count {
  background: color-mix(in srgb, var(--orange) 14%, white);
  color: #c44d27;
}

.account__competition-view-button--active {
  box-shadow: 0 10px 22px rgb(15 23 42 / 0.08);
}

.account__competition-view-button--active:nth-child(1) {
  background: #effaf5;
  border-color: #d6efc6;
}

.account__competition-view-button--active:nth-child(2) {
  background: color-mix(in srgb, var(--orange) 18%, white);
  border-color: color-mix(in srgb, var(--orange) 42%, white);
}

.account__competition-view-button--active:nth-child(1) .account__competition-view-button-count {
  background: #ddf5e8;
}

.account__competition-view-button--active:nth-child(2) .account__competition-view-button-count {
  background: color-mix(in srgb, var(--orange) 24%, white);
}

.account__competition-view-button-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--aqua) 18%, white);
  color: #176384;
  font-size: 11px;
  font-weight: 900;
}

.account__competition-add {
  min-height: 38px;
  justify-self: end;
  min-width: 140px;
  width: auto;
}

.account__native-table-row--archived {
  background: rgb(247 250 255 / 0.86);
}

.account__native-table-row--archived .account__native-table-cell {
  color: #64748b;
}

.account__native-table-row--archived .account__table-primary {
  color: #394554;
}

.account__competition-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.account__competition-name-copy {
  display: grid;
  gap: 4px;
}

.account__native-table-row--archived .account__competition-stage,
.account__native-table-row--archived .account__competition-registration-window {
  color: #6b7a8a;
}

.account__native-table-row--archived .account__competition-registration-dot--open {
  background: #7f93a5;
  box-shadow: 0 0 0 4px rgb(127 147 165 / 0.16);
}

.account__native-table-row--archived .account__competition-registration-dot--closed {
  background: #9aa7b5;
  box-shadow: 0 0 0 4px rgb(154 167 181 / 0.16);
}

.account__native-table-row--archived .el-tag {
  border-color: color-mix(in srgb, var(--cyan) 18%, white);
}

.account-competitions__table-row {
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.account-competitions__table-row:hover,
.account-competitions__table-row:focus-visible,
.account-competitions__table-row:hover .account__native-table-cell,
.account-competitions__table-row:focus-visible .account__native-table-cell {
  background: #f2f5f8;
  outline: none;
}

.account__native-table-wrap {
  background: transparent;
}

.account__native-table--competitions .account__native-table-cell {
  vertical-align: middle;
}

.account__native-table--competitions .account__native-table-cell--center {
  white-space: nowrap;
}

.account__native-table--competitions-archive {
  table-layout: fixed;
}

.account__native-table--competitions-archive th:nth-child(1),
.account__native-table--competitions-archive td:nth-child(1) {
  width: 42%;
}

.account__native-table--competitions-archive th:nth-child(2),
.account__native-table--competitions-archive td:nth-child(2) {
  width: 16%;
}

.account__native-table--competitions-archive th:nth-child(3),
.account__native-table--competitions-archive td:nth-child(3) {
  width: 21%;
}

.account__native-table--competitions-archive th:nth-child(4),
.account__native-table--competitions-archive td:nth-child(4) {
  width: 21%;
}

@media (max-width: 1180px) {
  .account__competitions-toolbar {
    grid-template-columns: minmax(0, 1fr);
  }

  .account__competition-view-switch {
    width: 100%;
    justify-content: space-between;
  }

  .account__competition-add {
    justify-self: stretch;
    width: 100%;
  }
}

.account__competitions-toolbar :deep(.account__select .el-select__wrapper) {
  min-height: 38px;
}

.account__competitions-toolbar :deep(.account__select .el-select__selected-item) {
  font-size: 15px;
}

.account__competition-view-button,
.account__competition-add {
  height: 38px;
}

@media (max-width: 720px) {
  .account__competition-view-switch {
    flex-direction: column;
    align-items: stretch;
  }

  .account__competition-view-button {
    justify-content: space-between;
    width: 100%;
  }
}
</style>

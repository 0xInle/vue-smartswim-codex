<template>
  <ElCard class="account__panel account-competition-registrations" shadow="never">
    <div class="account-competition-registrations__content">
      <section class="account-competition-registrations__section">
        <div class="account-competition-registrations__section-head">
          <h3 class="account__panel-title">Заявки</h3>
        </div>

        <div v-if="registrationHistory.length" class="account__native-table-wrap">
          <table class="account__native-table account__native-table--competition-history">
            <thead class="account__native-table-head">
              <tr>
                <th class="account__native-table-head-cell--sortable">
                  <button
                    type="button"
                    class="account__table-sort-button account__table-sort-button--left btn-reset"
                    :class="{ 'account__table-sort-button--active': sortKey === 'participantName' }"
                    :aria-label="getSortAriaLabel('Участник', 'participantName')"
                    @click="toggleSort('participantName')"
                  >
                    <span>Участник</span>
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
                v-for="record in sortedRegistrationHistory"
                :key="record.id"
                class="account__native-table-row"
                :class="`account-competition-registrations__history-row--${record.status}`"
              >
                <td class="account__native-table-cell account__native-table-cell--center">
                  <span class="account-competition-registrations__nowrap">
                    {{ formatParticipantName(record) }}
                  </span>
                </td>
                <td class="account__native-table-cell account__native-table-cell--center">
                  <span class="account-competition-registrations__nowrap">
                    {{ record.competitionName || 'Не указано' }}
                  </span>
                </td>
                <td class="account__native-table-cell account__native-table-cell--center">
                  <ElTag :type="getRegistrationStatusTagType(record.status)" effect="light" round>
                    {{ getRegistrationStatusLabel(record.status) }}
                  </ElTag>
                </td>
                <td class="account__native-table-cell account__native-table-cell--center">
                  <button
                    type="button"
                    class="account__table-action account__table-action--edit btn-reset"
                    @click="openHistoryDetails(record)"
                  >
                    Подробнее
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="account-competition-registrations__empty-state">
          <div class="account-competition-registrations__empty-state-title">Пока нет заявок</div>
          <div class="account-competition-registrations__empty-state-text">
            Здесь появятся спортсмены и владельцы кабинета, когда будут отправлены заявки на соревнования.
          </div>
        </div>
      </section>

      <section class="account-competition-registrations__section">
        <div class="account-competition-registrations__header-top">
          <div class="account-competition-registrations__controls">
            <div class="account-competition-registrations__filters">
              <label class="account__field account__field--filter">
                <span class="account__field-label">Соревнование</span>
                <ElSelect
                  :model-value="competitionFilter"
                  class="account__select"
                  popper-class="account__select-popper"
                  placeholder="Все соревнования"
                  @update:model-value="competitionFilter = $event"
                >
                  <ElOption
                    v-for="option in competitionOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ElSelect>
              </label>

              <label class="account__field account__field--filter">
                <span class="account__field-label">Статус</span>
                <ElSelect
                  :model-value="statusFilter"
                  class="account__select"
                  popper-class="account__select-popper"
                  placeholder="Все статусы"
                  @update:model-value="statusFilter = $event"
                >
                  <ElOption label="Все статусы" value="all" />
                  <ElOption label="Открыто" value="open" />
                  <ElOption label="Скоро" value="upcoming" />
                  <ElOption label="Закрыто" value="closed" />
                </ElSelect>
              </label>
            </div>

            <div class="account-competition-registrations__stats">
              <ElTag
                class="account-competition-registrations__stat-tag account-competition-registrations__stat-tag--open"
                type="success"
                effect="light"
              >
                {{ openStagesCount }} открыто
              </ElTag>
              <ElTag
                class="account-competition-registrations__stat-tag account-competition-registrations__stat-tag--available"
                type="info"
                effect="light"
              >
                {{ availableStagesCount }} доступно
              </ElTag>
            </div>
          </div>
        </div>
      </section>

      <section class="account-competition-registrations__section">
        <div class="account-competition-registrations__section-head">
          <h3 class="account__panel-title">Соревнования</h3>
        </div>

        <div v-if="filteredRows.length" class="account__native-table-wrap">
          <table class="account__native-table account__native-table--competition-registrations">
            <thead class="account__native-table-head">
              <tr>
                <th>Соревнование</th>
                <th>Этап</th>
                <th>Дата</th>
                <th>Регистрация</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="row in filteredRows" :key="row.id" class="account__native-table-row">
                <td class="account__native-table-cell account__native-table-cell--primary">
                  <div class="account__table-user">
                    <div class="account__table-primary">{{ row.competitionName }}</div>
                  </div>
                </td>
                <td class="account__native-table-cell account__native-table-cell--center">
                  {{ formatCompetitionStageLabel(row.stage) }}
                </td>
                <td class="account__native-table-cell account__native-table-cell--center">
                  {{ formatCompetitionCalendarDateShort(row.date) }}
                </td>
                <td class="account__native-table-cell account__native-table-cell--center">
                  <button
                    type="button"
                    class="account__table-action account__table-action--edit btn-reset account-competition-registrations__registration-button"
                    :class="`account-competition-registrations__registration-button--${row.registrationState.mode}`"
                    :disabled="isRegistrationActionDisabled(row)"
                    :title="getRegistrationActionTitle(row)"
                    @click="handleOpenRegistration(row.id)"
                  >
                    {{ getRegistrationActionLabel(row) }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ElEmpty v-else description="Подходящие соревнования не найдены." />
      </section>
    </div>

    <AccountCompetitionRegistrationDetailsDialog
      :model-value="isHistoryDetailsDialogOpen"
      :registration="selectedHistoryRegistration"
      :stage-options="[]"
      :can-edit-stage="false"
      :can-edit-registration-kind="true"
      :show-save-button="true"
      :show-withdraw-button="true"
      :status-tag-type="
        selectedHistoryRegistration
          ? getRegistrationStatusTagType(selectedHistoryRegistration.status)
          : 'info'
      "
      :status-label="
        selectedHistoryRegistration ? getRegistrationStatusLabel(selectedHistoryRegistration.status) : ''
      "
      :documents-status-tag-type="selectedHistoryRegistrationDocumentsStatus?.tagType || 'info'"
      :documents-status-label="selectedHistoryRegistrationDocumentsStatus?.label || ''"
      :documents-status-description="selectedHistoryRegistrationDocumentsStatus?.description || ''"
      @close="closeHistoryDetails"
      @save="handleUpdateSelectedRegistration"
      @withdraw="handleWithdrawSelectedRegistration"
    />

    <AccountCompetitionRegistrationDialog
      :model-value="isRegistrationDialogOpen"
      :stage="selectedStage"
      :participant-options="participantOptions"
      :form="registrationForm"
      :errors="registrationErrors"
      :is-submitting="isSubmitting"
      @close="handleCloseRegistration"
      @submit="handleSubmitRegistration"
      @update-form-field="handleRegistrationFormFieldUpdate"
    />
  </ElCard>
</template>

<script setup>
import { computed, ref, toRef, watch } from 'vue'
import { ElCard, ElEmpty, ElOption, ElSelect, ElTag } from 'element-plus'
import AccountCompetitionRegistrationDetailsDialog from '@/pages/account/components/competition-registrations/AccountCompetitionRegistrationDetailsDialog.vue'
import AccountCompetitionRegistrationDialog from '@/pages/account/components/competition-registrations/AccountCompetitionRegistrationDialog.vue'
import { useAccountCompetitionRegistrations } from '@/pages/account/composables/useAccountCompetitionRegistrations'
import { useTriStateTextSort } from '@/pages/account/composables/useTriStateTextSort'
import {
  formatCompetitionCalendarDateShort,
  formatCompetitionStageLabel,
  getAccountDocumentsAdmissionStatus,
} from '@/pages/account/utils/accountFormatters'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
  initialTarget: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['consume-target'])

const competitionFilter = ref('all')
const statusFilter = ref('all')
const isSubmitting = ref(false)
const selectedHistoryRegistration = ref(null)
const isHistoryDetailsDialogOpen = ref(false)

const {
  ownerSnapshot,
  athleteSnapshots,
  competitionOptions,
  filteredCompetitionRows,
  registrationHistory,
  participantOptions,
  selectedStage,
  availableStagesCount,
  openStagesCount,
  registrationForm,
  registrationErrors,
  isRegistrationDialogOpen,
  openRegistrationDialog,
  closeRegistrationDialog,
  handleRegistrationSubmit,
  handleWithdrawRegistration,
  updateSelectedRegistration,
  getRegistrationStatusLabel,
  getRegistrationStatusTagType,
  formatParticipantName,
} = useAccountCompetitionRegistrations({
  currentUser: toRef(props, 'currentUser'),
})

const { sortKey, toggleSort, getSortState, sortItems } =
  useTriStateTextSort('participantName')

const filteredRows = computed(() =>
  filteredCompetitionRows.value.filter((row) => {
    const matchesCompetition =
      competitionFilter.value === 'all' || row.competitionSlug === competitionFilter.value
    const matchesStatus =
      statusFilter.value === 'all' || row.registrationState.mode === statusFilter.value

    return matchesCompetition && matchesStatus
  }),
)

const sortedRegistrationHistory = computed(() =>
  sortItems(registrationHistory.value, {
    participantName: (record) => formatParticipantName(record),
  }),
)

const selectedHistoryRegistrationDocumentsStatus = computed(() => {
  const registration = selectedHistoryRegistration.value

  if (!registration) {
    return null
  }

  if (registration.participantKind === 'athlete') {
    const athlete = athleteSnapshots.value.find((item) => item.id === registration.participantId)

    if (athlete) {
      return getAccountDocumentsAdmissionStatus(athlete.documents || [])
    }
  }

  return getAccountDocumentsAdmissionStatus(ownerSnapshot.value.documents || [])
})

function handleOpenRegistration(stageId) {
  openRegistrationDialog(stageId)
}

function isRegistrationActionDisabled(row) {
  return row.registrationState.mode !== 'open'
}

function getRegistrationActionTitle(row) {
  if (row.registrationState.mode === 'open') {
    return 'Регистрация на соревнование'
  }

  if (row.registrationState.mode === 'upcoming') {
    return 'Регистрация скоро откроется'
  }

  return 'Регистрация закрыта'
}

function getRegistrationActionLabel(row) {
  if (row.registrationState.mode === 'open') {
    return 'Регистрация'
  }

  if (row.registrationState.mode === 'upcoming') {
    return 'Скоро'
  }

  return 'Закрыта'
}

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

function openHistoryDetails(record) {
  selectedHistoryRegistration.value = record
  isHistoryDetailsDialogOpen.value = true
}

function closeHistoryDetails() {
  isHistoryDetailsDialogOpen.value = false
}

async function handleWithdrawSelectedRegistration() {
  const targetId = selectedHistoryRegistration.value?.id

  if (!targetId) {
    return
  }

  const isWithdrawn = await handleWithdrawRegistration(targetId)

  if (isWithdrawn) {
    closeHistoryDetails()
  }
}

function handleUpdateSelectedRegistration(payload) {
  const targetId = selectedHistoryRegistration.value?.id

  if (!targetId) {
    return
  }

  const patch = {}

  if (payload?.stageId) {
    patch.stageId = payload.stageId
  }

  if (payload?.registrationKind) {
    patch.registrationKind = payload.registrationKind
  }

  if (payload?.status) {
    patch.status = payload.status
  }

  const updatedRegistration = updateSelectedRegistration(targetId, patch)

  if (updatedRegistration) {
    closeHistoryDetails()
  }
}

function handleCloseRegistration() {
  closeRegistrationDialog()
}

function handleSubmitRegistration() {
  isSubmitting.value = true

  try {
    const isSaved = handleRegistrationSubmit()

    if (isSaved) {
      isSubmitting.value = false
    }
  } finally {
    isSubmitting.value = false
  }
}

function handleRegistrationFormFieldUpdate({ field, value }) {
  if (!Object.prototype.hasOwnProperty.call(registrationForm, field)) {
    return
  }

  registrationForm[field] = value
}

watch(
  () => props.initialTarget,
  (nextTarget) => {
    if (!nextTarget?.stageId) {
      return
    }

    openRegistrationDialog(nextTarget.stageId)
    competitionFilter.value = selectedStage.value?.competitionSlug || competitionFilter.value
    statusFilter.value = selectedStage.value?.registrationState.mode || statusFilter.value
    emit('consume-target')
  },
  { immediate: true, deep: true },
)
</script>

<style scoped>
.account-competition-registrations__header-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: stretch;
}

.account-competition-registrations__controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: end;
  min-width: 0;
}

.account-competition-registrations__filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: end;
  min-width: 0;
}

.account-competition-registrations__filters .account__field {
  min-width: 0;
}

.account-competition-registrations__stats {
  display: flex;
  align-items: end;
  gap: 12px;
  white-space: nowrap;
}

.account-competition-registrations__stat-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 18px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.92);
  font-size: 15px;
  font-weight: 900;
  line-height: 1;
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.68),
    0 10px 22px rgb(15 23 42 / 0.05);
}

.account-competition-registrations__stat-tag--open {
  border-color: color-mix(in srgb, #f6b8c1 80%, white);
  background: linear-gradient(180deg, #fff2f4 0%, #ffe7eb 100%);
  color: #ef646f;
}

.account-competition-registrations__stat-tag--available {
  border-color: color-mix(in srgb, #b9d6ff 80%, white);
  background: linear-gradient(180deg, #f6faff 0%, #e9f2ff 100%);
  color: #4490f3;
}

.account-competition-registrations__content {
  display: grid;
  gap: 18px;
  padding: 18px;
}

.account-competition-registrations__section {
  display: grid;
  gap: 12px;
}

.account-competition-registrations__section-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.account-competition-registrations__empty-state {
  display: grid;
  gap: 8px;
  padding: 18px 16px;
  border: 1px dashed color-mix(in srgb, var(--cyan) 24%, white);
  border-radius: 10px;
  background:
    radial-gradient(circle at top, color-mix(in srgb, var(--aqua) 12%, white), transparent 58%),
    linear-gradient(180deg, rgb(246 251 255 / 0.94) 0%, rgb(255 255 255 / 0.84) 100%);
}

.account-competition-registrations__empty-state-title {
  font-family: Oswald, sans-serif;
  font-size: 22px;
  line-height: 1.05;
  text-transform: uppercase;
  color: var(--black);
}

.account-competition-registrations__empty-state-text {
  font-size: 14px;
  line-height: 1.5;
  color: #526072;
}

.account-competition-registrations__registration-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 125px;
  min-height: 38px;
  padding: 8px 14px;
  border: 1px solid #e7edf5;
  border-radius: 10px;
  background-color: var(--button-current-bg, #f5fbfd);
  font-family: inherit;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--button-current-color, #355b66);
  white-space: nowrap;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}

.account-competition-registrations__registration-button:disabled {
  opacity: 1;
  cursor: not-allowed;
}

.account-competition-registrations__registration-button--open {
  --button-current-bg: color-mix(in srgb, var(--aqua) 18%, white);
  --button-current-color: color-mix(in srgb, var(--aqua) 62%, var(--black));
  --button-focus-color: var(--aqua);
}

.account-competition-registrations__registration-button--upcoming {
  --button-current-bg: color-mix(in srgb, var(--cyan) 12%, white);
  --button-current-color: color-mix(in srgb, var(--cyan) 62%, var(--black));
  --button-focus-color: var(--cyan);
}

.account-competition-registrations__registration-button--closed {
  --button-current-bg: color-mix(in srgb, #fff6f2 88%, white);
  --button-current-color: #d76034;
  --button-focus-color: #d76034;
}

.account-competition-registrations__registration-button:hover:not(:disabled) {
  background-color: var(--button-current-bg, var(--button-hover-bg, var(--button-bg)));
}

.account-competition-registrations__registration-button:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px var(--button-focus-ring-inner),
    0 0 0 6px color-mix(in srgb, var(--button-focus-color, var(--cyan)) 28%, transparent);
}

.account__native-table--competition-history {
  table-layout: fixed;
}

.account__native-table--competition-history .account__native-table-cell:not(.account__native-table-cell--primary) {
  text-align: center;
}

.account__native-table--competition-history th:nth-child(1),
.account__native-table--competition-history td:nth-child(1) {
  width: 24%;
}

.account__native-table--competition-history th:nth-child(2),
.account__native-table--competition-history td:nth-child(2) {
  width: 42%;
}

.account__native-table--competition-history th:nth-child(3),
.account__native-table--competition-history td:nth-child(3) {
  width: 18%;
}

.account__native-table--competition-history th:nth-child(4),
.account__native-table--competition-history td:nth-child(4) {
  width: 16%;
}

.account-competition-registrations__history-row--withdrawn {
  background: var(--white);
}

.account-competition-registrations__history-row--withdrawn .account__native-table-cell {
  color: #8b4d38;
}

.account-competition-registrations__nowrap {
  white-space: nowrap;
}

.account__native-table--competition-registrations .account__native-table-cell--center {
  text-align: center;
}

@media (max-width: 1180px) {
  .account-competition-registrations__header-top {
    grid-template-columns: 1fr;
  }

  .account-competition-registrations__controls {
    grid-template-columns: 1fr;
    width: 100%;
  }

  .account-competition-registrations__filters {
    grid-template-columns: 1fr;
  }

  .account-competition-registrations__stats {
    flex-wrap: wrap;
    white-space: normal;
  }
}

@media (max-width: 640px) {
  .account-competition-registrations__content {
    padding: 14px;
  }
}
</style>

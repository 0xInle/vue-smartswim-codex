<template>
  <ElCard class="account__panel account-competition-registrations" shadow="never">
    <div class="account-competition-registrations__header">
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
    </div>

    <div class="account-competition-registrations__content">
      <section class="account-competition-registrations__section">
        <div class="account-competition-registrations__section-head">
          <h3 class="account__panel-title">Заявки</h3>
        </div>

        <div v-if="registrationHistory.length" class="account__native-table-wrap">
          <table class="account__native-table account__native-table--competition-history">
            <thead class="account__native-table-head">
              <tr>
                <th>Соревнование</th>
                <th>Участник</th>
                <th>Тип</th>
                <th>Оплата</th>
                <th>Создана</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="record in registrationHistory"
                :key="record.id"
                class="account__native-table-row"
              >
                <td class="account__native-table-cell account__native-table-cell--primary">
                  <div class="account__table-user">
                    <div class="account__table-primary">{{ record.competitionName }}</div>
                  </div>
                </td>
                <td class="account__native-table-cell">
                  {{ formatParticipantName(record) }}
                </td>
                <td class="account__native-table-cell">
                  {{ formatRegistrationTypeLabel(record.registrationKind) }}
                </td>
                <td class="account__native-table-cell">{{ record.paymentOptionTitle || 'Не выбрано' }}</td>
                <td class="account__native-table-cell">{{ formatShortDate(record.createdAt) }}</td>
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
                <th>Действие</th>
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
                  <ElTag :type="statusTagType(row.registrationState.mode)" effect="light" round>
                    {{ statusLabel(row.registrationState.mode) }}
                  </ElTag>
                </td>
                <td class="account__native-table-cell account__native-table-cell--center">
                  <button
                    type="button"
                    class="account__table-action account__table-action--success btn-reset"
                    :disabled="isRegistrationActionDisabled(row)"
                    :title="getRegistrationActionTitle(row)"
                    @click="handleOpenRegistration(row.id)"
                  >
                    Регистрация
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ElEmpty v-else description="Подходящие соревнования не найдены." />
      </section>
    </div>

    <AccountCompetitionRegistrationDialog
      :model-value="isRegistrationDialogOpen"
      :stage="selectedStage"
      :owner-snapshot="ownerSnapshot"
      :participant-options="participantOptions"
      :payment-options="selectedStagePaymentOptions"
      :form="registrationForm"
      :errors="registrationErrors"
      :is-submitting="isSubmitting"
      @close="handleCloseRegistration"
      @submit="handleSubmitRegistration"
    />
  </ElCard>
</template>

<script setup>
import { computed, ref, toRef, watch } from 'vue'
import { ElCard, ElEmpty, ElOption, ElSelect, ElTag } from 'element-plus'
import AccountCompetitionRegistrationDialog from '@/pages/account/components/AccountCompetitionRegistrationDialog.vue'
import { useAccountCompetitionRegistrations } from '@/pages/account/composables/useAccountCompetitionRegistrations'
import {
  formatCompetitionCalendarDateShort,
  formatCompetitionStageLabel,
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

const {
  ownerSnapshot,
  competitionOptions,
  filteredCompetitionRows,
  registrationHistory,
  participantOptions,
  selectedStage,
  selectedStagePaymentOptions,
  availableStagesCount,
  openStagesCount,
  registrationForm,
  registrationErrors,
  isRegistrationDialogOpen,
  openRegistrationDialog,
  closeRegistrationDialog,
  handleRegistrationSubmit,
  formatParticipantName,
  formatRegistrationTypeLabel,
} = useAccountCompetitionRegistrations({
  currentUser: toRef(props, 'currentUser'),
})

const filteredRows = computed(() =>
  filteredCompetitionRows.value.filter((row) => {
    const matchesCompetition =
      competitionFilter.value === 'all' || row.competitionSlug === competitionFilter.value
    const matchesStatus =
      statusFilter.value === 'all' || row.registrationState.mode === statusFilter.value

    return matchesCompetition && matchesStatus
  }),
)

const hasOpenRegistrations = computed(() =>
  filteredRows.value.some((row) => row.registrationState.mode === 'open'),
)

const testRegistrationStageId = computed(() => {
  if (hasOpenRegistrations.value) {
    return ''
  }

  return filteredRows.value[0]?.id || ''
})

function handleOpenRegistration(stageId) {
  openRegistrationDialog(stageId)
}

function isRegistrationActionDisabled(row) {
  if (row.registrationState.mode === 'open') {
    return false
  }

  return row.id !== testRegistrationStageId.value
}

function getRegistrationActionTitle(row) {
  if (row.registrationState.mode === 'open') {
    return 'Открыть форму регистрации'
  }

  if (row.id === testRegistrationStageId.value) {
    return 'Тестовое открытие формы регистрации'
  }

  return 'Регистрация закрыта'
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

function formatShortDate(value) {
  if (!value) {
    return 'Не указана'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function statusLabel(status) {
  if (status === 'open') {
    return 'Открыто'
  }

  if (status === 'upcoming') {
    return 'Скоро'
  }

  return 'Закрыто'
}

function statusTagType(status) {
  if (status === 'open') {
    return 'success'
  }

  if (status === 'upcoming') {
    return 'warning'
  }

  return 'info'
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
.account-competition-registrations__header {
  display: grid;
  gap: 18px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--aqua) 14%, transparent);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(247, 250, 255, 0.72));
}

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
  .account-competition-registrations__header {
    padding-inline: 14px;
  }

  .account-competition-registrations__content {
    padding: 14px;
  }
}
</style>

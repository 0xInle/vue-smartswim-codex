<template>
  <ElCard class="account__panel" shadow="never">
    <template #header>
      <div class="account__panel-head">
        <div>
          <p class="account__panel-eyebrow">Записи</p>
          <h3 v-if="mode !== 'trainer'" class="account__panel-title">Мои записи к тренерам</h3>
          <h3 v-if="mode === 'trainer'" class="account__panel-title">Мои заявки</h3>
        </div>
        <div class="account__panel-actions">
          <ElTag type="primary" effect="light" round>{{ total }} всего</ElTag>
        </div>
      </div>
    </template>

    <div v-if="isLoading && !bookings.length" class="account__loading-state">
      Загружаем ваши записи...
    </div>

    <ElTable
      v-else-if="bookings.length"
      class="account__consultations-table"
      :data="bookings"
      row-key="id"
      border
      stripe
      empty-text="Записей пока нет."
    >
      <ElTableColumn label="Тренер" min-width="220">
        <template #default="{ row }">
          <div class="account__table-primary">{{ row.trainerName }}</div>
        </template>
      </ElTableColumn>

      <ElTableColumn label="Дата и время" min-width="180">
        <template #default="{ row }">
          {{ formatTrainerBookingSlot(row) }}
        </template>
      </ElTableColumn>

      <ElTableColumn label="Комментарий" min-width="220">
        <template #default="{ row }">
          {{ row.comment || 'Без комментария' }}
        </template>
      </ElTableColumn>

      <ElTableColumn label="Статус" min-width="156" align="center">
        <template #default="{ row }">
          <ElTag :type="trainerBookingStatusType(row.status)" effect="light" round>
            {{ formatTrainerBookingStatus(row.status) }}
          </ElTag>
        </template>
      </ElTableColumn>

      <ElTableColumn
        v-if="canUpdateStatus"
        label="Действие"
        min-width="176"
        align="center"
      >
        <template #default="{ row }">
          <div class="account__table-actions">
            <button
              v-if="isTrainerBookingNewStatus(row.status)"
              type="button"
              class="account__table-action account__table-action--edit btn-reset"
              @click="$emit('update-status', { id: row.id, status: trainerBookingStatusInWork })"
            >
              В работу
            </button>
            <button
              v-if="!isTrainerBookingProcessedStatus(row.status)"
              type="button"
              class="account__table-action account__table-action--success btn-reset"
              @click="$emit('update-status', { id: row.id, status: trainerBookingStatusProcessed })"
            >
              Обработана
            </button>
          </div>
        </template>
      </ElTableColumn>

      <ElTableColumn label="Создана" min-width="116" align="center">
        <template #default="{ row }">
          {{ formatCompactDateTime(row.createdAt) }}
        </template>
      </ElTableColumn>
    </ElTable>

    <ElEmpty v-else description="Записей к тренерам пока нет." />
  </ElCard>
</template>

<script setup>
import { ElCard, ElEmpty, ElTable, ElTableColumn, ElTag } from 'element-plus'
import { TRAINER_BOOKING_STATUS } from '@/pages/account/utils/accountConstants'
import {
  formatCompactDateTime,
  formatTrainerBookingSlot,
  formatTrainerBookingStatus,
  trainerBookingStatusType,
} from '@/pages/account/utils/accountFormatters'

defineProps({
  bookings: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  mode: {
    type: String,
    default: 'user',
  },
  canUpdateStatus: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update-status'])

const trainerBookingStatusInWork = TRAINER_BOOKING_STATUS.IN_WORK
const trainerBookingStatusProcessed = TRAINER_BOOKING_STATUS.PROCESSED

function isTrainerBookingNewStatus(status) {
  return status === TRAINER_BOOKING_STATUS.NEW
}

function isTrainerBookingProcessedStatus(status) {
  return [
    TRAINER_BOOKING_STATUS.PROCESSED,
    TRAINER_BOOKING_STATUS.COMPLETED,
    TRAINER_BOOKING_STATUS.CANCELLED,
  ].includes(status)
}
</script>

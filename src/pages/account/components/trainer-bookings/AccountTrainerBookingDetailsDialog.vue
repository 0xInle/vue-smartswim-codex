<template>
  <ElDialog
    :model-value="modelValue"
    width="760px"
    destroy-on-close
    append-to-body
    align-center
    class="account__dialog account-trainer-booking-details"
    title="Детали обращения к тренеру"
    :close-icon="Close"
    @closed="emit('close')"
    @update:model-value="!$event && emit('close')"
  >
    <div v-if="booking" class="account-trainer-booking-details__content">
      <div class="account-trainer-booking-details__grid">
        <div class="account-trainer-booking-details__section account-trainer-booking-details__section--wide">
          <div class="account-trainer-booking-details__card-head">
            <span class="account-trainer-booking-details__label">Обращение</span>
            <ElTag :type="statusTagType" effect="light" round>
              {{ statusLabel }}
            </ElTag>
          </div>

          <span class="account-trainer-booking-details__meta">
            Тренер: {{ booking.trainerName || 'Не указан' }}
          </span>
          <span class="account-trainer-booking-details__meta">
            Запись создана: {{ formatCompactDateTime(booking.createdAt) }}
          </span>
        </div>

        <div class="account-trainer-booking-details__pair">
          <div class="account-trainer-booking-details__section">
            <span class="account-trainer-booking-details__label">Клиент</span>
            <span class="account-trainer-booking-details__meta">
              Телефон: {{ booking.phone || 'Не указан' }}
            </span>
            <span class="account-trainer-booking-details__meta">
              Email: {{ booking.email || 'Не указан' }}
            </span>
          </div>

          <div class="account-trainer-booking-details__section">
            <span class="account-trainer-booking-details__label">Время консультации</span>
            <span class="account-trainer-booking-details__meta">
              Дата консультации: {{ formatConsultationDate(booking.preferredDate) }}
            </span>
            <span class="account-trainer-booking-details__meta">
              Время консультации: {{ booking.preferredTime || 'Не указано' }}
            </span>
          </div>
        </div>

        <div class="account-trainer-booking-details__section account-trainer-booking-details__section--wide">
          <span class="account-trainer-booking-details__label">Комментарий</span>
          <strong class="account-trainer-booking-details__comment">
            {{ booking.comment || 'Без комментария' }}
          </strong>
        </div>
      </div>

      <div class="account-trainer-booking-details__actions">
        <button
          v-if="canUpdateStatus && isTrainerBookingNewStatus(booking.status)"
          type="button"
          class="account__table-action account__table-action--edit btn-reset"
          @click="emit('update-status', trainerBookingStatusInWork)"
        >
          В работу
        </button>
        <button
          v-if="canUpdateStatus && !isTrainerBookingProcessedStatus(booking.status)"
          type="button"
          class="account__table-action account__table-action--success btn-reset"
          @click="emit('update-status', trainerBookingStatusProcessed)"
        >
          Обработана
        </button>
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset"
          @click="emit('close')"
        >
          Закрыть
        </button>
      </div>
    </div>
  </ElDialog>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { ElDialog, ElTag } from 'element-plus'
import {
  TRAINER_BOOKING_STATUS,
} from '@/pages/account/utils/accountConstants'
import {
  formatCompactDateTime,
  formatConsultationDate,
  formatTrainerBookingStatus,
  trainerBookingStatusType,
} from '@/pages/account/utils/accountFormatters'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  booking: {
    type: Object,
    default: null,
  },
  canUpdateStatus: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'update-status'])
const trainerBookingStatusInWork = TRAINER_BOOKING_STATUS.IN_WORK
const trainerBookingStatusProcessed = TRAINER_BOOKING_STATUS.PROCESSED

const statusLabel = computed(() => formatTrainerBookingStatus(props.booking?.status))
const statusTagType = computed(() => trainerBookingStatusType(props.booking?.status))

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

<style scoped>
.account-trainer-booking-details__content {
  display: grid;
  gap: 14px;
  padding-inline: 0;
}

.account-trainer-booking-details__grid {
  display: grid;
  gap: 12px;
  padding: 0;
}

.account-trainer-booking-details__section--wide {
  grid-column: 1 / -1;
}

.account-trainer-booking-details__pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.account-trainer-booking-details__section {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.9);
}

.account-trainer-booking-details__card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account-trainer-booking-details__label {
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.account-trainer-booking-details__comment {
  white-space: pre-line;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--black);
}

.account-trainer-booking-details__meta {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  color: #64748b;
}

.account-trainer-booking-details__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 0 14px;
}

@media (max-width: 760px) {
  .account-trainer-booking-details__content {
    gap: 12px;
  }

  .account-trainer-booking-details__pair {
    grid-template-columns: 1fr;
  }
}
</style>

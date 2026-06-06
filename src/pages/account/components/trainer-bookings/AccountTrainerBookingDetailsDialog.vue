<template>
  <ElDialog
    :model-value="modelValue"
    width="760px"
    destroy-on-close
    append-to-body
    align-center
    class="account__dialog account-trainer-booking-details"
    title="Детали заявки"
    :close-icon="Close"
    @closed="handleClosed"
    @update:model-value="!$event && emit('close')"
  >
    <form v-if="booking" class="account__dialog-form" @submit.prevent="submitForm">
      <div class="account-trainer-booking-details__content">
        <div class="account-trainer-booking-details__grid">
          <div class="account-trainer-booking-details__section account-trainer-booking-details__section--wide">
            <div class="account-trainer-booking-details__summary">
              <div class="account-trainer-booking-details__summary-copy">
                <strong class="account-trainer-booking-details__value">
                  {{ fullName }}
                </strong>
                <span class="account-trainer-booking-details__meta">
                  Телефон: {{ booking.phone || 'Не указан' }}
                </span>
                <span class="account-trainer-booking-details__meta">
                  Email: {{ booking.email || 'Не указан' }}
                </span>
                <span class="account-trainer-booking-details__meta">
                  Дата: {{ formatConsultationDate(booking.preferredDate) }}
                </span>
                <span class="account-trainer-booking-details__meta">
                  Время: {{ booking.preferredTime || 'Не указано' }}
                </span>
                <span class="account-trainer-booking-details__meta">
                  Создана: {{ formatCompactDateTime(booking.createdAt) }}
                </span>
              </div>

              <div class="account-trainer-booking-details__status-control">
                <ElSelect
                  v-if="canUpdateStatus && isEditableStatus"
                  v-model="form.status"
                  class="account__select account-trainer-booking-details__select"
                  popper-class="account__select-popper account__select-popper--full"
                  placeholder="Выберите статус"
                >
                  <ElOption
                    v-for="option in editableStatusOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ElSelect>
                <ElTag
                  v-else
                  :type="statusTagType"
                  effect="light"
                  round
                  class="account-trainer-booking-details__status-badge"
                >
                  {{ statusLabel }}
                </ElTag>
              </div>
            </div>
          </div>

          <div class="account-trainer-booking-details__section account-trainer-booking-details__section--wide">
            <div v-if="bookingDetailsText" class="account-trainer-booking-details__details">
              <span class="account__field-label">Данные пловца</span>
              <pre class="account-trainer-booking-details__details-text">{{ bookingDetailsText }}</pre>
            </div>

            <label class="account__field account-trainer-booking-details__field">
              <span class="account__field-label">Комментарий</span>
              <textarea
                v-model.trim="form.comment"
                class="account__input account-trainer-booking-details__textarea"
                rows="4"
                placeholder="Добавьте комментарий по заявке"
              ></textarea>
            </label>

            <div v-if="savedComments.length" class="account-trainer-booking-details__comments">
              <span class="account-trainer-booking-details__meta">История комментариев</span>
              <p
                v-for="(comment, index) in savedComments"
                :key="`${index}-${comment}`"
                class="account-trainer-booking-details__comment"
              >
                - {{ comment }}
              </p>
            </div>

            <ElAlert
              v-if="errorMessage"
              :title="errorMessage"
              type="warning"
              show-icon
              :closable="false"
              class="account-trainer-booking-details__alert"
            />
          </div>
        </div>

        <div class="account-trainer-booking-details__actions">
          <button
            type="button"
            class="account__table-action account__table-action--ghost btn-reset"
            @click="emit('close')"
          >
            Закрыть
          </button>
          <button
            v-if="canUpdateStatus && isEditableStatus"
            type="submit"
            class="account__table-action account__table-action--edit btn-reset"
            :disabled="isSaving"
          >
            {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </form>
  </ElDialog>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { computed, reactive, watch } from 'vue'
import { ElAlert, ElDialog, ElOption, ElSelect, ElTag } from 'element-plus'
import { TRAINER_BOOKING_STATUS } from '@/pages/account/utils/accountConstants'
import {
  formatCompactDateTime,
  formatConsultationDate,
  formatTrainerBookingClientName,
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
  errorMessage: {
    type: String,
    default: '',
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  canUpdateStatus: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'closed', 'save'])
const COMMENT_SEPARATOR = '\n\n'
const editableStatusOptions = [
  { value: TRAINER_BOOKING_STATUS.NEW, label: 'Новая' },
  { value: TRAINER_BOOKING_STATUS.IN_WORK, label: 'В работе' },
  { value: TRAINER_BOOKING_STATUS.COMPLETED, label: 'Завершена' },
]
const editableStatusValues = new Set(editableStatusOptions.map((option) => option.value))
const form = reactive({
  status: TRAINER_BOOKING_STATUS.NEW,
  comment: '',
})

const isEditableStatus = computed(() => editableStatusValues.has(form.status))
const fullName = computed(() => formatTrainerBookingClientName(props.booking))
const statusLabel = computed(() => formatTrainerBookingStatus(form.status))
const statusTagType = computed(() => trainerBookingStatusType(form.status))
const savedComments = computed(() => parseSavedComments(props.booking?.comment))
const bookingDetailsText = computed(() => formatBookingDetailsText(props.booking?.comment))

watch(
  () => [props.modelValue, props.booking],
  () => {
    if (!props.modelValue || !props.booking) {
      return
    }

    form.status = normalizeEditableStatus(props.booking.status)
    form.comment = ''
  },
  { immediate: true },
)

function normalizeEditableStatus(status) {
  if (editableStatusValues.has(status)) {
    return status
  }

  if (
    status === TRAINER_BOOKING_STATUS.CONTACTED ||
    status === TRAINER_BOOKING_STATUS.CONFIRMED
  ) {
    return TRAINER_BOOKING_STATUS.IN_WORK
  }

  if (
    status === TRAINER_BOOKING_STATUS.PROCESSED ||
    status === TRAINER_BOOKING_STATUS.CANCELLED
  ) {
    return TRAINER_BOOKING_STATUS.COMPLETED
  }

  return TRAINER_BOOKING_STATUS.NEW
}

function submitForm() {
  if (!props.booking) {
    return
  }

  emit('save', {
    bookingId: props.booking.id,
    status: form.status,
    comment: buildNextCommentValue(),
  })
}

function parseSavedComments(value) {
  return String(value || '')
    .split(/\n{2,}/)
    .map((comment) => comment.trim())
    .filter((comment) => Boolean(comment) && !comment.startsWith('Данные пловца:'))
}

function formatBookingDetailsText(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue.startsWith('Данные пловца:')) {
    return ''
  }

  return normalizedValue.split(/\n{2,}/)[0] || ''
}

function buildNextCommentValue() {
  const nextComment = form.comment.trim()
  const currentDetails = bookingDetailsText.value

  if (!nextComment) {
    return [currentDetails, ...savedComments.value].filter(Boolean).join(COMMENT_SEPARATOR)
  }

  return [currentDetails, ...savedComments.value, nextComment].filter(Boolean).join(COMMENT_SEPARATOR)
}

function handleClosed() {
  form.status = TRAINER_BOOKING_STATUS.NEW
  form.comment = ''
  emit('closed')
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

.account-trainer-booking-details__summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 50%);
  align-items: start;
  gap: 18px;
}

.account-trainer-booking-details__summary-copy {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.account-trainer-booking-details__status-control {
  display: flex;
  justify-content: flex-end;
  min-width: 0;
}

.account-trainer-booking-details__status-badge.el-tag {
  border-radius: 5px;
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

.account-trainer-booking-details__value {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.35;
  color: var(--black);
}

.account-trainer-booking-details__field {
  margin-top: 10px;
}

.account-trainer-booking-details__details {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 18%, white);
  border-radius: 10px;
  background: rgb(246 251 255 / 0.86);
}

.account-trainer-booking-details__details-text {
  margin: 0;
  white-space: pre-wrap;
  font-family: Nunito, sans-serif;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.55;
  color: var(--black);
}

.account-trainer-booking-details__select {
  width: 100%;
  min-width: 0;
}

.account-trainer-booking-details__textarea {
  min-height: 112px;
  resize: none;
  line-height: 1.5;
  padding-top: 11px;
}

.account-trainer-booking-details__comments {
  display: grid;
  gap: 6px;
}

.account-trainer-booking-details__comment {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.45;
  color: var(--black);
  white-space: pre-wrap;
}

.account-trainer-booking-details__alert {
  margin-top: 8px;
}

.account-trainer-booking-details__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 0 14px;
}

.account-trainer-booking-details__observer-note {
  flex: 1 1 280px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
}

@media (max-width: 760px) {
  .account-trainer-booking-details__content {
    gap: 12px;
  }

  .account-trainer-booking-details__summary {
    grid-template-columns: 1fr;
  }

  .account-trainer-booking-details__status-control {
    justify-content: stretch;
    order: -1;
  }

  .account-trainer-booking-details__textarea {
    min-height: 96px;
  }
}
</style>

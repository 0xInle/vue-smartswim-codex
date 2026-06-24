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
    @update:model-value="handleModelValueUpdate"
  >
    <form v-if="booking" class="account__dialog-form" @submit.prevent="submitForm">
      <div class="account-trainer-booking-details__content">
        <div class="account-trainer-booking-details__grid">
          <div class="account-trainer-booking-details__section account-trainer-booking-details__section--wide account-trainer-booking-details__section--facts">
            <div class="account-trainer-booking-details__facts">
              <article
                v-for="fact in bookingFacts"
                :key="fact.label"
                class="account-trainer-booking-details__fact"
              >
                <span class="account-trainer-booking-details__fact-label">{{ fact.label }}:</span>
                <span class="account-trainer-booking-details__fact-value">{{ fact.value }}</span>
              </article>
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

          <div class="account-trainer-booking-details__section account-trainer-booking-details__section--wide">
            <div class="account-trainer-booking-details__comments">
              <span class="account-trainer-booking-details__block-label">Комментарий</span>
              <template v-if="savedComments.length">
                <div class="account-trainer-booking-details__comment-list">
                  <p
                    v-for="(comment, index) in savedComments"
                    :key="`${index}-${comment}`"
                    class="account-trainer-booking-details__comment"
                  >
                    {{ comment }}
                  </p>
                </div>
              </template>
              <p v-else class="account-trainer-booking-details__comment account-trainer-booking-details__comment--empty">
                Комментариев нет.
              </p>
            </div>

            <label v-if="canUpdateStatus" class="account__field account-trainer-booking-details__field">
              <span class="account__field-label">Комментарий администратора</span>
              <textarea
                v-model.trim="form.comment"
                class="account__input account-trainer-booking-details__textarea"
                rows="4"
                placeholder="Добавьте комментарий по заявке"
              ></textarea>
            </label>

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
            :disabled="isSaving"
            @click="handleClose"
          >
            Закрыть
          </button>
          <button
            v-if="canUpdateStatus && isEditableStatus"
            type="submit"
            class="account__table-action account__table-action--edit btn-reset"
            :disabled="isSaving"
            :aria-busy="isSaving"
          >
            <span v-if="isSaving" class="account__button-spinner" aria-hidden="true"></span>
            <span :class="{ 'account__button-label--loading': isSaving }">Сохранить</span>
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
const statusLabel = computed(() => formatTrainerBookingStatus(form.status))
const statusTagType = computed(() => trainerBookingStatusType(form.status))
const parsedComment = computed(() => parseBookingComment(props.booking?.comment))
const savedComments = computed(() => parsedComment.value.comments)
const bookingFacts = computed(() => buildBookingFacts(props.booking, parsedComment.value.details))

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
  if (!props.booking || !props.canUpdateStatus) {
    return
  }

  emit('save', {
    bookingId: props.booking.id,
    status: form.status,
    comment: buildNextCommentValue(),
  })
}

function parseBookingComment(value) {
  const sections = String(value || '')
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean)

  const detailsSection = sections.find((section) => section.startsWith('Данные пловца:')) || ''
  const details = parseDetailsSection(detailsSection)
  const comments = sections
    .filter((section) => section !== detailsSection)
    .map((section) => normalizeCommentSection(section))
    .filter(Boolean)

  return {
    details,
    comments,
    detailsSection,
  }
}

function parseDetailsSection(section = '') {
  if (!section) {
    return []
  }

  return section
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1)
    .map((line) => {
      const match = line.match(/^([^:]+):\s*(.*)$/)

      if (!match) {
        return null
      }

      return {
        label: match[1].trim(),
        value: match[2].trim() || 'Не указано',
      }
    })
    .filter(Boolean)
}

function buildBookingFacts(booking, detailItems = []) {
  const facts = [
    { label: 'ФИО спортсмена', value: formatTrainerBookingClientName(booking) },
    { label: 'ФИО тренера', value: booking?.trainerName || 'Не указан' },
    { label: 'Телефон', value: booking?.phone || 'Не указан' },
    { label: 'Email', value: booking?.email || 'Не указан' },
    { label: 'Дата', value: formatConsultationDate(booking?.preferredDate) },
    { label: 'Время', value: booking?.preferredTime || 'Не указано' },
    { label: 'Создана', value: formatCompactDateTime(booking?.createdAt) },
  ]

  const existingLabels = new Set(facts.map((fact) => fact.label))

  detailItems.forEach((item) => {
    if (!item?.label || existingLabels.has(item.label)) {
      return
    }

    facts.push({
      label: item.label,
      value: item.value || 'Не указано',
    })
    existingLabels.add(item.label)
  })

  return facts
}

function buildNextCommentValue() {
  const nextComment = form.comment.trim()
  const currentDetails = parsedComment.value.detailsSection

  if (!nextComment) {
    return [currentDetails, ...savedComments.value].filter(Boolean).join(COMMENT_SEPARATOR)
  }

  return [currentDetails, ...savedComments.value, nextComment].filter(Boolean).join(COMMENT_SEPARATOR)
}

function normalizeCommentSection(section = '') {
  const lines = String(section || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) {
    return ''
  }

  if (lines[0] === 'Комментарий пользователя:' || lines[0] === 'Комментарий:') {
    return lines.slice(1).join(' ').trim()
  }

  return lines.join(' ')
}

function handleClose() {
  emit('close')
}

function handleModelValueUpdate(value) {
  if (!value) {
    emit('close')
  }
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

.account-trainer-booking-details__section--facts {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  column-gap: 16px;
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

.account-trainer-booking-details__facts {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}

.account-trainer-booking-details__fact {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: baseline;
  min-width: 0;
}

.account-trainer-booking-details__fact-label {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0;
  text-transform: none;
  color: #64748b;
}

.account-trainer-booking-details__fact-value {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  color: #64748b;
}

.account-trainer-booking-details__status-control {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
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
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  color: #64748b;
  white-space: pre-wrap;
}

.account-trainer-booking-details__comment--empty {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  color: #64748b;
}

.account-trainer-booking-details__block-label {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0;
  text-transform: none;
  color: #64748b;
}

.account-trainer-booking-details__field {
  margin-top: 10px;
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

.account-trainer-booking-details__comment-list {
  display: grid;
  gap: 8px;
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

  .account-trainer-booking-details__section--facts {
    grid-template-columns: 1fr;
  }

  .account-trainer-booking-details__status-control {
    justify-content: stretch;
    order: -1;
    grid-column: auto;
    grid-row: auto;
  }

  .account-trainer-booking-details__textarea {
    min-height: 96px;
  }
}
</style>

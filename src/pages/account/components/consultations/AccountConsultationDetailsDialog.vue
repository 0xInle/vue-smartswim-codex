<template>
  <ElDialog
    :model-value="modelValue"
    width="680px"
    destroy-on-close
    append-to-body
    align-center
    class="account__dialog account-consultation-details"
    title="Обработка заявки"
    :close-icon="Close"
    @closed="handleClosed"
    @update:model-value="!$event && emit('close')"
  >
    <form class="account__dialog-form account-consultation-details__form" @submit.prevent="submitForm">
      <div v-if="request" class="account-consultation-details__grid">
        <div class="account-consultation-details__card account-consultation-details__card--wide">
          <div class="account-consultation-details__card-head">
            <span class="account-consultation-details__label">Заявка</span>
            <ElTag :type="statusTagType" effect="light" round>
              {{ statusLabel }}
            </ElTag>
          </div>

          <strong class="account-consultation-details__value">
            {{ fullName }}
          </strong>
          <div class="account-consultation-details__facts">
            <span class="account-consultation-details__fact">
              Телефон: {{ request.phone || 'Не указан' }}
            </span>
            <span class="account-consultation-details__fact">
              Выбранное время: {{ selectedSlotLabel }}
            </span>
            <span class="account-consultation-details__fact">
              Получена: {{ receivedAtLabel }}
            </span>
          </div>

          <div v-if="savedCallbackTimeLabel" class="account-consultation-details__facts">
            <span class="account-consultation-details__fact">
              Перезвонить: {{ savedCallbackTimeLabel }}
            </span>
          </div>

          <ElAlert
            v-if="errorMessage"
            :title="errorMessage"
            type="warning"
            show-icon
            :closable="false"
            class="account-consultation-details__alert"
          />

          <div class="account-consultation-details__inline-fields">
            <label class="account__field account-consultation-details__field">
              <span class="account__field-label">Статус заявки</span>
              <ElSelect
                v-model="form.status"
                class="account__select account-consultation-details__select"
                popper-class="account__select-popper account__select-popper--full"
                placeholder="Выберите статус"
              >
                <ElOption
                  v-for="option in statusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </label>

            <label v-if="isCallbackStatus" class="account__field account-consultation-details__field">
              <span class="account__field-label">Время повторного звонка</span>
              <ElSelect
                v-model="form.callbackTime"
                class="account__select account-consultation-details__select"
                popper-class="account__select-popper account__select-popper--compact"
                placement="top-start"
                filterable
                allow-create
                default-first-option
                clearable
                placeholder="Выберите или введите время"
              >
                <ElOption
                  v-for="time in callbackTimeOptions"
                  :key="time"
                  :label="time"
                  :value="time"
                />
              </ElSelect>
            </label>
          </div>

          <label
            class="account__field account-consultation-details__field account-consultation-details__comment-field"
          >
            <span class="account__field-label">Новый комментарий</span>
            <textarea
              v-model.trim="form.comment"
              class="account__input account-consultation-details__textarea"
              rows="4"
              placeholder="Добавьте заметку по звонку или заявке"
            ></textarea>
          </label>

          <div v-if="savedComments.length" class="account-consultation-details__comments">
            <span class="account-consultation-details__fact">Комментарий:</span>
            <p
              v-for="(comment, index) in savedComments"
              :key="`${index}-${comment}`"
              class="account-consultation-details__comment"
            >
              - {{ comment }}
            </p>
          </div>
        </div>
      </div>

      <div class="account__dialog-actions">
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset"
          @click="handleCancel"
        >
          Отмена
        </button>
        <button type="submit" class="account__submit btn-reset" :disabled="isSaving || !request">
          {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </form>
  </ElDialog>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { computed, reactive, watch } from 'vue'
import { ElAlert, ElDialog, ElOption, ElSelect, ElTag } from 'element-plus'
import {
  consultationStatusType,
  formatCompactDateTime,
  formatConsultationFullName,
  formatConsultationStatus,
  formatConsultationSlot,
} from '@/pages/account/utils/accountFormatters'
import { CONSULTATION_STATUS } from '@/pages/account/utils/accountConstants'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  request: {
    type: Object,
    default: null,
  },
  statusOptions: {
    type: Array,
    required: true,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'closed', 'save'])
const COMMENT_SEPARATOR = '\n\n'

const form = reactive({
  status: CONSULTATION_STATUS.NEW,
  callbackTime: '',
  comment: '',
})

const fullName = computed(() => formatConsultationFullName(props.request))
const selectedSlotLabel = computed(() => formatConsultationSlot(props.request))
const receivedAtLabel = computed(() => formatCompactDateTime(props.request?.createdAt))
const statusLabel = computed(() => formatConsultationStatus(form.status))
const statusTagType = computed(() => consultationStatusType(form.status))
const isCallbackStatus = computed(() => form.status === CONSULTATION_STATUS.CALL_BACK)
const callbackTimeOptions = computed(() => buildCallbackTimeOptions())
const savedCallbackTimeLabel = computed(() => props.request?.callbackTime || '')
const savedComments = computed(() => parseSavedComments(props.request?.comment))

watch(
  () => [props.modelValue, props.request],
  () => {
    if (!props.modelValue || !props.request) {
      return
    }

    form.status = props.request.status || CONSULTATION_STATUS.NEW
    form.callbackTime = props.request.callbackTime || ''
    form.comment = ''
  },
  { immediate: true },
)

function submitForm() {
  if (!props.request) {
    return
  }

  emit('save', {
    requestId: props.request.id,
    status: form.status,
    callbackTime: isCallbackStatus.value ? form.callbackTime.trim() : '',
    comment: buildNextCommentValue(),
  })
}

function resetForm() {
  form.status = CONSULTATION_STATUS.NEW
  form.callbackTime = ''
  form.comment = ''
}

function handleCancel() {
  emit('close')
}

function handleClosed() {
  resetForm()
  emit('closed')
}

function parseSavedComments(value) {
  return String(value || '')
    .split(/\n{2,}/)
    .map((comment) => comment.trim())
    .filter(Boolean)
}

function buildNextCommentValue() {
  const nextComment = form.comment.trim()

  if (!nextComment) {
    return savedComments.value.join(COMMENT_SEPARATOR)
  }

  return [...savedComments.value, nextComment].join(COMMENT_SEPARATOR)
}

function buildCallbackTimeOptions() {
  const options = []

  for (let hours = 8; hours <= 21; hours += 1) {
    options.push(`${String(hours).padStart(2, '0')}:00`)
    options.push(`${String(hours).padStart(2, '0')}:30`)
  }

  options.push('22:00')

  return options
}
</script>

<style scoped>
.account-consultation-details__grid {
  display: grid;
  gap: 14px;
}

.account-consultation-details__card {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.92);
}

.account-consultation-details__card--wide {
  grid-column: 1 / -1;
}

.account-consultation-details__card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account-consultation-details__label {
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.account-consultation-details__value {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.35;
  color: var(--black);
}

.account-consultation-details__facts {
  display: grid;
  gap: 4px;
}

.account-consultation-details__fact {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  color: #64748b;
}

.account-consultation-details__comments {
  display: grid;
  gap: 6px;
  margin-top: 4px;
}

.account-consultation-details__comment {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.45;
  color: var(--black);
  white-space: pre-wrap;
}

.account-consultation-details__alert {
  margin-top: 8px;
}

.account-consultation-details__comment-field {
  margin-top: 12px;
}

.account-consultation-details__field {
  margin-top: 10px;
}

.account-consultation-details__inline-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.account-consultation-details__select {
  width: 100%;
}

:deep(.account__select-popper--compact .el-select-dropdown__wrap),
:deep(.account__select-popper--compact .el-scrollbar__wrap) {
  max-height: 180px !important;
}

:deep(.account__select-popper--compact .el-scrollbar) {
  max-height: 180px !important;
}

.account-consultation-details__textarea {
  min-height: 112px;
  resize: none;
  line-height: 1.5;
  padding-top: 11px;
}

@media (max-width: 760px) {
  .account-consultation-details__inline-fields {
    grid-template-columns: 1fr;
  }

  .account-consultation-details__textarea {
    min-height: 96px;
  }
}
</style>

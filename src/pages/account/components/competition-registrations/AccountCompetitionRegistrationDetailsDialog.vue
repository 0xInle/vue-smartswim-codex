<template>
  <ElDialog
    :model-value="modelValue"
    width="720px"
    destroy-on-close
    append-to-body
    align-center
    class="account__dialog account-competition-registration-details"
    title="Детали заявки"
    :close-icon="Close"
    @closed="emit('close')"
    @update:model-value="!$event && emit('close')"
  >
    <div v-if="registration" class="account-competition-registration-details__content">
      <div class="account-competition-registration-details__grid">
        <div class="account-competition-registration-details__card account-competition-registration-details__card--wide">
          <div class="account-competition-registration-details__card-head">
            <span class="account-competition-registration-details__label">Соревнование</span>
            <ElSelect
              v-if="canEditStatus"
              v-model="form.status"
              class="account__select account-competition-registration-details__status-select"
              popper-class="account__select-popper"
              placeholder="Выберите статус"
            >
              <ElOption
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
            <ElTag v-else :type="statusTagType" effect="light" round>
              {{ statusLabel }}
            </ElTag>
          </div>
          <template v-if="canEditStage">
            <ElSelect
              v-model="form.stageId"
              class="account__select"
              popper-class="account__select-popper"
              placeholder="Выберите этап"
            >
              <ElOption
                v-for="option in stageOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </template>
          <template v-else>
            <strong class="account-competition-registration-details__value">
              {{ registration.competitionName || 'Соревнование не указано' }}
            </strong>
          </template>
          <span class="account-competition-registration-details__meta">
            {{ selectedStageLabel }}
          </span>
          <span class="account-competition-registration-details__meta">
            Дата: {{ competitionDateLabel }}
          </span>
          <span class="account-competition-registration-details__meta">
            Регистрация: {{ competitionWindowLabel }}
          </span>
        </div>

        <div
          v-if="lifecycleLabel || lifecycleDescription || lifecycleNextAction || registrationKindLabel || registration.teamName || registration.seedTime"
          class="account-competition-registration-details__card account-competition-registration-details__card--wide account-competition-registration-details__card--lifecycle"
        >
          <div class="account-competition-registration-details__card-head">
            <span class="account-competition-registration-details__label">Статус заявки</span>
          </div>
          <strong
            v-if="lifecycleDescription || lifecycleLabel"
            class="account-competition-registration-details__value"
          >
            {{ lifecycleDescription || lifecycleLabel }}
          </strong>
          <span
            v-if="lifecycleNextAction"
            class="account-competition-registration-details__meta account-competition-registration-details__meta--stacked"
          >
            Следующий шаг: {{ lifecycleNextAction }}
          </span>
          <span
            v-if="lifecycleResponsibleLabel"
            class="account-competition-registration-details__meta"
          >
            Ответственный: {{ lifecycleResponsibleLabel }}
          </span>
          <span
            v-if="lifecycleBlocksAdmission"
            class="account-competition-registration-details__meta account-competition-registration-details__meta--attention"
          >
            Блокирует допуск до решения вопроса.
          </span>
          <span class="account-competition-registration-details__meta account-competition-registration-details__meta--stacked">
            Тип заявки: {{ registrationKindLabel }}
          </span>
          <template v-if="canEditRegistrationKind">
            <ElSelect
              v-model="form.registrationKind"
              class="account__select"
              popper-class="account__select-popper"
            >
              <ElOption
                v-for="option in registrationKindOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </template>
          <template v-else>
            <strong class="account-competition-registration-details__value">
              {{ registrationKindLabel }}
            </strong>
          </template>
          <span class="account-competition-registration-details__meta">
            {{ registration.participantKind === 'athlete' ? 'Заявка спортсмена' : 'Заявка пользователя' }}
          </span>
          <span v-if="registration.teamName" class="account-competition-registration-details__meta">
            Команда: {{ registration.teamName }}
          </span>
          <span v-if="registration.seedTime" class="account-competition-registration-details__meta">
            Ориентир: {{ registration.seedTime }}
          </span>
        </div>

        <div class="account-competition-registration-details__pair">
          <div class="account-competition-registration-details__card account-competition-registration-details__card--wide account-competition-registration-details__card--payment">
            <div class="account-competition-registration-details__card-head">
              <span class="account-competition-registration-details__label">Оплата</span>
              <ElTag :type="paymentStatusTagType" effect="light" round>
                {{ paymentStatusLabel }}
              </ElTag>
            </div>
            <strong
              v-if="paymentStatusDescription"
              class="account-competition-registration-details__value"
            >
              {{ paymentStatusDescription }}
            </strong>
            <span
              v-if="paymentMvpNotice"
              class="account-competition-registration-details__meta account-competition-registration-details__meta--attention"
            >
              {{ paymentMvpNotice }}
            </span>
            <div
              v-if="paymentFlowSteps.length"
              class="account-competition-registration-details__payment-flow"
              aria-label="Будущий сценарий оплаты ЮKassa"
            >
              <span
                v-for="step in paymentFlowSteps"
                :key="step.key"
                class="account-competition-registration-details__payment-flow-step"
                :class="{
                  'account-competition-registration-details__payment-flow-step--done': step.done,
                  'account-competition-registration-details__payment-flow-step--future': step.future,
                }"
              >
                {{ step.label }}
              </span>
            </div>
            <div class="account-competition-registration-details__dates">
              <span class="account-competition-registration-details__meta">
                Создана: {{ formatCompactDateTime(registration.createdAt) }}
              </span>
              <span class="account-competition-registration-details__meta">
                Изменена:
                {{ formatCompactDateTime(registration.updatedAt || registration.statusChangedAt || registration.createdAt) }}
              </span>
            </div>
          </div>
        </div>

        <div class="account-competition-registration-details__pair">
          <div class="account-competition-registration-details__card">
            <span class="account-competition-registration-details__label">Участник</span>
            <strong class="account-competition-registration-details__value">
              {{ registration.participantName || 'Без имени' }}
            </strong>
            <span class="account-competition-registration-details__meta">
              Дата рождения: {{ registration.participantBirthDate || 'Не указана' }}
            </span>
            <span class="account-competition-registration-details__meta">
              Клуб: {{ registration.participantClub || 'Не указан' }}
            </span>
            <span class="account-competition-registration-details__meta">
              Телефон: {{ registration.participantPhone || 'Не указан' }}
            </span>
            <span class="account-competition-registration-details__meta">
              Email: {{ registration.participantEmail || 'Не указан' }}
            </span>
          </div>

          <div class="account-competition-registration-details__card">
            <span class="account-competition-registration-details__label">Пользователь</span>
            <strong class="account-competition-registration-details__value">
              {{ registration.ownerName || 'Не указан' }}
            </strong>
            <span class="account-competition-registration-details__meta">
              Account ID: {{ registration.sourceUserKey || 'Не указан' }}
            </span>
            <span class="account-competition-registration-details__meta">
              Email: {{ registration.ownerEmail || 'Не указан' }}
            </span>
            <span class="account-competition-registration-details__meta">
              Телефон: {{ registration.ownerPhone || 'Не указан' }}
            </span>
            <button
              v-if="showAccountLink && registration.sourceUserKey"
              type="button"
              class="account__table-action account__table-action--ghost account-competition-registration-details__account-link btn-reset"
              @click="emit('open-account', registration.sourceUserKey)"
            >
              Открыть аккаунт
            </button>
          </div>
        </div>

        <div
          v-if="documentsStatusLabel"
          class="account-competition-registration-details__card account-competition-registration-details__card--wide"
        >
          <div class="account-competition-registration-details__card-head">
            <span class="account-competition-registration-details__label">Документы</span>
            <ElTag
              :type="documentsStatusTagType"
              effect="light"
              round
              class="account-competition-registration-details__status-tag"
            >
              {{ documentsStatusLabel }}
            </ElTag>
          </div>
          <span
            v-if="documentsStatusDescription"
            class="account-competition-registration-details__meta account-competition-registration-details__meta--stacked"
          >
            {{ documentsStatusDescription }}
          </span>
        </div>

        <div class="account-competition-registration-details__card account-competition-registration-details__card--wide">
          <span class="account-competition-registration-details__label">Комментарий</span>
          <strong class="account-competition-registration-details__value">
            {{ registration.comment || 'Нет комментария' }}
          </strong>
        </div>
      </div>

      <div class="account-competition-registration-details__actions">
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset"
          @click="emit('close')"
        >
          {{ closeButtonLabel }}
        </button>
        <button
          v-if="showSaveButton && (canEditStage || canEditRegistrationKind || canEditStatus)"
          type="button"
          class="account__table-action account__table-action--success btn-reset"
          :disabled="
            (canEditStage && !form.stageId) ||
            (canEditRegistrationKind && !form.registrationKind) ||
            (canEditStatus && !form.status)
          "
          @click="
            emit('save', {
              stageId: form.stageId,
              registrationKind: form.registrationKind,
              status: form.status,
            })
          "
        >
          Сохранить
        </button>
        <button
          v-if="showPaymentButton"
          type="button"
          class="account__table-action account__table-action--success btn-reset"
          @click="emit('create-payment')"
        >
          {{ paymentButtonLabel }}
        </button>
        <button
          v-if="showRefundButton"
          type="button"
          class="account__table-action account__table-action--edit btn-reset"
          @click="emit('request-refund')"
        >
          {{ refundButtonLabel }}
        </button>
        <button
          v-if="showMarkPaymentSucceededButton"
          type="button"
          class="account__table-action account__table-action--success btn-reset"
          @click="emit('mark-payment-succeeded')"
        >
          Отметить оплаченной
        </button>
        <button
          v-if="showMarkPaymentFailedButton"
          type="button"
          class="account__table-action account__table-action--delete btn-reset"
          @click="emit('mark-payment-failed')"
        >
          Ошибка оплаты
        </button>
        <button
          v-if="showResolveRefundSucceededButton"
          type="button"
          class="account__table-action account__table-action--success btn-reset"
          @click="emit('resolve-refund-succeeded')"
        >
          Возврат выполнен
        </button>
        <button
          v-if="showResolveRefundRejectedButton"
          type="button"
          class="account__table-action account__table-action--delete btn-reset"
          @click="emit('resolve-refund-rejected')"
        >
          Возврат отклонен
        </button>
        <button
          v-if="showAdmitButton"
          type="button"
          class="account__table-action account__table-action--success btn-reset"
          @click="emit('admit')"
        >
          {{ admitButtonLabel }}
        </button>
        <button
          v-if="showWithdrawButton && registration.status !== 'withdrawn' && registration.status !== 'rejected'"
          type="button"
          class="account__table-action account__table-action--delete btn-reset"
          @click="emit('withdraw')"
        >
          Снять с соревнований
        </button>
      </div>
    </div>
  </ElDialog>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { computed, reactive, watch } from 'vue'
import { ElDialog, ElOption, ElSelect, ElTag } from 'element-plus'
import { formatCompactDateTime } from '@/pages/account/utils/accountFormatters'
import {
  COMPETITION_REGISTRATION_RECORD_STATUS,
  COMPETITION_REGISTRATION_RECORD_STATUS_OPTIONS,
} from '@/pages/account/utils/accountConstants'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  registration: {
    type: Object,
    default: null,
  },
  stageOptions: {
    type: Array,
    default: () => [],
  },
  canEditStage: {
    type: Boolean,
    default: true,
  },
  canEditRegistrationKind: {
    type: Boolean,
    default: true,
  },
  canEditStatus: {
    type: Boolean,
    default: false,
  },
  showSaveButton: {
    type: Boolean,
    default: true,
  },
  showWithdrawButton: {
    type: Boolean,
    default: true,
  },
  statusTagType: {
    type: String,
    default: 'info',
  },
  statusLabel: {
    type: String,
    default: '',
  },
  lifecycleLabel: {
    type: String,
    default: '',
  },
  lifecycleDescription: {
    type: String,
    default: '',
  },
  lifecycleNextAction: {
    type: String,
    default: '',
  },
  lifecycleResponsibleLabel: {
    type: String,
    default: '',
  },
  lifecycleBlocksAdmission: {
    type: Boolean,
    default: false,
  },
  documentsStatusTagType: {
    type: String,
    default: 'info',
  },
  documentsStatusLabel: {
    type: String,
    default: '',
  },
  documentsStatusDescription: {
    type: String,
    default: '',
  },
  paymentStatusTagType: {
    type: String,
    default: 'info',
  },
  paymentStatusLabel: {
    type: String,
    default: 'Не требуется',
  },
  paymentStatusDescription: {
    type: String,
    default: '',
  },
  paymentMvpNotice: {
    type: String,
    default: '',
  },
  showPaymentButton: {
    type: Boolean,
    default: false,
  },
  paymentButtonLabel: {
    type: String,
    default: 'Оплатить',
  },
  showRefundButton: {
    type: Boolean,
    default: false,
  },
  refundButtonLabel: {
    type: String,
    default: 'Запросить возврат',
  },
  showMarkPaymentSucceededButton: {
    type: Boolean,
    default: false,
  },
  showMarkPaymentFailedButton: {
    type: Boolean,
    default: false,
  },
  showResolveRefundSucceededButton: {
    type: Boolean,
    default: false,
  },
  showResolveRefundRejectedButton: {
    type: Boolean,
    default: false,
  },
  showAdmitButton: {
    type: Boolean,
    default: false,
  },
  admitButtonLabel: {
    type: String,
    default: 'Допустить',
  },
  showAccountLink: {
    type: Boolean,
    default: false,
  },
  statusOptions: {
    type: Array,
    default: () => COMPETITION_REGISTRATION_RECORD_STATUS_OPTIONS,
  },
})

const emit = defineEmits([
  'close',
  'save',
  'withdraw',
  'create-payment',
  'request-refund',
  'mark-payment-succeeded',
  'mark-payment-failed',
  'resolve-refund-succeeded',
  'resolve-refund-rejected',
  'admit',
  'open-account',
])

const form = reactive({
  stageId: '',
  registrationKind: 'individual',
  status: 'submitted',
})

const registrationKindOptions = [
  { value: 'individual', label: 'Обычная регистрация' },
  { value: 'relay', label: 'Эстафета' },
  { value: 'long-distance', label: 'Длинная дистанция' },
]

const registrationKindLabel = computed(() =>
  formatRegistrationKindLabel(props.registration?.registrationKind),
)

const selectedStageLabel = computed(() => {
  const stageOption = props.stageOptions.find((option) => option.value === props.registration?.stageId)

  return props.registration?.stageLabel || stageOption?.label || 'Этап не указан'
})

const competitionDateLabel = computed(
  () => props.registration?.competitionDateLabel || 'Дата соревнования не указана',
)

const competitionWindowLabel = computed(
  () => props.registration?.competitionWindowLabel || 'Окно регистрации не указано',
)

const closeButtonLabel = computed(() =>
  props.canEditStage || props.canEditRegistrationKind || props.showSaveButton || props.showWithdrawButton
    ? 'Отменить'
    : 'Закрыть',
)

const paymentFlowSteps = computed(() => {
  const normalizedLabel = String(props.paymentStatusLabel || '').trim()
  const isNotRequired = !normalizedLabel || normalizedLabel === 'Не требуется'
  const isPaid = normalizedLabel === 'Оплачено'
  const isRefunded = normalizedLabel === 'Возврат' || normalizedLabel === 'Возврат выполнен'

  return [
    {
      key: 'approved',
      label: isNotRequired ? 'Подтверждение админом' : 'Заявка подтверждена',
      done: !isNotRequired,
      future: isNotRequired,
    },
    {
      key: 'smart-swim-payment',
      label: 'Платеж Smart Swim',
      done: !isNotRequired,
      future: isNotRequired,
    },
    {
      key: 'yookassa',
      label: 'Переход в ЮKassa позже',
      done: isPaid || isRefunded,
      future: !(isPaid || isRefunded),
    },
    {
      key: 'status',
      label: isRefunded ? 'Возврат в ЛК' : 'Статус в ЛК',
      done: isPaid || isRefunded,
      future: isNotRequired,
    },
  ]
})

function formatRegistrationKindLabel(value) {
  if (value === 'relay') {
    return 'Эстафета'
  }

  if (value === 'long-distance') {
    return 'Длинная дистанция'
  }

  return 'Обычная'
}

watch(
  () => [props.modelValue, props.registration?.id],
  () => {
    form.stageId = props.registration?.stageId || ''
    form.registrationKind = props.registration?.registrationKind || 'individual'
    form.status = props.registration?.status || 'submitted'
  },
  { immediate: true },
)
</script>

<style scoped>
.account-competition-registration-details__content {
  display: grid;
  gap: 14px;
  padding-inline: 0;
}

.account-competition-registration-details__grid {
  display: grid;
  gap: 12px;
  padding: 0;
}

.account-competition-registration-details__card--wide {
  grid-column: 1 / -1;
}

.account-competition-registration-details__pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.account-competition-registration-details__card {
  position: relative;
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.9);
}

.account-competition-registration-details__card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account-competition-registration-details__card--plain {
  background: transparent;
}

.account-competition-registration-details__card--lifecycle {
  background: rgb(255 255 255 / 0.9);
}

.account-competition-registration-details__card--payment {
  grid-column: 1 / -1;
}

.account-competition-registration-details__label {
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.account-competition-registration-details__value {
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
  color: var(--black);
}

.account-competition-registration-details__card .account__select {
  width: 100%;
}

.account-competition-registration-details__status-select.account__select {
  position: absolute;
  top: 12px;
  right: 14px;
  width: min(180px, 100%);
}

.account-competition-registration-details__meta {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  color: #64748b;
}

.account-competition-registration-details__meta--stacked {
  margin-top: 2px;
}

.account-competition-registration-details__meta--attention {
  color: #c75f33;
}

.account-competition-registration-details__dates {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-top: 2px;
}

.account-competition-registration-details__dates .account-competition-registration-details__meta {
  white-space: nowrap;
}

.account-competition-registration-details__payment-flow {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.account-competition-registration-details__payment-flow-step {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, var(--cyan) 18%, white);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 72%, var(--light-blue));
  color: #526072;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.2;
}

.account-competition-registration-details__payment-flow-step--done {
  border-color: color-mix(in srgb, var(--aqua) 34%, white);
  background: color-mix(in srgb, var(--aqua) 14%, white);
  color: color-mix(in srgb, var(--black) 78%, var(--aqua));
}

.account-competition-registration-details__payment-flow-step--future {
  border-color: color-mix(in srgb, var(--orange) 32%, white);
  background: color-mix(in srgb, var(--orange) 10%, white);
  color: #a9552e;
}

.account-competition-registration-details :deep(.el-tag) {
  border-radius: 5px;
}

.account-competition-registration-details__status-tag {
  flex: 0 0 auto;
  margin-left: auto;
}

.account-competition-registration-details__account-link {
  justify-self: start;
  width: auto;
  min-height: 32px;
  margin-top: 4px;
}

.account-competition-registration-details__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 0 14px;
}

@media (max-width: 760px) {
  .account-competition-registration-details__pair {
    grid-template-columns: 1fr;
  }

  .account-competition-registration-details__payment-flow {
    grid-template-columns: 1fr;
  }
}
</style>

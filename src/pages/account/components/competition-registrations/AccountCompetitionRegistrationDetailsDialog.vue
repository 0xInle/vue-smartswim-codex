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

        <div class="account-competition-registration-details__pair">
          <div class="account-competition-registration-details__card">
            <span class="account-competition-registration-details__label">Тип заявки</span>
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

          <div class="account-competition-registration-details__card">
            <span class="account-competition-registration-details__label">Оплата и статус</span>
            <span class="account-competition-registration-details__meta">
              Оплата: {{ paymentStatusLabel }}
            </span>
            <span class="account-competition-registration-details__meta">
              Создана: {{ formatCompactDateTime(registration.createdAt) }}
            </span>
            <span class="account-competition-registration-details__meta">
              Изменена:
              {{ formatCompactDateTime(registration.updatedAt || registration.statusChangedAt || registration.createdAt) }}
            </span>
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
              Email: {{ registration.ownerEmail || 'Не указан' }}
            </span>
            <span class="account-competition-registration-details__meta">
              Телефон: {{ registration.ownerPhone || 'Не указан' }}
            </span>
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
  statusOptions: {
    type: Array,
    default: () => COMPETITION_REGISTRATION_RECORD_STATUS_OPTIONS,
  },
})

const emit = defineEmits(['close', 'save', 'withdraw'])

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

const paymentStatusLabel = computed(() => {
  if (form.status === COMPETITION_REGISTRATION_RECORD_STATUS.PAID) {
    return 'Оплачено'
  }

  if (form.status === COMPETITION_REGISTRATION_RECORD_STATUS.PAYMENT_PENDING) {
    return 'Ожидает оплаты'
  }

  return props.registration?.paymentOptionTitle || 'Не указана'
})

const closeButtonLabel = computed(() =>
  props.canEditStage || props.canEditRegistrationKind || props.showSaveButton || props.showWithdrawButton
    ? 'Отменить'
    : 'Закрыть',
)

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

.account-competition-registration-details__status-tag {
  flex: 0 0 auto;
  margin-left: auto;
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
}
</style>

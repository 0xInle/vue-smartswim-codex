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
      <div class="account-competition-registration-details__hero">
        <div>
          <h3 class="account-competition-registration-details__title">
            {{ registration.participantName || 'Без имени' }}
          </h3>
        </div>

        <ElTag :type="statusTagType" effect="light" round>
          {{ statusLabel }}
        </ElTag>
      </div>

      <div class="account-competition-registration-details__grid">
        <label class="account__field account-competition-registration-details__field--wide">
          <span class="account__field-label">Соревнование</span>
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
          <strong v-else class="account-competition-registration-details__value">
            {{ registration.competitionName || 'Соревнование не указано' }}
          </strong>
        </label>

        <label class="account__field account-competition-registration-details__field--wide">
          <span class="account__field-label">Тип заявки</span>
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
          <strong v-else class="account-competition-registration-details__value">
            {{ registrationKindLabel }}
          </strong>
        </label>

        <div class="account-competition-registration-details__pair">
          <div class="account-competition-registration-details__card account-competition-registration-details__card--plain">
            <span class="account-competition-registration-details__label">Оплата</span>
            <strong class="account-competition-registration-details__value">
              {{ paymentStatusLabel }}
            </strong>
          </div>

          <div class="account-competition-registration-details__card account-competition-registration-details__card--plain">
            <span class="account-competition-registration-details__label">Создана</span>
            <strong class="account-competition-registration-details__value">
              {{ formatCompactDateTime(registration.createdAt) }}
            </strong>
            <span class="account-competition-registration-details__meta">
              Изменена {{ formatCompactDateTime(registration.updatedAt || registration.statusChangedAt || registration.createdAt) }}
            </span>
          </div>
        </div>

        <div class="account-competition-registration-details__card account-competition-registration-details__card--wide account-competition-registration-details__card--plain">
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
          Отменить
        </button>
        <button
          v-if="showSaveButton && (canEditStage || canEditRegistrationKind)"
          type="button"
          class="account__table-action account__table-action--success btn-reset"
          :disabled="canEditStage ? !form.stageId : !form.registrationKind"
          @click="emit('save', { stageId: form.stageId, registrationKind: form.registrationKind })"
        >
          Сохранить
        </button>
        <button
          v-if="showWithdrawButton && registration.status === 'submitted'"
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
})

const emit = defineEmits(['close', 'save', 'withdraw'])

const form = reactive({
  stageId: '',
  registrationKind: 'individual',
})

const registrationKindOptions = [
  { value: 'individual', label: 'Обычная регистрация' },
  { value: 'relay', label: 'Эстафета' },
  { value: 'long-distance', label: 'Длинная дистанция' },
]

const registrationKindLabel = computed(() =>
  formatRegistrationKindLabel(props.registration?.registrationKind),
)

const paymentStatusLabel = computed(() =>
  props.registration?.paymentOptionTitle ? 'Оплачено' : 'Нет',
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

.account-competition-registration-details__hero {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0 0;
}

.account-competition-registration-details__title {
  margin: 0;
  font-family: Oswald, sans-serif;
  font-size: 28px;
  line-height: 1.05;
  text-transform: uppercase;
}

.account-competition-registration-details__grid {
  display: grid;
  gap: 12px;
  padding: 0;
}

.account-competition-registration-details__field--wide {
  min-width: 0;
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
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: linear-gradient(180deg, rgb(246 251 255 / 0.92) 0%, rgb(255 255 255 / 0.86) 100%);
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

.account-competition-registration-details__meta {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  color: #64748b;
}

.account-competition-registration-details__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 0 14px;
}

@media (max-width: 760px) {
  .account-competition-registration-details__hero {
    flex-direction: column;
  }

  .account-competition-registration-details__pair {
    grid-template-columns: 1fr;
  }
}
</style>

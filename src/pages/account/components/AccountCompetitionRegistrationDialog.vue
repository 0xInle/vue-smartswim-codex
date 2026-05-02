<template>
  <ElDialog
    :model-value="modelValue"
    width="760px"
    destroy-on-close
    append-to-body
    align-center
    class="account__dialog account-competition-registration"
    title="Регистрация на соревнования"
    @closed="$emit('close')"
    @update:model-value="!$event && $emit('close')"
  >
    <form class="account__dialog-form account-competition-registration__form" @submit.prevent="$emit('submit')">
      <div class="account-competition-registration__hero">
        <div>
          <p class="account__panel-eyebrow">Выбранный этап</p>
          <h3 class="account-competition-registration__title">
            {{ stage?.competitionName || 'Соревнование' }}
          </h3>
          <p class="account-competition-registration__subtitle">
            {{ stage?.stageLabel || `Этап ${stage?.stage || '—'}` }}
            <span v-if="stage?.competitionDateLabel"> · {{ stage.competitionDateLabel }}</span>
          </p>
        </div>

        <div class="account-competition-registration__meta">
          <ElTag :type="stageStatusTagType" effect="light" round>
            {{ stageStatusLabel }}
          </ElTag>
          <span class="account-competition-registration__window">
            {{ stage?.competitionWindowLabel || 'Окно регистрации уточняется' }}
          </span>
        </div>
      </div>

      <div class="account-competition-registration__grid">
        <label class="account__field">
          <span class="account__field-label">Кого регистрируем</span>
          <ElSelect v-model="form.participantKind" class="account__select" popper-class="account__select-popper">
            <ElOption label="Владелец кабинета" value="owner" />
            <ElOption label="Спортсмен" value="athlete" />
          </ElSelect>
        </label>

        <label class="account__field">
          <span class="account__field-label">Участник</span>
          <ElSelect
            v-model="form.participantId"
            class="account__select"
            popper-class="account__select-popper"
            placeholder="Выберите участника"
          >
            <ElOption
              v-for="participant in participantOptions"
              :key="participant.value"
              :label="participant.label"
              :value="participant.value"
            />
          </ElSelect>
          <span v-if="errors.participantId" class="account__field-error">{{ errors.participantId }}</span>
          <span v-else class="account__field-hint">
            В списке доступен владелец кабинета и прикрепленные спортсмены.
          </span>
        </label>
      </div>

      <div class="account-competition-registration__profile">
        <div class="account-competition-registration__profile-card">
          <span class="account-competition-registration__profile-label">Владелец кабинета</span>
          <strong class="account-competition-registration__profile-value">
            {{ ownerSnapshot?.fullName || 'Не заполнено' }}
          </strong>
          <span class="account-competition-registration__profile-meta">
            {{ ownerSnapshot?.email || 'Почта не указана' }}
          </span>
        </div>

        <div class="account-competition-registration__profile-card">
          <span class="account-competition-registration__profile-label">Контакты</span>
          <strong class="account-competition-registration__profile-value">
            {{ ownerSnapshot?.phone || 'Телефон не указан' }}
          </strong>
          <span class="account-competition-registration__profile-meta">
            {{ ownerSnapshot?.club || 'Клуб не указан' }}
          </span>
        </div>
      </div>

      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Тип заявки</span>
          <ElSelect v-model="form.registrationKind" class="account__select" popper-class="account__select-popper">
            <ElOption label="Обычная регистрация" value="individual" />
            <ElOption label="Эстафета" value="relay" />
            <ElOption label="Длинная дистанция" value="long-distance" />
          </ElSelect>
        </label>

        <label class="account__field">
          <span class="account__field-label">Вариант оплаты</span>
          <ElSelect
            v-model="form.paymentOptionId"
            class="account__select"
            popper-class="account__select-popper"
            placeholder="Выберите оплату"
          >
            <ElOption
              v-for="option in paymentOptions"
              :key="option.id"
              :label="option.title"
              :value="option.id"
            />
          </ElSelect>
          <span v-if="errors.paymentOptionId" class="account__field-error">{{ errors.paymentOptionId }}</span>
        </label>
      </div>

      <div v-if="form.registrationKind === 'relay'" class="account__field-grid">
        <label class="account__field account-competition-registration__field--wide">
          <span class="account__field-label">Название команды</span>
          <input
            v-model.trim="form.teamName"
            class="account__input"
            type="text"
            placeholder="Например, Смарт Свим"
          />
          <span v-if="errors.teamName" class="account__field-error">{{ errors.teamName }}</span>
        </label>
      </div>

      <div v-else-if="form.registrationKind === 'long-distance'" class="account__field-grid">
        <label class="account__field account-competition-registration__field--wide">
          <span class="account__field-label">Ориентировочное время / комментарий</span>
          <input
            v-model.trim="form.seedTime"
            class="account__input"
            type="text"
            placeholder="Например, 01:12.50"
          />
          <span v-if="errors.seedTime" class="account__field-error">{{ errors.seedTime }}</span>
        </label>
      </div>

      <label class="account__field">
        <span class="account__field-label">Комментарий</span>
        <textarea
          v-model.trim="form.comment"
          class="account__textarea"
          rows="4"
          placeholder="Дополнительная информация для секретаря"
        ></textarea>
      </label>

      <div class="account-competition-registration__note">
        <p class="account-competition-registration__note-copy">
          Это моковая регистрация: данные сохраняются локально и сразу появляются в истории.
        </p>
      </div>

      <div class="account__dialog-actions">
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset"
          @click="$emit('close')"
        >
          Отмена
        </button>
        <button type="submit" class="account__submit btn-reset" :disabled="isSubmitting">
          {{ isSubmitting ? 'Сохраняем...' : 'Зарегистрироваться' }}
        </button>
      </div>
    </form>
  </ElDialog>
</template>

<script setup>
import { ElDialog, ElOption, ElSelect, ElTag } from 'element-plus'
import { computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  stage: {
    type: Object,
    default: null,
  },
  ownerSnapshot: {
    type: Object,
    default: null,
  },
  participantOptions: {
    type: Array,
    default: () => [],
  },
  paymentOptions: {
    type: Array,
    default: () => [],
  },
  form: {
    type: Object,
    required: true,
  },
  errors: {
    type: Object,
    required: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'submit'])

const stageStatusLabel = computed(() => {
  if (!props.stage?.registrationState) {
    return 'Регистрация'
  }

  if (props.stage.registrationState.mode === 'open') {
    return 'Регистрация открыта'
  }

  if (props.stage.registrationState.mode === 'upcoming') {
    return 'Скоро откроется'
  }

  return 'Регистрация закрыта'
})

const stageStatusTagType = computed(() => {
  if (!props.stage?.registrationState) {
    return 'info'
  }

  if (props.stage.registrationState.mode === 'open') {
    return 'success'
  }

  if (props.stage.registrationState.mode === 'upcoming') {
    return 'warning'
  }

  return 'info'
})

watch(
  () => props.form.participantKind,
  (nextValue) => {
    if (nextValue === 'owner') {
      props.form.participantId = 'owner'
      return
    }

    if (nextValue === 'athlete' && props.form.participantId === 'owner') {
      const nextParticipant = props.participantOptions.find((participant) => participant.value !== 'owner')
      props.form.participantId = nextParticipant?.value || ''
    }
  },
  { immediate: true },
)

watch(
  () => props.form.participantId,
  (nextValue) => {
    if (!nextValue || nextValue === 'owner') {
      props.form.participantKind = 'owner'
      return
    }

    props.form.participantKind = 'athlete'
  },
)
</script>

<style scoped>
.account-competition-registration__form {
  display: grid;
  gap: 18px;
}

.account-competition-registration__hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 18px 0;
}

.account-competition-registration__title {
  margin: 4px 0 4px;
  font-family: Oswald;
  font-size: clamp(28px, 4vw, 38px);
  line-height: 0.96;
  text-transform: uppercase;
}

.account-competition-registration__subtitle {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.account-competition-registration__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  text-align: right;
}

.account-competition-registration__window {
  font-size: 13px;
  font-weight: 700;
  color: #526072;
}

.account-competition-registration__grid,
.account-competition-registration__profile,
.account-competition-registration__note {
  display: grid;
  gap: 12px;
  padding-inline: 18px;
}

.account-competition-registration__profile {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.account-competition-registration__profile-card {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 18%, var(--white));
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 72%);
}

.account-competition-registration__profile-label {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #526072;
}

.account-competition-registration__profile-value {
  font-size: 15px;
  line-height: 1.4;
}

.account-competition-registration__profile-meta,
.account-competition-registration__note-copy {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #526072;
}

.account__field-hint {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  color: #64748b;
}

.account-competition-registration__field--wide {
  width: 100%;
}

.account__textarea {
  width: 100%;
  min-height: 96px;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--cyan) 20%, var(--white));
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 86%);
  font: inherit;
  resize: vertical;
}

@media (max-width: 640px) {
  .account-competition-registration__hero,
  .account-competition-registration__profile {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .account-competition-registration__meta {
    align-items: flex-start;
    text-align: left;
  }
}
</style>

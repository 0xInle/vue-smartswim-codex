<template>
  <ElDialog
    :model-value="modelValue"
    width="760px"
    destroy-on-close
    append-to-body
    align-center
    class="account__dialog account-competition-registration"
    title="Регистрация на соревнования"
    :close-icon="Close"
    @closed="$emit('close')"
    @update:model-value="!$event && $emit('close')"
  >
    <form class="account__dialog-form account-competition-registration__form" @submit.prevent="$emit('submit')">
      <div class="account-competition-registration__hero">
        <div class="account-competition-registration__hero-copy">
          <h3 class="account-competition-registration__title">
            {{ stage?.competitionName || 'Соревнование' }}
          </h3>
          <p class="account-competition-registration__subtitle">
            {{ stage?.stageLabel || `Этап ${stage?.stage || '—'}` }}
            <span v-if="stage?.competitionDateLabel"> · {{ stage.competitionDateLabel }}</span>
          </p>
        </div>
      </div>

      <div class="account-competition-registration__grid">
        <label class="account__field">
          <span class="account__field-label">Участник</span>
          <ElSelect
            :model-value="form.participantId"
            class="account__select"
            popper-class="account__select-popper"
            placeholder="Выберите участника"
            @update:model-value="updateFormField('participantId', $event)"
          >
            <ElOption
              v-for="participant in participantOptions"
              :key="participant.value"
              :label="participant.label"
              :value="participant.value"
            />
          </ElSelect>
          <span v-if="errors.participantId" class="account__field-error">{{ errors.participantId }}</span>
        </label>
      </div>

      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Тип заявки</span>
          <ElSelect
            :model-value="form.registrationKind"
            class="account__select"
            popper-class="account__select-popper"
            @update:model-value="updateFormField('registrationKind', $event)"
          >
            <ElOption label="Обычная регистрация" value="individual" />
            <ElOption label="Эстафета" value="relay" />
            <ElOption label="Длинная дистанция" value="long-distance" />
          </ElSelect>
        </label>

        <div class="account-competition-registration__payment">
          <button
            type="button"
            class="account__table-action account__table-action--success btn-reset account-competition-registration__payment-button"
          >
            Оплатить
          </button>
        </div>
      </div>

      <div v-if="form.registrationKind === 'relay'" class="account__field-grid">
        <label class="account__field account-competition-registration__field--wide">
          <span class="account__field-label">Название команды</span>
          <input
            :value="form.teamName"
            class="account__input"
            type="text"
            placeholder="Например, Смарт Свим"
            @input="updateFormField('teamName', $event.target.value.trim())"
          />
          <span v-if="errors.teamName" class="account__field-error">{{ errors.teamName }}</span>
        </label>
      </div>

      <div v-else-if="form.registrationKind === 'long-distance'" class="account__field-grid">
        <label class="account__field account-competition-registration__field--wide">
          <span class="account__field-label">Ориентировочное время / комментарий</span>
          <input
            :value="form.seedTime"
            class="account__input"
            type="text"
            placeholder="Например, 01:12.50"
            @input="updateFormField('seedTime', $event.target.value.trim())"
          />
          <span v-if="errors.seedTime" class="account__field-error">{{ errors.seedTime }}</span>
        </label>
      </div>

      <label class="account__field">
        <span class="account__field-label">Комментарий</span>
        <textarea
          :value="form.comment"
          class="account__textarea"
          rows="4"
          placeholder="Дополнительная информация для секретаря"
          @input="updateFormField('comment', $event.target.value.trim())"
        ></textarea>
      </label>

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
import { Close } from '@element-plus/icons-vue'
import { ElDialog, ElOption, ElSelect } from 'element-plus'
import { watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  stage: {
    type: Object,
    default: null,
  },
  participantOptions: {
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

const emit = defineEmits(['close', 'submit', 'update-form-field'])

function updateFormField(field, value) {
  emit('update-form-field', { field, value })
}

watch(
  () => props.form.participantKind,
  (nextValue) => {
    if (nextValue === 'owner') {
      updateFormField('participantId', 'owner')
      return
    }

    if (nextValue === 'athlete' && props.form.participantId === 'owner') {
      const nextParticipant = props.participantOptions.find((participant) => participant.value !== 'owner')
      updateFormField('participantId', nextParticipant?.value || '')
    }
  },
  { immediate: true },
)

watch(
  () => props.form.participantId,
  (nextValue) => {
    if (!nextValue || nextValue === 'owner') {
      updateFormField('participantKind', 'owner')
      return
    }

    updateFormField('participantKind', 'athlete')
  },
)
</script>

<style scoped>
.account-competition-registration__form {
  display: grid;
  gap: 18px;
}

.account-competition-registration__hero {
  display: grid;
  gap: 8px;
  padding: 18px 0 0;
}

.account-competition-registration__hero-copy {
  display: grid;
  gap: 8px;
}

.account-competition-registration__title {
  margin: 0;
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

.account-competition-registration__grid,
.account-competition-registration__payment {
  display: grid;
  gap: 12px;
  align-self: start;
  padding-top: 26px;
}

.account-competition-registration__field--wide {
  width: 100%;
}

.account-competition-registration__payment-button {
  justify-content: center;
  min-height: 38px;
  width: 100%;
}

.account__panel-eyebrow {
  margin-top: 0;
}

.account__textarea {
  width: 100%;
  min-height: 96px;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--cyan) 20%, var(--white));
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 86%);
  font: inherit;
  resize: none;
}

@media (max-width: 640px) {
  .account-competition-registration__hero {
    padding-inline: 0;
  }

  .account-competition-registration__grid,
  .account-competition-registration__payment {
    padding-inline: 0;
  }

  .account-competition-registration__payment {
    padding-top: 0;
  }
}
</style>

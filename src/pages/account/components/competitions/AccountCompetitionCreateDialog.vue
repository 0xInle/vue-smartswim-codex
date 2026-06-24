<template>
  <ElDialog
    :model-value="modelValue"
    width="640px"
    append-to-body
    align-center
    destroy-on-close
    class="account__dialog"
    title="Добавление соревнования"
    :close-icon="Close"
    @closed="emit('close')"
    @update:model-value="!$event && emit('close')"
  >
    <form class="account__dialog-form" @submit.prevent="submitForm">
      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Название соревнования</span>
          <input
            v-model.trim="form.competitionName"
            class="account__input"
            type="text"
            placeholder="SmartSwimCup"
            required
          />
        </label>

        <label class="account__field">
          <span class="account__field-label">Этап</span>
          <input
            :value="form.stage"
            class="account__input"
            type="text"
            inputmode="numeric"
            placeholder="10"
            required
            @input="handleStageInput"
          />
        </label>
      </div>

      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Дата</span>
          <AccountDatePicker
            v-model="form.date"
            caption="Выберите дату этапа"
            placeholder="Выберите дату"
          />
        </label>

        <label class="account__field">
          <span class="account__field-label">Регистрация</span>
          <div class="account__field-grid account__field-grid--compact">
            <AccountDatePicker
              v-model="form.openDate"
              caption="Выберите дату открытия регистрации"
              placeholder="Открытие"
            />
            <AccountDatePicker
              v-model="form.closeDate"
              caption="Выберите дату закрытия регистрации"
              placeholder="Закрытие"
            />
          </div>
        </label>
      </div>

      <div class="account-competition-create__links">
        <div
          v-for="link in linkEditors"
          :key="link.key"
          class="account-competition-create__link-row"
        >
          <span class="account-competition-create__link-label">{{ link.label }}:</span>
          <input
            v-model.trim="form[link.modelKey]"
            class="account__input account-competition-create__link-input"
            type="url"
            :placeholder="link.placeholder"
          />
        </div>
      </div>

      <div class="account__dialog-actions">
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset"
          @click="emit('close')"
        >
          Отмена
        </button>
        <button
          type="submit"
          class="account__table-action account__table-action--edit btn-reset"
          :disabled="isSubmitting"
          :aria-busy="isSubmitting"
        >
          <span v-if="isSubmitting" class="account__button-spinner" aria-hidden="true"></span>
          <span v-else>Создать</span>
        </button>
      </div>
    </form>
  </ElDialog>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { reactive, watch } from 'vue'
import { ElDialog } from 'element-plus'
import AccountDatePicker from '@/pages/account/components/shared/AccountDatePicker.vue'
import { sanitizeIntegerInput } from '@/utils/inputSanitizers'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'submit'])

const form = reactive({
  competitionName: '',
  stage: '',
  date: '',
  openDate: '',
  closeDate: '',
  protocolUrl: '',
  photoUrl: '',
  certificateUrl: '',
  memoUrl: '',
})

const linkEditors = [
  { key: 'protocol', label: 'Протокол', modelKey: 'protocolUrl', placeholder: 'Ссылка на протокол' },
  { key: 'photo', label: 'Фото', modelKey: 'photoUrl', placeholder: 'Ссылка на фото' },
  {
    key: 'certificate',
    label: 'Сертификаты',
    modelKey: 'certificateUrl',
    placeholder: 'Ссылка на архив сертификатов',
  },
  { key: 'memo', label: 'Памятка', modelKey: 'memoUrl', placeholder: 'Ссылка на памятку' },
]

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen && !props.isSubmitting) {
      resetForm()
    }
  },
)

function submitForm() {
  if (props.isSubmitting) {
    return
  }

  emit('submit', {
    competitionName: form.competitionName.trim(),
    stage: form.stage,
    date: form.date.trim(),
    openAt: form.openDate.trim(),
    closeAt: form.closeDate.trim(),
    protocolUrl: form.protocolUrl.trim(),
    photoUrl: form.photoUrl.trim(),
    certificateUrl: form.certificateUrl.trim(),
    memoUrl: form.memoUrl.trim(),
  })
}

function handleStageInput(event) {
  form.stage = sanitizeIntegerInput(event.target.value, { maxLength: 8 })
}

function resetForm() {
  form.competitionName = ''
  form.stage = ''
  form.date = ''
  form.openDate = ''
  form.closeDate = ''
  form.protocolUrl = ''
  form.photoUrl = ''
  form.certificateUrl = ''
  form.memoUrl = ''
}
</script>

<style scoped>
.account-competition-create__links {
  display: grid;
  gap: 12px;
}

.account-competition-create__link-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.account-competition-create__link-label {
  font-size: 14px;
  font-weight: 900;
  color: #1f2937;
}

.account-competition-create__link-input {
  width: 100%;
}

@media (max-width: 700px) {
  .account-competition-create__link-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>

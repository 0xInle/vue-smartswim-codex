<template>
  <ElDialog
    :model-value="modelValue"
    width="640px"
    append-to-body
    align-center
    destroy-on-close
    class="account__dialog"
    title="Редактирование соревнования"
    :close-icon="Close"
    @closed="emit('close')"
    @update:model-value="!$event && emit('close')"
  >
    <form class="account__dialog-form" @submit.prevent="submitForm">
      <div class="account__dialog-copy">
        <p class="account__dialog-text">
          {{ dialogTitle }}
        </p>
      </div>

      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Название соревнования</span>
          <ElSelect
            v-model="form.competitionName"
            class="account__select"
            popper-class="account__select-popper account__select-popper--full"
            placeholder="Выберите соревнование"
          >
            <ElOption
              v-for="option in editableCompetitionOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </label>

        <label class="account__field">
          <span class="account__field-label">Дата этапа</span>
          <AccountDatePicker
            v-model="form.date"
            caption="Выберите дату этапа"
            placeholder="Выберите дату этапа"
          />
        </label>
      </div>

      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Дата открытия регистрации</span>
          <AccountDatePicker
            v-model="form.openDate"
            caption="Выберите дату открытия регистрации"
            placeholder="Выберите дату открытия"
          />
        </label>

        <label class="account__field">
          <span class="account__field-label">Дата закрытия регистрации</span>
          <AccountDatePicker
            v-model="form.closeDate"
            caption="Выберите дату закрытия регистрации"
            placeholder="Выберите дату закрытия"
          />
        </label>
      </div>

      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Лимит мест</span>
          <input
            v-model.number="form.registrationLimit"
            class="account__input"
            type="number"
            min="0"
            inputmode="numeric"
            placeholder="0 - без лимита"
          />
        </label>
      </div>

      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Протокол</span>
          <input
            v-model="form.protocolUrl"
            class="account__input"
            type="url"
            placeholder="Ссылка на протокол"
          />
        </label>

        <label class="account__field">
          <span class="account__field-label">Фото</span>
          <input
            v-model="form.photoUrl"
            class="account__input"
            type="url"
            placeholder="Ссылка на фото"
          />
        </label>
      </div>

      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Сертификаты</span>
          <input
            v-model="form.certificateUrl"
            class="account__input"
            type="url"
            placeholder="Ссылка на архив сертификатов"
          />
        </label>

        <label class="account__field">
          <span class="account__field-label">Памятка</span>
          <input
            v-model="form.memoUrl"
            class="account__input"
            type="url"
            placeholder="Ссылка на памятку"
          />
        </label>
      </div>

      <div class="account__dialog-actions">
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset"
          @click="emit('close')"
        >
          Отмена
        </button>
        <button type="submit" class="account__submit btn-reset">Сохранить</button>
      </div>
    </form>
  </ElDialog>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { computed, reactive, watch } from 'vue'
import { ElDialog, ElOption, ElSelect } from 'element-plus'
import {
  formatCompetitionDateForInput,
  formatCompetitionName,
  formatCompetitionStageLabel,
} from '@/pages/account/utils/accountFormatters'
import AccountDatePicker from '@/pages/account/components/shared/AccountDatePicker.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  stage: {
    type: Object,
    default: null,
  },
  competitionOptions: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['close', 'submit'])

const form = reactive({
  competitionName: '',
  date: '',
  openDate: '',
  closeDate: '',
  registrationLimit: 0,
  protocolUrl: '',
  photoUrl: '',
  certificateUrl: '',
  memoUrl: '',
})

const editableCompetitionOptions = computed(() =>
  props.competitionOptions.filter((option) => option.value !== 'all'),
)

const dialogTitle = computed(() => {
  if (!props.stage) {
    return 'Выберите этап для редактирования.'
  }

  return `${formatCompetitionName(props.stage.competitionName)} · ${formatCompetitionStageLabel(props.stage.stage)}`
})

watch(
  () => [props.modelValue, props.stage],
  () => {
    if (!props.modelValue || !props.stage) {
      resetForm()
      return
    }

    form.competitionName = props.stage.competitionName || ''
    form.date = formatCompetitionDateForInput(props.stage.date)
    form.openDate = formatCompetitionDateForInput(props.stage.registration?.openAt)
    form.closeDate = formatCompetitionDateForInput(props.stage.registration?.closeAt)
    form.registrationLimit = Number(
      props.stage.registrationLimit || props.stage.registration?.participantLimit || 0,
    )
    form.protocolUrl = props.stage.protocolUrl || ''
    form.photoUrl = props.stage.photoUrl || ''
    form.certificateUrl = props.stage.certificateUrl || ''
    form.memoUrl = props.stage.memoUrl || ''
  },
  { immediate: true },
)

function submitForm() {
  if (!props.stage) {
    return
  }

  emit('submit', {
    stageId: props.stage.id,
    competitionName: form.competitionName,
    date: form.date,
    openAt: form.openDate,
    closeAt: form.closeDate,
    registrationLimit: Number(form.registrationLimit) || 0,
    protocolUrl: form.protocolUrl,
    photoUrl: form.photoUrl,
    certificateUrl: form.certificateUrl,
    memoUrl: form.memoUrl,
  })
}

function resetForm() {
  form.competitionName = ''
  form.date = ''
  form.openDate = ''
  form.closeDate = ''
  form.registrationLimit = 0
  form.protocolUrl = ''
  form.photoUrl = ''
  form.certificateUrl = ''
  form.memoUrl = ''
}
</script>

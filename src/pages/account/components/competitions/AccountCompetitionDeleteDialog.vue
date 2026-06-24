<template>
  <ElDialog
    :model-value="modelValue"
    width="480px"
    append-to-body
    align-center
    destroy-on-close
    class="account__dialog account__dialog--confirm"
    :close-icon="Close"
    @closed="emit('close')"
    @update:model-value="!$event && emit('close')"
  >
    <div class="account__dialog-form">
      <div class="account__dialog-copy account__dialog-copy--centered">
        <p class="account__dialog-text">{{ dialogText }}</p>
        <p class="account__dialog-title-line">{{ stageTitle }}</p>
        <p v-if="activeRegistrationsCount > 0" class="account__dialog-hint">
          Сначала снимите участников или дождитесь завершения активных заявок.
        </p>
      </div>

      <div class="account__dialog-actions">
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset"
          :disabled="isSubmitting"
          @click="emit('close')"
        >
          Отмена
        </button>
        <button
          type="button"
          class="account__table-action account__table-action--delete btn-reset"
          :disabled="activeRegistrationsCount > 0 || isSubmitting"
          :aria-busy="isSubmitting"
          @click="confirmDelete"
        >
          <span v-if="isSubmitting" class="account__button-spinner" aria-hidden="true"></span>
          <span :class="{ 'account__button-label--loading': isSubmitting }">Удалить</span>
        </button>
      </div>
    </div>
  </ElDialog>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { ElDialog } from 'element-plus'
import {
  formatCompetitionName,
  formatCompetitionStageLabel,
} from '@/pages/account/utils/accountFormatters'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  stage: {
    type: Object,
    default: null,
  },
  activeRegistrationsCount: {
    type: Number,
    default: 0,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'confirm'])

const stageTitle = computed(() => {
  if (!props.stage) {
    return 'выбранный этап'
  }

  return `${formatCompetitionName(props.stage.competitionName)} · ${formatCompetitionStageLabel(props.stage.stage)}`
})

const dialogText = computed(() => {
  if (props.activeRegistrationsCount > 0) {
    return `Этап нельзя удалить: есть активные заявки (${props.activeRegistrationsCount}).`
  }

  return 'Вы уверены, что хотите удалить этап?'
})

function confirmDelete() {
  if (!props.stage || props.activeRegistrationsCount > 0) {
    return
  }

  emit('confirm', props.stage.id)
}
</script>

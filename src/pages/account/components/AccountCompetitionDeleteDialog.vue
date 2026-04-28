<template>
  <ElDialog
    :model-value="modelValue"
    width="520px"
    append-to-body
    align-center
    destroy-on-close
    class="account__dialog"
    :close-icon="Close"
    @closed="emit('close')"
    @update:model-value="!$event && emit('close')"
  >
    <div class="account__dialog-form">
      <div class="account__dialog-copy account__dialog-copy--centered">
        <p class="account__dialog-text">Вы уверены, что хотите удалить этап?</p>
        <p class="account__dialog-title-line">{{ stageTitle }}</p>
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
          type="button"
          class="account__table-action account__table-action--delete btn-reset"
          @click="confirmDelete"
        >
          Удалить
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
})

const emit = defineEmits(['close', 'confirm'])

const stageTitle = computed(() => {
  if (!props.stage) {
    return 'выбранный этап'
  }

  return `${formatCompetitionName(props.stage.competitionName)} · ${formatCompetitionStageLabel(props.stage.stage)}`
})

function confirmDelete() {
  if (!props.stage) {
    return
  }

  emit('confirm', props.stage.id)
}
</script>

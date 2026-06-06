<template>
  <ElDialog
    :model-value="modelValue"
    width="760px"
    append-to-body
    align-center
    destroy-on-close
    class="account__dialog"
    title="Настройка дистанции"
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

      <div class="account__distance-editor">
        <div
          v-for="(item, index) in distanceItems"
          :key="item.id"
          class="account__distance-editor-row"
        >
          <label class="account__field">
            <span class="account__field-label account__field-label--table">Дистанция</span>
            <input
              v-model.trim="item.distance"
              class="account__input account__input--compact"
              type="text"
            />
          </label>

          <label class="account__field">
            <span class="account__field-label account__field-label--table">Стиль</span>
            <input
              v-model.trim="item.label"
              class="account__input account__input--compact"
              type="text"
            />
          </label>

          <button
            v-if="distanceItems.length > 1"
            type="button"
            class="account__table-action account__table-action--delete btn-reset"
            @click="openDeleteDialog(index)"
          >
            Удалить
          </button>
        </div>

        <button
          type="button"
          class="account__table-action account__table-action--ghost account__distance-add btn-reset"
          @click="addDistanceRow"
        >
          Добавить дистанцию
        </button>
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

  <ElDialog
    :model-value="isDeleteDialogOpen"
    width="480px"
    append-to-body
    align-center
    destroy-on-close
    class="account__dialog account__dialog--confirm"
    :close-icon="Close"
    @closed="closeDeleteDialog"
    @update:model-value="!$event && closeDeleteDialog()"
  >
    <div class="account__dialog-form">
      <div class="account__dialog-copy">
        <p class="account__dialog-text">Вы уверены, что хотите удалить дистанцию?</p>
        <p class="account__dialog-hint">
          Это действие необратимо. После сохранения программы дистанция будет удалена со страницы
          соревнования.
        </p>
      </div>

      <div class="account__dialog-actions">
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset"
          @click="closeDeleteDialog"
        >
          Отмена
        </button>
        <button
          type="button"
          class="account__table-action account__table-action--delete btn-reset"
          @click="confirmDistanceDelete"
        >
          Удалить
        </button>
      </div>
    </div>
  </ElDialog>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'
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
  description: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'submit'])

const distanceItems = ref([])
const isDeleteDialogOpen = ref(false)
const pendingDeleteIndex = ref(null)

const dialogTitle = computed(() => {
  if (!props.stage) {
    return 'Выберите этап для настройки.'
  }

  return `${formatCompetitionName(props.stage.competitionName)} · ${formatCompetitionStageLabel(props.stage.stage)}`
})

watch(
  () => [props.modelValue, props.description],
  () => {
    if (!props.modelValue) {
      resetState()
      return
    }

    distanceItems.value = parseDistanceDescription(props.description).map((item) => ({
      ...item,
      id: createDistanceRowId(),
    }))

    if (!distanceItems.value.length) {
      addDistanceRow()
    }
  },
  { immediate: true },
)

function addDistanceRow() {
  distanceItems.value.push({
    id: createDistanceRowId(),
    distance: '',
    label: '',
  })
}

function openDeleteDialog(index) {
  pendingDeleteIndex.value = index
  isDeleteDialogOpen.value = true
}

function closeDeleteDialog() {
  isDeleteDialogOpen.value = false
  pendingDeleteIndex.value = null
}

function confirmDistanceDelete() {
  if (pendingDeleteIndex.value === null) {
    return
  }

  distanceItems.value.splice(pendingDeleteIndex.value, 1)
  closeDeleteDialog()
}

function submitForm() {
  if (!props.stage) {
    return
  }

  emit('submit', {
    stageId: props.stage.id,
    description: formatDistanceDescription(distanceItems.value),
  })
}

function resetState() {
  closeDeleteDialog()
  distanceItems.value = []
}

function parseDistanceDescription(description = '') {
  const normalizedDescription = String(description || '').trim()

  if (!normalizedDescription || normalizedDescription === 'Программа этапа будет уточняться.') {
    return []
  }

  return normalizedDescription
    .split(',')
    .map((item) => item.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .map((item) => {
      const match = item.match(/^(\d+\s*м)\s+(.+)$/i)

      if (!match) {
        return {
          distance: item,
          label: '',
        }
      }

      return {
        distance: match[1],
        label: match[2],
      }
    })
}

function formatDistanceDescription(items = []) {
  const description = items
    .map((item) => {
      const distance = String(item.distance || '').trim()
      const label = String(item.label || '').trim()

      return [distance, label].filter(Boolean).join(' ')
    })
    .filter(Boolean)
    .join(', ')

  return description ? `${description}.` : ''
}

function createDistanceRowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
</script>

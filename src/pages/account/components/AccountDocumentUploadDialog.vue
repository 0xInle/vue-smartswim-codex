<template>
  <ElDialog
    :model-value="modelValue"
    width="560px"
    append-to-body
    align-center
    destroy-on-close
    class="account__dialog"
    title="Загрузка документа"
    :close-icon="Close"
    @closed="$emit('close')"
    @update:model-value="!$event && $emit('close')"
  >
    <form class="account__dialog-form" @submit.prevent="handleSubmit">
      <div class="account__dialog-copy">
        <p class="account__dialog-text">{{ dialogTitle }}</p>
        <p class="account__dialog-hint">
          Загрузите файл и, если нужно, укажите срок действия документа.
        </p>
      </div>

      <label class="account__field">
        <span class="account__field-label">Файл документа</span>
        <input
          ref="fileInputRef"
          class="account-documents-upload__file-input"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          @change="handleFileChange"
        />
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset account-documents-upload__file-button"
          @click="openFilePicker"
        >
          Выбрать файл
        </button>
        <span class="account__field-hint">
          Поддерживаются `PDF`, `JPG` и `PNG`.
        </span>
        <span v-if="fileError" class="account__field-error">{{ fileError }}</span>
      </label>

      <label class="account__field">
        <span class="account__field-label">Действует до</span>
        <input
          v-model.trim="expiresAt"
          class="account__input"
          type="text"
          inputmode="numeric"
          placeholder="дд.мм.гггг"
        />
      </label>

      <div class="account__dialog-actions">
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset"
          @click="$emit('close')"
        >
          Отмена
        </button>
        <button type="submit" class="account__submit btn-reset">Загрузить</button>
      </div>
    </form>
  </ElDialog>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { ref, watch } from 'vue'
import { ElDialog } from 'element-plus'
import { getAccountDocumentDefinition } from '@/pages/account/utils/accountDocumentTypes'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  documentType: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'submit'])

const fileInputRef = ref(null)
const selectedFile = ref(null)
const expiresAt = ref('')
const fileError = ref('')

const dialogTitle = ref('')

watch(
  () => [props.modelValue, props.documentType],
  () => {
    const definition = getAccountDocumentDefinition(props.documentType)
    dialogTitle.value = definition?.label || 'Выберите документ'

    if (!props.modelValue) {
      resetDialog()
    }
  },
  { immediate: true },
)

function handleFileChange(event) {
  const nextFile = event.target.files?.[0] || null
  selectedFile.value = nextFile
  fileError.value = ''
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function handleSubmit() {
  if (!selectedFile.value) {
    fileError.value = 'Выберите файл документа.'
    return
  }

  emit('submit', {
    file: selectedFile.value,
    expiresAt: expiresAt.value,
  })

  resetDialog()
}

function resetDialog() {
  selectedFile.value = null
  expiresAt.value = ''
  fileError.value = ''

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}
</script>

<style scoped>
.account-documents-upload__file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.account-documents-upload__file-button {
  width: fit-content;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 8px 14px;
  line-height: 1;
  text-align: center;
}

.account__field-hint {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}
</style>

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
          {{ selectedFile ? 'Файл выбран' : 'Выбрать файл' }}
        </button>
        <div v-if="selectedFile" class="account-documents-upload__file-summary">
          <span class="account-documents-upload__file-name">{{ selectedFile.name }}</span>
          <span class="account-documents-upload__file-size">{{ selectedFileSizeLabel }}</span>
        </div>
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
import { computed, ref, watch } from 'vue'
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
const selectedFileDataUrl = ref('')
const selectedFileType = ref('')
const expiresAt = ref('')
const fileError = ref('')

const dialogTitle = ref('')
const selectedFileSizeLabel = computed(() => {
  if (!selectedFile.value) {
    return ''
  }

  const sizeInKb = selectedFile.value.size / 1024

  if (sizeInKb < 1024) {
    return `${Math.max(1, Math.round(sizeInKb))} КБ`
  }

  return `${(sizeInKb / 1024).toFixed(1)} МБ`
})

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

  if (!nextFile) {
    selectedFileDataUrl.value = ''
    selectedFileType.value = ''
    return
  }

  selectedFileType.value = nextFile.type || ''
  selectedFileDataUrl.value = ''

  void readFileAsDataUrl(nextFile)
    .then((result) => {
      selectedFileDataUrl.value = result
    })
    .catch(() => {
      selectedFileDataUrl.value = ''
      selectedFileType.value = ''
      fileError.value = 'Не удалось прочитать файл.'
    })
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '')
    }

    reader.onerror = () => {
      reject(new Error('Не удалось прочитать файл.'))
    }

    reader.readAsDataURL(file)
  })
}

async function handleSubmit() {
  if (!selectedFile.value) {
    fileError.value = 'Выберите файл документа.'
    return
  }

  if (!selectedFileDataUrl.value) {
    try {
      selectedFileDataUrl.value = await readFileAsDataUrl(selectedFile.value)
    } catch (error) {
      fileError.value = error instanceof Error ? error.message : 'Не удалось прочитать файл.'
      return
    }
  }

  emit('submit', {
    file: selectedFile.value,
    fileDataUrl: selectedFileDataUrl.value,
    fileType: selectedFileType.value,
    expiresAt: expiresAt.value,
  })

  resetDialog()
}

function resetDialog() {
  selectedFile.value = null
  selectedFileDataUrl.value = ''
  selectedFileType.value = ''
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

.account-documents-upload__file-summary {
  display: grid;
  gap: 2px;
  margin-top: 2px;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--cyan) 20%, white);
  border-radius: 10px;
  background: rgb(246 251 255 / 0.92);
}

.account-documents-upload__file-name {
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
  color: var(--black);
  word-break: break-word;
}

.account-documents-upload__file-size {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  color: #64748b;
}

.account__field-hint {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}
</style>

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
    :before-close="handleDialogBeforeClose"
    @closed="$emit('close')"
    @update:model-value="handleModelValueUpdate"
  >
    <form class="account__dialog-form" @submit.prevent="handleSubmit">
      <div class="account__dialog-copy">
        <p class="account__dialog-text">{{ dialogTitle }}</p>
        <p class="account__dialog-hint">
          {{ expiryHint }}
        </p>
      </div>

      <label class="account__field">
        <span class="account__field-label">Файл документа</span>
        <input
          ref="fileInputRef"
          class="account-documents-upload__file-input"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          :disabled="isSubmitting"
          @change="handleFileChange"
        />
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset account-documents-upload__file-button"
          :disabled="isSubmitting"
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
          :value="expiresAt"
          class="account__input"
          type="text"
          inputmode="numeric"
          maxlength="10"
          placeholder="дд.мм.гггг"
          :aria-invalid="Boolean(expiresAtError)"
          @input="handleExpiresAtInput"
        />
        <span class="account__field-hint">
          {{ isExpiryRequired ? 'Обязательно для меддопуска и страховки.' : 'Можно не заполнять для этого документа.' }}
        </span>
        <span v-if="expiresAtError" class="account__field-error">{{ expiresAtError }}</span>
      </label>

      <div class="account__dialog-actions">
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset"
          :disabled="isSubmitting"
          @click="handleClose"
        >
          Отмена
        </button>
        <button
          type="submit"
          class="account__table-action account__table-action--edit account-document-upload__submit btn-reset"
          :disabled="isSubmitting"
          :aria-busy="isSubmitting"
        >
          <span
            v-if="isSubmitting"
            class="account__button-spinner"
            aria-hidden="true"
          ></span>
          Загрузить
        </button>
      </div>
    </form>
  </ElDialog>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'
import { ElDialog } from 'element-plus'
import {
  getAccountDocumentDefinition,
  isAccountDocumentExpiryRequired,
} from '@/pages/account/utils/accountDocumentTypes'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  documentType: {
    type: String,
    default: '',
  },
  initialExpiresAt: {
    type: String,
    default: '',
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'submit'])

const fileInputRef = ref(null)
const selectedFile = ref(null)
const selectedFileDataUrl = ref('')
const selectedFileType = ref('')
const expiresAt = ref('')
const fileError = ref('')
const expiresAtError = ref('')

const dialogTitle = ref('')
const DATE_PATTERN = /^\d{2}\.\d{2}\.\d{4}$/
const isExpiryRequired = computed(() => isAccountDocumentExpiryRequired(props.documentType))
const expiryHint = computed(() =>
  isExpiryRequired.value
    ? 'Загрузите файл и укажите срок действия документа.'
    : 'Загрузите файл. Срок действия для этого документа не обязателен.',
)
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
      return
    }

    expiresAt.value = formatInitialDocumentExpiry(props.initialExpiresAt)
    expiresAtError.value = ''
    fileError.value = ''
  },
  { immediate: true },
)

watch(
  () => props.initialExpiresAt,
  (value) => {
    if (props.modelValue && !selectedFile.value) {
      expiresAt.value = formatInitialDocumentExpiry(value)
    }
  },
)

function handleFileChange(event) {
  if (props.isSubmitting) {
    return
  }

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

function formatDocumentExpiryInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8)
  const day = digits.slice(0, 2)
  const month = digits.slice(2, 4)
  const year = digits.slice(4, 8)

  if (digits.length >= 4) {
    return year ? `${day}.${month}.${year}` : `${day}.${month}.`
  }

  if (digits.length >= 2) {
    return month ? `${day}.${month}` : `${day}.`
  }

  return day
}

function formatInitialDocumentExpiry(value) {
  const normalizedValue = String(value || '').trim()
  const isoMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (isoMatch) {
    return `${isoMatch[3]}.${isoMatch[2]}.${isoMatch[1]}`
  }

  return formatDocumentExpiryInput(normalizedValue)
}

function isValidDocumentExpiryDate(value) {
  if (!DATE_PATTERN.test(value)) {
    return false
  }

  const [day, month, year] = value.split('.').map(Number)
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

function handleExpiresAtInput(event) {
  expiresAt.value = formatDocumentExpiryInput(event.target.value)
  expiresAtError.value = ''
}

function openFilePicker() {
  if (props.isSubmitting) {
    return
  }

  fileInputRef.value?.click()
}

function handleClose() {
  if (props.isSubmitting) {
    return
  }

  emit('close')
}

function handleDialogBeforeClose(done) {
  if (props.isSubmitting) {
    return
  }

  done()
}

function handleModelValueUpdate(value) {
  if (value || props.isSubmitting) {
    return
  }

  emit('close')
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

  expiresAtError.value = ''

  if (isExpiryRequired.value && !expiresAt.value.trim()) {
    expiresAtError.value = 'Укажите срок действия документа.'
    return
  }

  if (expiresAt.value.trim() && !isValidDocumentExpiryDate(expiresAt.value.trim())) {
    expiresAtError.value = 'Введите дату в формате дд.мм.гггг.'
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
}

function resetDialog() {
  selectedFile.value = null
  selectedFileDataUrl.value = ''
  selectedFileType.value = ''
  expiresAt.value = ''
  fileError.value = ''
  expiresAtError.value = ''

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

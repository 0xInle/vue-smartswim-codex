<template>
  <ElDialog
    :model-value="modelValue"
    width="920px"
    append-to-body
    align-center
    destroy-on-close
    class="account__dialog account-competition-details"
    title="Детали соревнования"
    :close-icon="Close"
    @closed="handleClosed"
    @update:model-value="handleModelValueUpdate"
  >
    <form v-if="stage" class="account-competition-details__form" @submit.prevent="submitForm">
      <div class="account-competition-details__title">
        {{ formatCompetitionName(form.competitionName) }} · Этап {{ form.stage || stage.stage }}
      </div>

      <div class="account-competition-details__grid">
        <article class="account-competition-details__card account-competition-details__card--wide">
          <div class="account-competition-details__card-head">
            <span class="account-competition-details__label">Основная информация</span>
          </div>

          <div class="account-competition-details__main-grid">
            <label class="account__field account-competition-details__field account-competition-details__field--name">
              <span class="account__field-label">Название соревнования</span>
              <input
                v-model.trim="form.competitionName"
                class="account__input"
                type="text"
                placeholder="Название соревнования"
              />
            </label>

            <label class="account__field account-competition-details__field account-competition-details__field--small">
              <span class="account__field-label">Этап</span>
              <input
                v-model="form.stage"
                class="account__input"
                type="text"
                inputmode="numeric"
                placeholder="6"
                @input="handlePositiveIntegerInput('stage', $event)"
              />
            </label>

            <label class="account__field account-competition-details__field account-competition-details__field--small">
              <span class="account__field-label">Места</span>
              <input
                v-model="form.registrationLimit"
                class="account__input"
                type="text"
                inputmode="numeric"
                placeholder="0"
                @input="handlePositiveIntegerInput('registrationLimit', $event)"
              />
            </label>

            <label class="account__field account-competition-details__field account-competition-details__field--date">
              <span class="account__field-label">Дата соревнования</span>
              <input
                v-model="form.date"
                class="account__input"
                type="text"
                inputmode="numeric"
                placeholder="дд.мм.гггг"
                @input="handleDateInput('date', $event)"
              />
            </label>

            <label class="account__field account-competition-details__field account-competition-details__field--date">
              <span class="account__field-label">Регистрация</span>
              <div class="account-competition-details__range">
                <input
                  v-model="form.openDate"
                  class="account__input account-competition-details__range-input"
                  type="text"
                  inputmode="numeric"
                  placeholder="дд.мм.гггг"
                  @input="handleDateInput('openDate', $event)"
                />
                <span class="account-competition-details__range-separator">—</span>
                <input
                  v-model="form.closeDate"
                  class="account__input account-competition-details__range-input"
                  type="text"
                  inputmode="numeric"
                  placeholder="дд.мм.гггг"
                  @input="handleDateInput('closeDate', $event)"
                />
              </div>
            </label>
          </div>
        </article>

        <article class="account-competition-details__card account-competition-details__card--wide">
          <div class="account-competition-details__card-head">
            <span class="account-competition-details__label">Документы и материалы</span>
          </div>

          <div class="account-competition-details__link-grid">
            <div
              v-for="link in linkEditors"
              :key="link.key"
              class="account-competition-details__link-row"
            >
              <span class="account-competition-details__link-label">{{ link.label }}:</span>
              <input
                v-model.trim="form[link.modelKey]"
                class="account__input account-competition-details__link-input"
                type="url"
                :placeholder="link.placeholder"
              />
              <button
                type="button"
                class="account__table-action account__table-action--success account-competition-details__link-save btn-reset"
                :disabled="isAnyActionLoading"
                :aria-busy="isLinkSaving(link.key)"
                @click="emit('update-links', buildLinksPayload(link))"
              >
                <span
                  v-if="isLinkSaving(link.key)"
                  class="account__button-spinner"
                  aria-hidden="true"
                ></span>
                Сохранить
              </button>
            </div>
          </div>
        </article>

        <article class="account-competition-details__card account-competition-details__card--wide">
          <div class="account-competition-details__card-head">
            <span class="account-competition-details__label">Настройка дистанции</span>
          </div>

          <div class="account-competition-details__distance-editor">
            <div
              v-for="(item, index) in distanceItems"
              :key="item.id"
              class="account-competition-details__distance-row"
            >
              <label class="account__field">
                <span class="account__field-label account__field-label--table">Дистанция</span>
                <input
                  v-model.trim="item.distance"
                  class="account__input account__input--compact"
                  type="text"
                  placeholder="50 м"
                />
              </label>

              <label class="account__field">
                <span class="account__field-label account__field-label--table">Стиль</span>
                <input
                  v-model.trim="item.label"
                  class="account__input account__input--compact"
                  type="text"
                  placeholder="Вольный стиль"
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
              class="account__table-action account__table-action--ghost account-competition-details__distance-add btn-reset"
              @click="addDistanceRow"
            >
              Добавить дистанцию
            </button>
          </div>
        </article>
      </div>

      <div class="account-competition-details__footer">
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset"
          :disabled="isAnyActionLoading"
          @click="handleClose"
        >
          Закрыть
        </button>
        <button
          type="button"
          class="account__table-action account__table-action--delete btn-reset"
          :disabled="isAnyActionLoading"
          @click="emit('delete-stage', stage)"
        >
          Удаление
        </button>
        <button
          type="submit"
          class="account__table-action account__table-action--success btn-reset"
          :disabled="isAnyActionLoading"
          :aria-busy="isStageSaving"
        >
          <span v-if="isStageSaving" class="account__button-spinner" aria-hidden="true"></span>
          Сохранить
        </button>
      </div>
    </form>

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
  </ElDialog>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { computed, reactive, ref, watch } from 'vue'
import { ElDialog } from 'element-plus'
import { formatCompetitionName } from '@/pages/account/utils/accountFormatters'
import { formatCompetitionDateShortLabel } from '@/utils/competitionRegistration'
import { formatDateInput } from '@/utils/dateInput'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  stage: {
    type: Object,
    default: null,
  },
  actionLoading: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'close',
  'closed',
  'save-stage',
  'delete-stage',
  'update-links',
  'update-distances',
])

const form = reactive({
  competitionName: '',
  stage: '',
  date: '',
  openDate: '',
  closeDate: '',
  registrationLimit: 0,
  protocolUrl: '',
  photoUrl: '',
  certificateUrl: '',
  memoUrl: '',
})

const distanceItems = ref([])
const isDeleteDialogOpen = ref(false)
const pendingDeleteIndex = ref(null)
const isAnyActionLoading = computed(() => Boolean(props.actionLoading))
const isStageSaving = computed(() => props.actionLoading === 'save-stage')

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
  () => [props.modelValue, props.stage],
  () => {
    if (!props.modelValue || !props.stage) {
      return
    }

    form.competitionName = props.stage.competitionName || ''
    form.stage = String(props.stage.stage || '')
    form.date = formatCompetitionDateShortLabel(props.stage.date)
    form.openDate = formatCompetitionDateShortLabel(props.stage.registration?.openAt)
    form.closeDate = formatCompetitionDateShortLabel(props.stage.registration?.closeAt)
    form.registrationLimit = Number(
      props.stage.registrationLimit ?? props.stage.registration?.participantLimit ?? 0,
    )
    form.protocolUrl = props.stage.protocolUrl || ''
    form.photoUrl = props.stage.photoUrl || ''
    form.certificateUrl = props.stage.certificateUrl || ''
    form.memoUrl = props.stage.memoUrl || ''

    distanceItems.value = parseDistanceDescription(props.stage.distanceSummary).map((item) => ({
      ...item,
      id: createDistanceRowId(),
    }))

    if (!distanceItems.value.length) {
      addDistanceRow()
    }
  },
  { immediate: true },
)

function submitForm() {
  if (!props.stage || isAnyActionLoading.value) {
    return
  }

  const stageNumber = Number(form.stage)
  const registrationLimit = Number(form.registrationLimit)
  const nextDate = toIsoDate(form.date)
  const nextOpenDate = toIsoDate(form.openDate)
  const nextCloseDate = toIsoDate(form.closeDate)
  const nextDistanceSummary = formatDistanceDescription(distanceItems.value)
  const payload = {
    stageId: props.stage.id,
  }
  const nextCompetitionName = form.competitionName.trim()
  const nextStage = Number.isInteger(stageNumber) && stageNumber >= 0 ? stageNumber : props.stage.stage
  const nextRegistrationLimit =
    Number.isInteger(registrationLimit) && registrationLimit >= 0 ? registrationLimit : 0
  const nextProtocolUrl = form.protocolUrl.trim()
  const nextPhotoUrl = form.photoUrl.trim()
  const nextCertificateUrl = form.certificateUrl.trim()
  const nextMemoUrl = form.memoUrl.trim()

  if (nextCompetitionName !== String(props.stage.competitionName || '')) {
    payload.competitionName = nextCompetitionName
  }

  if (nextStage !== Number(props.stage.stage)) {
    payload.stage = nextStage
  }

  if (nextDate && nextDate !== toIsoDate(formatCompetitionDateShortLabel(props.stage.date))) {
    payload.date = nextDate
  }

  if (
    nextOpenDate &&
    nextOpenDate !== toIsoDate(formatCompetitionDateShortLabel(props.stage.registration?.openAt))
  ) {
    payload.openAt = nextOpenDate
  }

  if (
    nextCloseDate &&
    nextCloseDate !== toIsoDate(formatCompetitionDateShortLabel(props.stage.registration?.closeAt))
  ) {
    payload.closeAt = nextCloseDate
  }

  if (
    nextRegistrationLimit !==
    Number(props.stage.registrationLimit ?? props.stage.registration?.participantLimit ?? 0)
  ) {
    payload.registrationLimit = nextRegistrationLimit
  }

  if (nextProtocolUrl !== String(props.stage.protocolUrl || '')) {
    payload.protocolUrl = nextProtocolUrl
  }

  if (nextPhotoUrl !== String(props.stage.photoUrl || '')) {
    payload.photoUrl = nextPhotoUrl
  }

  if (nextCertificateUrl !== String(props.stage.certificateUrl || '')) {
    payload.certificateUrl = nextCertificateUrl
  }

  if (nextMemoUrl !== String(props.stage.memoUrl || '')) {
    payload.memoUrl = nextMemoUrl
  }

  if (normalizeDistanceDescription(nextDistanceSummary) !== normalizeDistanceDescription(props.stage.distanceSummary)) {
    payload.distanceDescription = nextDistanceSummary
  }

  emit('save-stage', payload)
}

function isLinkSaving(key) {
  return props.actionLoading === `save-link:${key}`
}

function buildLinksPayload(link) {
  const payload = {
    stageId: props.stage.id,
    linkKey: link.key,
    protocolUrl: undefined,
    photoUrl: undefined,
    certificateUrl: undefined,
    memoUrl: undefined,
  }

  payload[link.modelKey] = String(form[link.modelKey] || '').trim()
  return payload
}

function handleDateInput(field, event) {
  form[field] = formatDateInput(event.target.value)
}

function handlePositiveIntegerInput(field, event) {
  form[field] = String(event.target.value ?? '').replace(/[^\d]/g, '').slice(0, 8)
}

function toIsoDate(value) {
  const normalized = String(value || '').trim()
  const match = normalized.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)

  if (!match) {
    return ''
  }

  return `${match[3]}-${match[2]}-${match[1]}`
}

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

function normalizeDistanceDescription(description = '') {
  return String(description || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '')
    .replace(/^Программа этапа будет уточняться$/i, '')
}

function createDistanceRowId() {
  return `distance-${Math.random().toString(36).slice(2, 10)}`
}

function resetState() {
  form.competitionName = ''
  form.stage = ''
  form.date = ''
  form.openDate = ''
  form.closeDate = ''
  form.registrationLimit = 0
  form.protocolUrl = ''
  form.photoUrl = ''
  form.certificateUrl = ''
  form.memoUrl = ''
  distanceItems.value = []
  closeDeleteDialog()
}

function handleClose() {
  if (isAnyActionLoading.value) {
    return
  }

  emit('close')
}

function handleModelValueUpdate(value) {
  if (!value) {
    emit('close')
  }
}

function handleClosed() {
  resetState()
  emit('closed')
}
</script>

<style scoped>
.account-competition-details__form {
  display: grid;
  gap: 18px;
}

.account-competition-details__title {
  font-family: Oswald, sans-serif;
  font-size: 28px;
  line-height: 1;
  text-transform: uppercase;
  color: var(--black);
}

.account-competition-details__grid {
  display: grid;
  gap: 14px;
}

.account-competition-details__card {
  display: grid;
  gap: 16px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 14%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.9);
  box-shadow: 0 14px 30px rgb(15 23 42 / 0.06);
}

.account-competition-details__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.account-competition-details__label {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6a7481;
}

.account-competition-details__main-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) 160px 160px;
}

.account-competition-details__field {
  min-width: 0;
}

.account-competition-details__field--name {
  grid-column: 1;
}

.account-competition-details__field--date {
  grid-column: span 1;
}

.account-competition-details__field--small {
  max-width: none;
}

.account-competition-details__field--date:last-child {
  grid-column: 2 / -1;
}

.account-competition-details__range {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.account-competition-details__range-input {
  min-width: 0;
}

.account-competition-details__range-separator {
  color: #8b96a5;
  font-weight: 900;
}

.account-competition-details__link-grid {
  display: grid;
  gap: 12px;
}

.account-competition-details__link-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) 124px;
  gap: 10px;
  align-items: center;
}

.account-competition-details__link-label {
  font-weight: 900;
  color: #334155;
  white-space: nowrap;
}

.account-competition-details__link-input {
  min-width: 0;
}

.account-competition-details__link-save {
  min-height: 38px;
}

.account-competition-details__distance-editor {
  display: grid;
  gap: 12px;
}

.account-competition-details__distance-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 10px;
  align-items: end;
}

.account-competition-details__distance-add {
  justify-self: start;
}

.account-competition-details__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

@media (max-width: 860px) {
  .account-competition-details__main-grid {
    grid-template-columns: 1fr;
  }

  .account-competition-details__field--name,
  .account-competition-details__field--date,
  .account-competition-details__field--small {
    grid-column: auto;
    max-width: none;
  }

  .account-competition-details__range,
  .account-competition-details__link-row,
  .account-competition-details__distance-row {
    grid-template-columns: 1fr;
  }
}
</style>

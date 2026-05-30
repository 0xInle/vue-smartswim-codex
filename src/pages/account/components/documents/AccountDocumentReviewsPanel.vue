<template>
  <ElCard class="account__panel account-document-review" shadow="never">
    <div class="account-document-review__header">
      <div class="account__panel-head account-document-review__panel-head">
        <div class="account__panel-actions">
          <ElTag type="warning" effect="light" round>{{ summary.pending }} на проверке</ElTag>
          <ElTag type="success" effect="light" round>{{ summary.verified }} проверено</ElTag>
          <ElTag
            class="account-document-review__meta-tag account-document-review__meta-tag--info"
            type="primary"
            effect="light"
            round
          >
            {{ summary.usersWithDocuments }} с документами / {{ summary.totalUsers }} пользователей
          </ElTag>
        </div>
      </div>

      <div class="account-document-review__filters">
        <label class="account__field account__field--search">
          <span class="account__field-label">Поиск</span>
          <input
            v-model.trim="search"
            class="account__input account__input--toolbar"
            type="search"
            name="document-review-search"
            placeholder="Поиск по пользователям"
          />
        </label>

        <label class="account__field account__field--filter account-document-review__filter-field">
          <span class="account__field-label">Статус</span>
          <ElSelect
            v-model="statusFilter"
            class="account__select account-document-review__status-select"
            popper-class="account__select-popper"
            placeholder="Все статусы"
          >
            <ElOption
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </label>

        <div class="account-document-review__meta">
          <ElTag
            class="account-document-review__meta-tag account-document-review__meta-tag--expired"
            type="danger"
            effect="light"
            round
          >
            {{ summary.expired }} просрочено
          </ElTag>
          <ElButton class="account__refresh-button" plain type="primary" @click="refresh">
            Обновить
          </ElButton>
        </div>
      </div>
    </div>

    <div v-if="groupedRows.length" class="account__native-table-wrap">
      <table class="account__native-table account__native-table--documents">
        <thead class="account__native-table-head">
          <tr>
            <th class="account__native-table-head-cell--sortable">
              <button
                type="button"
                class="account__table-sort-button account__table-sort-button--left btn-reset"
                :class="{ 'account__table-sort-button--active': sortKey === 'participantName' }"
                :aria-label="getSortAriaLabel('Участник', 'participantName')"
                @click="toggleSort('participantName')"
              >
                <span>Участник</span>
                <span
                  class="account__table-sort-indicator"
                  :data-direction="getSortDirection('participantName')"
                  aria-hidden="true"
                ></span>
              </button>
            </th>
            <th>Статус</th>
            <th>Действие</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="group in sortedGroupedRows" :key="group.id" class="account__native-table-row">
            <td class="account__native-table-cell account__native-table-cell--primary">
              <div class="account__table-user">
                <div class="account__table-primary">{{ group.participantName }}</div>
                <div class="account__table-secondary">
                  <span v-if="group.ownerName">{{ group.ownerName }}</span>
                  <span v-if="group.ownerEmail"> · {{ group.ownerEmail }}</span>
                </div>
              </div>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <span class="account-document-review__status" :class="`account-document-review__status--${group.statusMeta.status}`">
                {{ group.statusMeta.label }}
              </span>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <button
                type="button"
                class="account-document-review__open-button btn-reset"
                @click="openGroup(group)"
              >
                Проверить документы
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else description="Документы не найдены." />

    <ElDialog
      :model-value="groupDialogState.isOpen"
      width="760px"
      append-to-body
      align-center
      destroy-on-close
      class="account__dialog"
      title="Документы пользователя"
      :close-icon="Close"
      @closed="closeGroupDialog"
      @update:model-value="!$event && closeGroupDialog()"
    >
      <div v-if="selectedGroup" class="account-document-review__dialog">
        <div class="account-document-review__dialog-head">
          <div class="account-document-review__dialog-copy">
            <p class="account__dialog-text">{{ selectedGroup.participantName }}</p>
            <p class="account__dialog-hint">
              Владелец ЛК: {{ selectedGroup.ownerName }}
              <span v-if="selectedGroup.participantBirthDate">
                · {{ selectedGroup.participantBirthDate }}
              </span>
            </p>
          </div>

          <div class="account-document-review__admit-slot">
            <button
              type="button"
              class="account__submit account-document-review__admit-button btn-reset"
              :disabled="!selectedGroup.statusMeta.canAdmit"
              @click="handleAdmitAndClose(selectedGroup)"
            >
              Допустить спортсмена
            </button>
          </div>
        </div>

        <div class="account-document-review__workflow">
          <article class="account-document-review__workflow-card">
            <span class="account-document-review__workflow-label">Документы</span>
            <strong class="account-document-review__workflow-value">
              {{ documentsWorkflowMeta.label }}
            </strong>
            <span class="account-document-review__workflow-description">
              {{ documentsWorkflowMeta.description }}
            </span>
          </article>

          <article class="account-document-review__workflow-card">
            <span class="account-document-review__workflow-label">Финальный допуск</span>
            <strong class="account-document-review__workflow-value">
              {{ finalAdmissionWorkflowMeta.label }}
            </strong>
            <span class="account-document-review__workflow-description">
              {{ finalAdmissionWorkflowMeta.description }}
            </span>
          </article>
        </div>

        <div class="account-document-review__document-list">
          <article
            v-for="document in selectedGroup.documents"
            :key="document.id || document.type"
            class="account-document-review__document-item"
            :class="`account-document-review__document-item--${documentState(document)}`"
          >
            <div class="account-document-review__document-copy">
              <div class="account-document-review__document-title-row">
                <div class="account-document-review__document-title-copy">
                  <h4 class="account-document-review__document-title">{{ document.label }}</h4>
                  <p class="account-document-review__document-hint">{{ document.hint }}</p>
                </div>

                <ElTag
                  :type="documentStatusTagType(document)"
                  effect="light"
                  round
                  class="account-document-review__status account-document-review__status--plain"
                  :class="`account-document-review__status--${documentState(document)}`"
                >
                  {{ documentStatusLabel(document) }}
                </ElTag>
              </div>

              <div class="account-document-review__document-meta">
                <span>
                  Файл:
                  <a
                    v-if="getDocumentPreviewUrl(document)"
                    class="account-document-review__download-link"
                    :href="getDocumentPreviewUrl(document)"
                    :download="document.fileName || document.label"
                  >
                    {{ document.fileName || 'Скачать файл' }}
                  </a>
                  <span v-else>{{ document.fileName || 'Не загружен' }}</span>
                </span>
                <div class="account-document-review__document-dates">
                  <span>Срок: {{ formatAccountDocumentDate(document.expiresAt) }}</span>
                  <span>Загружен: {{ formatCompactDateTime(document.uploadedAt) }}</span>
                  <span>Проверен: {{ formatDocumentReviewDate(document) }}</span>
                </div>
                <span v-if="document.rejectionReason">Причина: {{ document.rejectionReason }}</span>
              </div>
            </div>

            <div class="account-document-review__document-actions">
              <button
                type="button"
                class="account__table-action account__table-action--success btn-reset"
                :disabled="!canReviewDocument(document)"
                @click="handleApprove(document)"
              >
                Одобрить
              </button>
              <button
                type="button"
                class="account__table-action account__table-action--delete btn-reset"
                :disabled="!canReviewDocument(document)"
                @click="openReviewDialog(document, 'reject')"
              >
                Отклонить
              </button>
            </div>
          </article>
        </div>

      </div>
    </ElDialog>

    <ElDialog
      :model-value="reviewDialogState.isOpen"
      width="560px"
      append-to-body
      align-center
      destroy-on-close
      class="account__dialog"
      :title="reviewDialogTitle"
      :close-icon="Close"
      @closed="closeReviewDialogState"
      @update:model-value="!$event && closeReviewDialogState()"
    >
      <form class="account__dialog-form" @submit.prevent="submitReviewDialog">
        <div class="account__dialog-copy">
          <p class="account__dialog-text">{{ reviewDialogHint }}</p>
          <p class="account__dialog-hint">
            {{
              reviewRecord?.documentLabel ||
              'Выберите документ, чтобы оставить комментарий и применить решение.'
            }}
          </p>
        </div>

        <label class="account__field">
          <span class="account__field-label">Комментарий</span>
          <textarea
            v-model.trim="reviewDialogState.reason"
            class="account__textarea"
            rows="4"
            placeholder="Причина отклонения"
          ></textarea>
          <p v-if="reviewDialogError" class="account__field-error account-document-review__error">
            {{ reviewDialogError }}
          </p>
        </label>

        <div class="account__dialog-actions">
          <button
            type="button"
            class="account__table-action account__table-action--ghost btn-reset"
            @click="closeReviewDialogState"
          >
            Отмена
          </button>
          <button type="submit" class="account__submit btn-reset">
            Отклонить
          </button>
        </div>
      </form>
    </ElDialog>
  </ElCard>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { computed, reactive, toRef, watch } from 'vue'
import { ElButton, ElCard, ElDialog, ElEmpty, ElOption, ElSelect, ElTag } from 'element-plus'
import { useAccountDocumentReviews } from '@/pages/account/composables/useAccountDocumentReviews'
import { useTriStateTextSort } from '@/pages/account/composables/useTriStateTextSort'
import { getAccountDocumentDisplayStatus } from '@/pages/account/utils/accountFormatters'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
})

const GROUP_STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'missing', label: 'Документ не загружен' },
  { value: 'pending', label: 'На проверке' },
  { value: 'ready', label: 'Готов к допуску' },
  { value: 'admitted', label: 'Допуск подтвержден' },
  { value: 'attention', label: 'Требует внимания' },
]

const statusOptions = GROUP_STATUS_OPTIONS

function getCurrentUserKey(user) {
  if (!user) {
    return ''
  }

  return [user.id || '', user.email || '', user.role || ''].join(':')
}

const {
  groupedRows,
  summary,
  search,
  statusFilter,
  reviewDialogState,
  reviewDialogError,
  reviewRecord,
  reviewDialogTitle,
  reviewDialogHint,
  closeReviewDialog: closeReviewDialogState,
  openReviewDialog,
  handleApprove,
  handleAdmit,
  submitReviewDialog,
  refresh,
  formatAccountDocumentDate,
  formatCompactDateTime,
} = useAccountDocumentReviews({
  currentUser: toRef(props, 'currentUser'),
})

const { sortKey, toggleSort, getSortState, sortItems } =
  useTriStateTextSort('participantName')

const sortedGroupedRows = computed(() =>
  sortItems(groupedRows.value, {
    participantName: (group) => group.participantName || '',
  }),
)

function getSortIndicator(columnKey) {
  const state = getSortState(columnKey)

  if (!state.isActive) {
    return 'none'
  }

  return state.direction === 'desc' ? 'desc' : 'asc'
}

function getSortDirection(columnKey) {
  return getSortIndicator(columnKey)
}

function getSortAriaLabel(label, columnKey) {
  const state = getSortState(columnKey)

  if (!state.isActive) {
    return `Сортировать по ${label} по возрастанию`
  }

  if (state.direction === 'asc') {
    return `Сортировать по ${label} по убыванию`
  }

  return `Сбросить сортировку по ${label}`
}

const groupDialogState = reactive({
  isOpen: false,
  selectedGroupId: '',
})

const selectedGroup = computed(
  () => groupedRows.value.find((group) => group.id === groupDialogState.selectedGroupId) || null,
)

const documentsWorkflowMeta = computed(() => {
  const group = selectedGroup.value

  if (!group) {
    return {
      label: 'Нет данных',
      description: 'Выберите участника, чтобы увидеть статус документов.',
    }
  }

  if (group.statusMeta.status === 'admitted') {
    return {
      label: 'Документы одобрены',
      description: 'Документы были проверены, финальный допуск уже подтвержден.',
    }
  }

  if (group.statusMeta.status === 'ready') {
    return {
      label: 'Документы готовы',
      description: 'Все обязательные документы одобрены. Осталось подтвердить финальный допуск.',
    }
  }

  return {
    label: group.statusMeta.label,
    description: group.statusMeta.description,
  }
})

const finalAdmissionWorkflowMeta = computed(() => {
  const group = selectedGroup.value

  if (!group) {
    return {
      label: 'Нет данных',
      description: 'Выберите участника, чтобы увидеть финальный допуск.',
    }
  }

  if (group.statusMeta.status === 'admitted') {
    return {
      label: 'Допуск подтвержден',
      description: group.statusMeta.description,
    }
  }

  if (group.statusMeta.status === 'ready') {
    return {
      label: 'Ожидает решения',
      description: 'Нажмите “Допустить спортсмена”, когда секретарь подтвердит участие.',
    }
  }

  return {
    label: 'Недоступен',
    description: 'Финальный допуск станет доступен после одобрения обязательных документов.',
  }
})

function openGroup(group) {
  groupDialogState.isOpen = true
  groupDialogState.selectedGroupId = group.id
}

function closeGroupDialog() {
  groupDialogState.isOpen = false
  groupDialogState.selectedGroupId = ''
  closeReviewDialogState()
}

function handleAdmitAndClose(group) {
  handleAdmit(group)
  closeGroupDialog()
}

function documentStatusLabel(document) {
  return getAccountDocumentDisplayStatus(document).label
}

function documentState(document) {
  return getAccountDocumentDisplayStatus(document).status
}

function documentStatusTagType(document) {
  return getAccountDocumentDisplayStatus(document).tagType
}

function formatDocumentReviewDate(document) {
  if (!document?.verifiedAt || document.status === 'uploaded') {
    return '—'
  }

  return formatCompactDateTime(document.verifiedAt)
}

function canReviewDocument(document) {
  return Boolean(getDocumentPreviewUrl(document))
}

function getDocumentPreviewUrl(document) {
  return document?.fileDataUrl || document?.fileUrl || ''
}

watch(
  () => getCurrentUserKey(props.currentUser),
  (nextUserKey, previousUserKey) => {
    if (nextUserKey !== previousUserKey) {
      closeGroupDialog()
    }
  },
)
</script>

<style scoped>
.account-document-review__header {
  display: grid;
  gap: 18px;
  margin-bottom: 16px;
}

.account-document-review__panel-head {
  justify-content: flex-end;
}

.account-document-review__filters {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1.2fr) auto;
  gap: 12px;
  align-items: end;
}

.account-document-review__filter-field {
  min-width: 0;
}

.account-document-review__status-select {
  width: 100%;
}

.account-document-review__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.account-document-review__meta-tag--info {
  border-width: 1px;
  border-style: solid;
  border-color: #dbe7f4;
  font-weight: 800;
}

.account-document-review__meta-tag--expired {
  min-height: 38px;
  padding-inline: 16px;
  border: 1px solid color-mix(in srgb, var(--orange) 24%, white);
  font-weight: 800;
}

.account-document-review__meta .el-tag.account-document-review__meta-tag--expired {
  border-radius: 10px;
}

.account-document-review__status {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.account-document-review__status--plain {
  display: inline-flex;
}

.account-document-review__status--verified:not(.account-document-review__status--plain),
.account-document-review__status--ready:not(.account-document-review__status--plain),
.account-document-review__status--admitted:not(.account-document-review__status--plain) {
  color: #2f8f5b;
}

.account-document-review__status--uploaded:not(.account-document-review__status--plain),
.account-document-review__status--pending:not(.account-document-review__status--plain) {
  color: #176384;
}

.account-document-review__status--rejected:not(.account-document-review__status--plain),
.account-document-review__status--needs_reupload:not(.account-document-review__status--plain),
.account-document-review__status--expired:not(.account-document-review__status--plain),
.account-document-review__status--attention:not(.account-document-review__status--plain) {
  color: #d76034;
}

.account-document-review__status--missing:not(.account-document-review__status--plain) {
  color: #64748b;
}

.account-document-review__dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.account-document-review__admit-slot {
  display: flex;
  align-self: stretch;
  align-items: flex-end;
}

.account-document-review__admit-button {
  flex: 0 0 auto;
  min-height: 38px;
  white-space: nowrap;
  line-height: 1;
}

.account-document-review__admit-button:disabled {
  cursor: not-allowed;
}

.account__native-table--documents .account__native-table-cell {
  vertical-align: middle;
}

.account-document-review__open-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 8px 16px;
  border: 1px solid #dbe7f4;
  border-radius: 10px;
  background: transparent;
  font-size: 14px;
  font-weight: 800;
  color: var(--el-color-primary);
  line-height: 1;
  letter-spacing: 0;
  cursor: pointer;
}

.account-document-review__open-button:hover,
.account-document-review__open-button:focus-visible {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  outline: none;
}

.account-document-review__dialog {
  display: grid;
  gap: 16px;
}

.account-document-review__dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account-document-review__dialog-copy {
  display: grid;
  gap: 6px;
}

.account-document-review__workflow {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.account-document-review__workflow-card {
  display: grid;
  gap: 6px;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.86);
}

.account-document-review__workflow-label {
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
  line-height: 1.2;
  text-transform: uppercase;
}

.account-document-review__workflow-value {
  color: var(--black);
  font-family: 'Oswald', sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.account-document-review__workflow-description {
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.35;
}

.account-document-review__document-list {
  display: grid;
  gap: 10px;
}

.account-document-review__document-item {
  display: grid;
  gap: 14px;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--cyan) 14%, white);
  border-radius: 10px;
  background: transparent;
}

.account-document-review__document-item--verified {
  border-color: color-mix(in srgb, var(--cyan) 28%, white);
}

.account-document-review__document-item--rejected,
.account-document-review__document-item--needs_reupload,
.account-document-review__document-item--expired {
  border-color: color-mix(in srgb, var(--orange) 28%, white);
}

.account-document-review__document-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account-document-review__document-title-copy {
  display: grid;
  gap: 4px;
}

.account-document-review__document-title {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.2;
  color: var(--black);
}

.account-document-review__document-hint {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
  color: #64748b;
}

.account-document-review__document-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.45;
  color: var(--black);
}

.account-document-review__document-dates {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.account-document-review__download-link {
  font-weight: 900;
  color: #176384;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.account-document-review__document-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

@media (max-width: 1120px) {
  .account-document-review__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .account-document-review__filters {
    grid-template-columns: 1fr;
  }

  .account-document-review__meta {
    justify-content: flex-start;
  }

  .account-document-review__dialog-head,
  .account-document-review__document-title-row {
    flex-direction: column;
  }

  .account-document-review__workflow {
    grid-template-columns: 1fr;
  }

  .account-document-review__document-actions {
    flex-direction: column;
  }

  .account-document-review__document-actions > * {
    width: 100%;
  }

  .account-document-review__document-dates {
    flex-direction: column;
    gap: 4px;
  }
}
</style>

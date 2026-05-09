<template>
  <ElCard class="account__panel account-document-review" shadow="never">
    <div class="account-document-review__header">
      <div class="account__panel-head">
        <div>
          <h3 class="account__panel-title">Проверка документов</h3>
        </div>
        <div class="account__panel-actions">
          <ElTag type="warning" effect="light" round>{{ summary.pending }} на проверке</ElTag>
          <ElTag type="success" effect="light" round>{{ summary.verified }} проверено</ElTag>
          <ElTag type="danger" effect="light" round>{{ summary.needsReview }} на доработку</ElTag>
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
            placeholder="ФИО, email, документ"
          />
        </label>

        <label class="account__field account__field--filter">
          <span class="account__field-label">Статус</span>
          <ElSelect
            v-model="statusFilter"
            class="account__select"
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
          <ElTag type="primary" effect="light" round>{{ summary.total }} документов</ElTag>
          <ElTag type="info" effect="light" round>{{ summary.expired }} просрочено</ElTag>
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
            <th>Участник</th>
            <th>Статус</th>
            <th>Срок</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="group in groupedRows" :key="group.id" class="account__native-table-row">
            <td class="account__native-table-cell account__native-table-cell--primary">
              <div class="account__table-user">
                <div class="account__table-primary">{{ group.ownerName }}</div>
                <div class="account__table-secondary">
                  <span v-if="group.ownerEmail">{{ group.ownerEmail }}</span>
                </div>
                <button
                  type="button"
                  class="account-document-review__open-button btn-reset"
                  @click="openGroup(group)"
                >
                  Проверить документы
                </button>
              </div>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <span class="account-document-review__status" :class="`account-document-review__status--${group.statusMeta.status}`">
                {{ group.statusMeta.label }}
              </span>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <div class="account__table-user account__table-user--compact">
                <div class="account__table-primary">{{ group.expiryLabel }}</div>
                <div class="account__table-secondary">{{ group.documentCount }} документов</div>
              </div>
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
            <p class="account__dialog-text">{{ selectedGroup.ownerName }}</p>
            <p class="account__dialog-hint">
              <span v-if="selectedGroup.ownerEmail">· {{ selectedGroup.ownerEmail }}</span>
            </p>
          </div>

          <div class="account__panel-actions">
            <ElTag :type="selectedGroup.statusMeta.tagType" effect="light" round>
              {{ selectedGroup.statusMeta.label }}
            </ElTag>
            <ElTag type="info" effect="light" round>
              {{ selectedGroup.documentCount }} документов
            </ElTag>
          </div>
        </div>

        <div class="account-document-review__document-list">
          <article
            v-for="document in selectedGroup.documents"
            :key="document.type"
            class="account-document-review__document-item"
            :class="`account-document-review__document-item--${documentState(document)}`"
          >
            <div class="account-document-review__document-copy">
              <div class="account-document-review__document-title-row">
                <div class="account-document-review__document-title-copy">
                  <h4 class="account-document-review__document-title">{{ document.label }}</h4>
                  <p class="account-document-review__document-hint">{{ document.hint }}</p>
                </div>

                <span
                  class="account-document-review__status account-document-review__status--plain"
                  :class="`account-document-review__status--${documentState(document)}`"
                >
                  {{ documentStatusLabel(document) }}
                </span>
              </div>

              <div class="account-document-review__document-meta">
                <span>
                  Файл:
                  <a
                    v-if="document.fileDataUrl"
                    class="account-document-review__download-link"
                    :href="document.fileDataUrl"
                    :download="document.fileName || document.label"
                  >
                    {{ document.fileName || 'Скачать' }}
                  </a>
                  <span v-else>{{ document.fileName || 'Не загружен' }}</span>
                </span>
                <span>Срок: {{ formatAccountDocumentDate(document.expiresAt) }}</span>
                <span>Загружен: {{ formatCompactDateTime(document.uploadedAt) }}</span>
                <span>Проверен: {{ formatCompactDateTime(document.verifiedAt || document.reviewedAt) }}</span>
                <span v-if="document.rejectionReason">Причина: {{ document.rejectionReason }}</span>
              </div>
            </div>

            <div class="account-document-review__document-actions">
              <button
                type="button"
                class="account__table-action account__table-action--success btn-reset"
                @click="handleApprove(document)"
              >
                Проверить
              </button>
              <button
                type="button"
                class="account__table-action account__table-action--delete btn-reset"
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
import { getAccountDocumentDisplayStatus, getAccountDocumentsAdmissionStatus } from '@/pages/account/utils/accountFormatters'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
})

const GROUP_STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'missing', label: 'Не загружен' },
  { value: 'pending', label: 'На проверке' },
  { value: 'admitted', label: 'Допущен' },
  { value: 'attention', label: 'Требует внимания' },
]

const statusOptions = GROUP_STATUS_OPTIONS

const {
  records,
  summary,
  search,
  statusFilter,
  reviewDialogState,
  reviewRecord,
  reviewDialogTitle,
  reviewDialogHint,
  closeReviewDialog: closeReviewDialogState,
  openReviewDialog,
  handleApprove,
  submitReviewDialog,
  refresh,
  formatAccountDocumentDate,
  formatCompactDateTime,
} = useAccountDocumentReviews({
  currentUser: toRef(props, 'currentUser'),
})

const groupDialogState = reactive({
  isOpen: false,
  selectedGroupId: '',
})

const groupedRows = computed(() => {
  const grouped = new Map()
  const normalizedSearch = String(search.value || '').trim().toLowerCase()

  records.value.forEach((record) => {
    const groupId = getGroupId(record)
    const current = grouped.get(groupId)

    if (current) {
      current.documents.push(record)
      return
    }

    grouped.set(groupId, {
      id: groupId,
      ownerUserKey: record.ownerUserKey || 'anonymous',
      ownerName: record.ownerName || 'Не указан',
      ownerEmail: record.ownerEmail || '',
      participantName: record.ownerName || record.participantName || 'Без имени',
      documents: [record],
    })
  })

  return Array.from(grouped.values())
    .map((group) => {
      const statusMeta = getAccountDocumentsAdmissionStatus(group.documents)
      const expiryLabel = resolveExpiryLabel(group.documents)
      const haystack = [
        group.ownerName,
        group.ownerEmail,
        group.participantName,
        ...group.documents.flatMap((document) => [
          document.documentLabel,
          document.documentType,
          document.fileName,
          document.rejectionReason,
          document.status,
        ]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return {
        ...group,
        statusMeta,
        expiryLabel,
        documentCount: group.documents.length,
        haystack,
      }
    })
    .filter((group) => {
      if (statusFilter.value !== 'all' && group.statusMeta.status !== statusFilter.value) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return group.haystack.includes(normalizedSearch)
    })
    .sort((left, right) => {
      const leftTime = getGroupSortTime(left.documents)
      const rightTime = getGroupSortTime(right.documents)

      return rightTime - leftTime
    })
})

const selectedGroup = computed(
  () => groupedRows.value.find((group) => group.id === groupDialogState.selectedGroupId) || null,
)

function getGroupId(record) {
  return record.ownerUserKey || 'anonymous'
}

function getGroupSortTime(documents) {
  return documents.reduce((max, document) => {
    const candidate = Date.parse(document.reviewedAt || document.uploadedAt || 0) || 0
    return Math.max(max, candidate)
  }, 0)
}

function resolveExpiryLabel(documents) {
  const nextExpiry = documents
    .map((document) => document?.expiresAt || '')
    .filter(Boolean)
    .map((value) => ({ raw: value, time: parseDocumentDate(value)?.getTime() || 0 }))
    .sort((left, right) => left.time - right.time)[0]?.raw

  return nextExpiry ? formatAccountDocumentDate(nextExpiry) : 'Не указан'
}

function parseDocumentDate(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue) {
    return null
  }

  const isoMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (isoMatch) {
    return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T23:59:59`)
  }

  const ruMatch = normalizedValue.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)

  if (ruMatch) {
    return new Date(`${ruMatch[3]}-${ruMatch[2]}-${ruMatch[1]}T23:59:59`)
  }

  const parsed = new Date(normalizedValue)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function openGroup(group) {
  groupDialogState.isOpen = true
  groupDialogState.selectedGroupId = group.id
}

function closeGroupDialog() {
  groupDialogState.isOpen = false
  groupDialogState.selectedGroupId = ''
  closeReviewDialogState()
}

function documentStatusLabel(document) {
  return getAccountDocumentDisplayStatus(document).label
}

function documentState(document) {
  return getAccountDocumentDisplayStatus(document).status
}

watch(
  () => props.currentUser,
  () => {
    closeGroupDialog()
  },
)
</script>

<style scoped>
.account-document-review__header {
  display: grid;
  gap: 18px;
  margin-bottom: 16px;
}

.account-document-review__filters {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.account-document-review__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.account-document-review__status {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.account-document-review__status--plain {
  display: inline-flex;
}

.account-document-review__status--verified,
.account-document-review__status--admitted {
  color: #2f8f5b;
}

.account-document-review__status--uploaded,
.account-document-review__status--pending {
  color: #176384;
}

.account-document-review__status--rejected,
.account-document-review__status--needs_reupload,
.account-document-review__status--expired,
.account-document-review__status--attention {
  color: #d76034;
}

.account-document-review__status--missing {
  color: #64748b;
}

.account__native-table--documents .account__native-table-cell {
  vertical-align: middle;
}

.account-document-review__open-button {
  justify-self: start;
  margin-top: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  font-size: 12px;
  font-weight: 900;
  color: #176384;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.account-document-review__open-button:hover,
.account-document-review__open-button:focus-visible {
  color: color-mix(in srgb, #176384 78%, var(--black) 22%);
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
  background: linear-gradient(180deg, rgb(246 251 255 / 0.94) 0%, rgb(255 255 255 / 0.88) 100%);
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
  display: grid;
  gap: 4px;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.45;
  color: var(--black);
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

  .account-document-review__document-actions {
    flex-direction: column;
  }

  .account-document-review__document-actions > * {
    width: 100%;
  }
}
</style>

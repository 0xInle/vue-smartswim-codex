<template>
  <ElCard class="account__panel account-trainer-athletes" shadow="never">
    <div class="account-trainer-athletes__header">
      <div class="account__panel-head account-trainer-athletes__panel-head">
        <div class="account__panel-actions account-trainer-athletes__summary">
          <ElTag type="danger" effect="light" round> {{ summary.newCount }} новых </ElTag>
          <ElTag type="warning" effect="light" round> {{ summary.inWorkCount }} в работе </ElTag>
          <ElTag type="success" effect="light" round> {{ summary.closedCount }} завершено </ElTag>
          <ElTag type="primary" effect="light" round> {{ summary.totalCount }} заявок </ElTag>
        </div>
      </div>

      <div class="account-trainer-athletes__filters">
        <label class="account__field account__field--search">
          <span class="account__field-label">Поиск</span>
          <input
            v-model.trim="search"
            class="account__input account__input--toolbar"
            type="search"
            name="trainer-athletes-search"
            placeholder="Поиск по ФИО или email"
          />
        </label>

        <label class="account__field account__field--filter account-trainer-athletes__filter-field">
          <span class="account__field-label">Статус заявки</span>
          <ElSelect
            v-model="statusFilter"
            class="account__select account-trainer-athletes__status-select account-trainer-athletes__status-select--toolbar"
            popper-class="account__select-popper"
            placeholder="Все статусы"
          >
            <ElOption
              v-for="option in statusFilterOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </label>

        <div class="account-trainer-athletes__meta">
          <ElButton class="account__refresh-button" plain type="primary" @click="refresh">
            Обновить
          </ElButton>
        </div>
      </div>
    </div>

    <div v-if="filteredGroups.length" class="account__native-table-wrap">
      <table class="account__native-table account__native-table--trainer-athletes">
        <thead class="account__native-table-head">
          <tr>
            <th>ФИО</th>
            <th>Дата заявки</th>
            <th>Статус заявки</th>
            <th>Действие</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="group in filteredGroups" :key="group.id" class="account__native-table-row">
            <td class="account__native-table-cell account__native-table-cell--primary">
              <div class="account__table-user">
                <div class="account__table-primary">{{ group.ownerName || 'Не указан' }}</div>
                <div class="account__table-secondary">
                  {{ group.ownerEmail || 'Почта не указана' }}
                </div>
              </div>
            </td>

            <td class="account__native-table-cell account__native-table-cell--center">
              {{ formatApplicationDate(group) }}
            </td>

            <td class="account__native-table-cell account__native-table-cell--center">
              <ElSelect
                :model-value="group.statusMeta.status"
                class="account__select account-trainer-athletes__status-select account-trainer-athletes__status-select--inline"
                popper-class="account__select-popper"
                @update:model-value="handleStatusChange(group, $event)"
              >
                <ElOption
                  v-for="option in statusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </td>

            <td class="account__native-table-cell account__native-table-cell--center">
              <button
                type="button"
                class="account__table-action account__table-action--edit btn-reset"
                @click="openGroup(group)"
              >
                Открыть
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else description="Заявки спортсменов не найдены." />

    <ElDialog
      :model-value="groupDialogState.isOpen"
      width="640px"
      append-to-body
      align-center
      destroy-on-close
      class="account__dialog"
      title="Комментарий по заявке"
      :close-icon="Close"
      @closed="closeGroupDialog"
      @update:model-value="!$event && closeGroupDialog()"
    >
      <form v-if="selectedGroup" class="account__dialog-form" @submit.prevent="handleSaveComment">
        <div class="account__dialog-copy">
          <p class="account__dialog-text">{{ selectedGroup.ownerName || 'Не указан' }}</p>
        </div>

        <label class="account__field">
          <textarea
            v-model.trim="form.comment"
            class="account__textarea"
            rows="5"
            placeholder="Добавьте комментарий для этой заявки"
          ></textarea>
        </label>

        <div class="account__dialog-actions">
          <button
            type="button"
            class="account__table-action account__table-action--ghost btn-reset"
            @click="closeGroupDialog"
          >
            Отмена
          </button>
          <button type="submit" class="account__submit btn-reset" :disabled="isSaving">
            {{ isSaving ? 'Сохраняем...' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </ElDialog>
  </ElCard>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { computed, reactive, ref, toRef, watch } from 'vue'
import { ElButton, ElCard, ElDialog, ElEmpty, ElOption, ElSelect, ElTag } from 'element-plus'
import { useAccountDocumentReviews } from '@/pages/account/composables/useAccountDocumentReviews'
import {
  ATHLETE_APPLICATION_STATUS,
  CONSULTATION_STATUS,
} from '@/pages/account/utils/accountConstants'
import {
  readAccountAthleteApplication,
  upsertAccountAthleteApplication,
} from '@/pages/account/utils/accountAthleteApplications'
import { resolveAccountAdmissionStatus } from '@/pages/account/utils/accountAdmissions'
import { formatCompactDateTime } from '@/pages/account/utils/accountFormatters'
import { showToast } from '@/utils/toast'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
})

const { groupedRows, refresh } = useAccountDocumentReviews({
  currentUser: toRef(props, 'currentUser'),
})

const search = ref('')
const statusFilter = ref('all')
const isSaving = ref(false)
const statusMetaOverrides = reactive({})

const groupDialogState = reactive({
  isOpen: false,
  selectedGroupId: '',
})

const form = reactive({
  comment: '',
})

const statusOptions = [
  { value: CONSULTATION_STATUS.NEW, label: 'Новая' },
  { value: CONSULTATION_STATUS.PROCESSED, label: 'В работе' },
  { value: CONSULTATION_STATUS.CALL_BACK, label: 'Перезвонить' },
  { value: CONSULTATION_STATUS.BUSY, label: 'Телефон занят' },
  { value: CONSULTATION_STATUS.UNAVAILABLE, label: 'Недоступен' },
  { value: CONSULTATION_STATUS.SCHEDULED, label: 'Запланирована' },
  { value: CONSULTATION_STATUS.CLOSED, label: 'Закрыта' },
  { value: ATHLETE_APPLICATION_STATUS.NEEDS_DATA, label: 'Нужны данные' },
  { value: ATHLETE_APPLICATION_STATUS.READY, label: 'Готово' },
  { value: ATHLETE_APPLICATION_STATUS.ADMITTED, label: 'Допущен' },
  { value: ATHLETE_APPLICATION_STATUS.REJECTED, label: 'Отклонен' },
]

const statusFilterOptions = [{ value: 'all', label: 'Все статусы' }, ...statusOptions]

const athleteGroups = computed(() =>
  groupedRows.value
    .filter((group) => group.participantKind === 'athlete')
    .map((group) => ({
      ...group,
      statusMeta: statusMetaOverrides[group.id] || group.statusMeta,
    })),
)

const filteredGroups = computed(() => {
  const normalizedSearch = normalizeSearchValue(search.value)

  return athleteGroups.value
    .filter((group) => {
      if (statusFilter.value !== 'all' && group.statusMeta.status !== statusFilter.value) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const haystack = [
        group.ownerName,
        group.ownerEmail,
        group.participantName,
        group.statusMeta.label,
        group.statusMeta.note,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
    .sort((left, right) => getGroupTimestamp(right) - getGroupTimestamp(left))
})

const summary = computed(() => ({
  totalCount: athleteGroups.value.length,
  newCount: athleteGroups.value.filter(
    (group) => group.statusMeta.status === CONSULTATION_STATUS.NEW,
  ).length,
  inWorkCount: athleteGroups.value.filter((group) =>
    [
      CONSULTATION_STATUS.PROCESSED,
      CONSULTATION_STATUS.CALL_BACK,
      CONSULTATION_STATUS.BUSY,
      CONSULTATION_STATUS.UNAVAILABLE,
      CONSULTATION_STATUS.SCHEDULED,
      ATHLETE_APPLICATION_STATUS.NEEDS_DATA,
    ].includes(group.statusMeta.status),
  ).length,
  closedCount: athleteGroups.value.filter((group) =>
    [
      CONSULTATION_STATUS.CLOSED,
      ATHLETE_APPLICATION_STATUS.READY,
      ATHLETE_APPLICATION_STATUS.ADMITTED,
      ATHLETE_APPLICATION_STATUS.REJECTED,
    ].includes(group.statusMeta.status),
  ).length,
}))

const selectedGroup = computed(
  () => athleteGroups.value.find((group) => group.id === groupDialogState.selectedGroupId) || null,
)

function normalizeSearchValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function getGroupTimestamp(group) {
  return Date.parse(group?.statusMeta?.createdAt || group?.statusMeta?.updatedAt || 0) || 0
}

function formatApplicationDate(group) {
  return formatCompactDateTime(group?.statusMeta?.createdAt || group?.statusMeta?.updatedAt)
}

function getApplicationRecord(group) {
  return readAccountAthleteApplication({
    ownerUserKey: group.ownerUserKey,
    scope: group.scope,
    scopeId: group.scopeId,
  })
}

async function persistApplication(group, patch = {}) {
  const existingApplication = getApplicationRecord(group)

  return upsertAccountAthleteApplication({
    id: group.id,
    ownerUserKey: group.ownerUserKey,
    ownerName: group.ownerName || '',
    ownerEmail: group.ownerEmail || '',
    ownerPhone: group.ownerPhone || '',
    scope: group.scope,
    scopeId: group.scopeId,
    participantName: group.participantName || '',
    participantBirthDate: group.participantBirthDate || '',
    participantClub: group.participantClub || '',
    participantKind: 'athlete',
    status: patch.status || existingApplication?.status || CONSULTATION_STATUS.NEW,
    note: Object.prototype.hasOwnProperty.call(patch, 'note')
      ? patch.note
      : existingApplication?.note || '',
    updatedBy:
      patch.updatedBy || props.currentUser?.name || props.currentUser?.value?.name || 'Тренер',
  })
}

function openGroup(group) {
  if (!group) {
    return
  }

  const application = getApplicationRecord(group)

  form.comment = application?.note || group.statusMeta.note || ''
  groupDialogState.isOpen = true
  groupDialogState.selectedGroupId = group.id
}

function closeGroupDialog() {
  groupDialogState.isOpen = false
  groupDialogState.selectedGroupId = ''
  form.comment = ''
  isSaving.value = false
}

async function handleStatusChange(group, nextStatus) {
  if (!group || !nextStatus || nextStatus === group.statusMeta.status) {
    return
  }

  let updated = null

  try {
    updated = await persistApplication(group, { status: nextStatus })
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Не удалось обновить статус заявки.', {
      type: 'error',
    })
    return
  }

  if (!updated) {
    showToast('Не удалось обновить статус заявки.', { type: 'error' })
    return
  }

  statusMetaOverrides[group.id] = resolveAccountAdmissionStatus({
    ownerUserKey: group.ownerUserKey,
    scope: group.scope,
    scopeId: group.scopeId,
    documents: group.documents,
  })
}

async function handleSaveComment() {
  if (!selectedGroup.value) {
    return
  }

  isSaving.value = true

  let updated = null

  try {
    updated = await persistApplication(selectedGroup.value, {
      note: form.comment.trim(),
    })
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Не удалось сохранить комментарий.', {
      type: 'error',
    })
    isSaving.value = false
    return
  }

  if (!updated) {
    showToast('Не удалось сохранить комментарий.', { type: 'error' })
    isSaving.value = false
    return
  }

  isSaving.value = false
  showToast('Комментарий сохранён')
  refresh()
  closeGroupDialog()
}

watch(
  () => props.currentUser,
  () => {
    refresh()
  },
  { immediate: true },
)
</script>

<style scoped>
.account-trainer-athletes__header {
  display: grid;
  gap: 18px;
  margin-bottom: 16px;
}

.account-trainer-athletes__panel-head {
  justify-content: flex-end;
}

.account-trainer-athletes__summary {
  gap: 8px;
}

.account-trainer-athletes__summary :deep(.el-tag) {
  min-height: 38px;
  padding-inline: 16px;
  border-width: 1px;
  border-style: solid;
  border-color: #dbe7f4;
  border-radius: 10px;
  font-weight: 800;
}

.account-trainer-athletes__filters {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.account-trainer-athletes__filter-field {
  min-width: 0;
}

.account-trainer-athletes__status-select {
  width: 100%;
}

.account-trainer-athletes__status-select--toolbar {
  width: 100%;
}

.account-trainer-athletes__status-select--inline {
  width: 180px;
}

.account-trainer-athletes__meta {
  display: flex;
  justify-content: flex-end;
}

.account__native-table-head th:not(:first-child),
.account__native-table-cell--center {
  text-align: center;
}

.account__native-table-cell--primary {
  text-align: left;
}

.account__native-table-cell--center .account-trainer-athletes__status-select {
  margin-inline: auto;
}

.account-trainer-athletes__status-select--inline :deep(.el-select__wrapper),
.account-trainer-athletes__status-select--toolbar :deep(.el-select__wrapper) {
  min-height: 34px;
  padding-inline: 10px;
}

.account-trainer-athletes__status-select--inline :deep(.el-select__selected-item),
.account-trainer-athletes__status-select--toolbar :deep(.el-select__selected-item),
.account-trainer-athletes__status-select--inline :deep(.el-select__placeholder),
.account-trainer-athletes__status-select--toolbar :deep(.el-select__placeholder) {
  font-size: 13px;
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
  .account-trainer-athletes__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .account-trainer-athletes__filters {
    grid-template-columns: 1fr;
  }

  .account-trainer-athletes__meta {
    justify-content: flex-start;
  }

  .account-trainer-athletes__status-select--inline {
    width: 100%;
  }
}
</style>

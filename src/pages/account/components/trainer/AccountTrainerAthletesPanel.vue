<template>
  <ElCard class="account__panel account-trainer-athletes" shadow="never">
    <div class="account-trainer-athletes__header">
      <div class="account-trainer-athletes__filters">
        <label class="account__field account__field--search">
          <span class="account__field-label">Поиск</span>
          <input
            v-model.trim="search"
            class="account__input account__input--toolbar"
            type="search"
            name="trainer-athletes-search"
            placeholder="Поиск по ФИО"
          />
        </label>

        <label class="account__field account__field--filter">
          <span class="account__field-label">Статус</span>
          <ElSelect
            v-model="statusFilter"
            class="account__select account-trainer-athletes__filter-select"
            popper-class="account__select-popper account__select-popper--full"
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

        <label class="account-trainer-athletes__checkbox">
          <input
            v-model="hideRejected"
            type="checkbox"
            class="account-trainer-athletes__checkbox-input"
          />
          <span class="account-trainer-athletes__checkbox-box" aria-hidden="true"></span>
          <span class="account-trainer-athletes__checkbox-label">Скрыть отклоненные</span>
        </label>

        <div class="account-trainer-athletes__meta">
          <ElButton
            class="account__refresh-button"
            plain
            type="primary"
            :disabled="isDocumentsLoading"
            :aria-busy="isDocumentsLoading"
            aria-label="Обновить"
            @click="refresh"
          >
            <span
              v-if="isDocumentsLoading"
              class="account__button-spinner"
              aria-hidden="true"
            ></span>
            <span v-else>Обновить</span>
          </ElButton>
        </div>
      </div>
    </div>

    <div v-if="showSkeleton" class="account-trainer-athletes__skeleton" aria-busy="true">
      <div class="account__native-table-wrap">
        <table class="account__native-table account__native-table--trainer-athletes">
          <thead class="account__native-table-head">
            <tr>
              <th>ФИО</th>
              <th>Телефон</th>
              <th>Статус</th>
              <th>Действие</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="index in 4"
              :key="`trainer-athletes-skeleton-${index}`"
              class="account__native-table-row account-trainer-athletes__table-row--skeleton"
            >
              <td class="account__native-table-cell account__native-table-cell--primary">
                <span class="account-trainer-athletes__skeleton-line account-trainer-athletes__skeleton-line--title"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-trainer-athletes__skeleton-line account-trainer-athletes__skeleton-line--text"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-trainer-athletes__skeleton-line account-trainer-athletes__skeleton-line--status"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-trainer-athletes__skeleton-line account-trainer-athletes__skeleton-line--button"></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="filteredGroups.length" class="account__native-table-wrap">
      <table class="account__native-table account__native-table--trainer-athletes">
        <thead class="account__native-table-head">
          <tr>
            <th class="account__native-table-head-cell--sortable">
              <button
                type="button"
                class="account__table-sort-button account__table-sort-button--left btn-reset"
                :class="{ 'account__table-sort-button--active': sortKey === 'fullName' }"
                :aria-label="getSortAriaLabel('ФИО', 'fullName')"
                @click="toggleSort('fullName')"
              >
                <span>ФИО</span>
                <span
                  class="account__table-sort-indicator"
                  :data-direction="getSortDirection('fullName')"
                  aria-hidden="true"
                ></span>
              </button>
            </th>
            <th>Телефон</th>
            <th>Статус</th>
            <th>Действие</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="group in sortedGroups" :key="group.id" class="account__native-table-row">
            <td class="account__native-table-cell account__native-table-cell--primary">
              <div class="account__table-user">
                <div class="account__table-primary">
                  {{ group.participantName || group.ownerName || 'Не указан' }}
                </div>
              </div>
            </td>

            <td class="account__native-table-cell account__native-table-cell--center">
              {{ group.ownerPhone || 'Не указан' }}
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <ElTag
                :type="group.statusTagType"
                effect="light"
                class="account-trainer-athletes__status-badge"
              >
                {{ group.statusLabel }}
              </ElTag>
            </td>

            <td class="account__native-table-cell account__native-table-cell--center">
              <button
                type="button"
                class="account__table-action account__table-action--edit btn-reset"
                @click="openGroup(group)"
              >
                Подробнее
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else description="Заявки спортсменов не найдены." />

    <ElDialog
      :model-value="groupDialogState.isOpen"
      width="920px"
      append-to-body
      align-center
      destroy-on-close
      class="account__dialog"
      title="Детали спортсмена"
      :close-icon="Close"
      @closed="handleGroupDialogClosed"
      @update:model-value="!$event && handleGroupDialogClose()"
    >
      <div v-if="selectedGroup" class="account-trainer-athletes__dialog-view">
        <div class="account-trainer-athletes__dialog-grid">
          <section class="account-trainer-athletes__dialog-section account-trainer-athletes__dialog-section--wide">
            <div class="account-trainer-athletes__dialog-summary">
              <div class="account-trainer-athletes__dialog-summary-copy">
                <strong class="account-trainer-athletes__dialog-value">
                  {{ selectedGroup.participantName || selectedGroup.ownerName || 'Не указан' }}
                </strong>
              </div>
              <ElSelect
                v-if="selectedGroup.bookingDetailsText"
                v-model="dialogStatusState.localStatus"
                class="account__select account-trainer-athletes__status-select"
                popper-class="account__select-popper account__select-popper--full"
                placeholder="Статус"
              >
                <ElOption
                  v-for="option in groupStatusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
              <ElTag v-else :type="selectedGroup.statusMeta.tagType" effect="light" round>
                {{ selectedGroup.sourceLabel }}
              </ElTag>
            </div>

            <div class="account-trainer-athletes__dialog-facts">
              <span class="account-trainer-athletes__dialog-fact">
                Телефон: {{ selectedGroup.ownerPhone || 'Не указан' }}
              </span>
              <span class="account-trainer-athletes__dialog-fact">
                Email: {{ selectedGroup.ownerEmail || 'Не указан' }}
              </span>
              <span class="account-trainer-athletes__dialog-fact">
                Дата рождения:
                {{ selectedGroup.participantBirthDate || 'Не указана' }}
              </span>
              <span class="account-trainer-athletes__dialog-fact">
                Клуб: {{ selectedGroup.participantClub || 'Не указан' }}
              </span>
              <span class="account-trainer-athletes__dialog-fact">
                Заявка создана:
                {{ formatCompactDateTime(selectedGroup.statusMeta.createdAt) }}
              </span>
              <span class="account-trainer-athletes__dialog-fact">
                Обновлено:
                {{ formatCompactDateTime(selectedGroup.statusMeta.updatedAt) }}
              </span>
            </div>

            <pre
              v-if="selectedGroup.bookingDetailsText"
              class="account-trainer-athletes__dialog-details-text"
            >{{ selectedGroup.bookingDetailsText }}</pre>
          </section>
        </div>

        <div class="account__dialog-actions">
          <button
            type="button"
            class="account__table-action account__table-action--ghost btn-reset"
            @click="handleGroupDialogClose"
          >
            Отмена
          </button>
          <button
            v-if="selectedGroup?.bookingDetailsText && isGroupStatusDirty"
            type="button"
            class="account__table-action account__table-action--edit btn-reset"
            @click="saveGroupStatus"
          >
            Сохранить
          </button>
        </div>
      </div>
    </ElDialog>
  </ElCard>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { computed, reactive, ref, toRef, watch } from 'vue'
import { ElButton, ElCard, ElDialog, ElEmpty, ElOption, ElSelect, ElTag } from 'element-plus'
import { useTriStateTextSort } from '@/pages/account/composables/useTriStateTextSort'
import { useAccountDocumentReviews } from '@/pages/account/composables/useAccountDocumentReviews'
import { TRAINER_BOOKING_STATUS } from '@/pages/account/utils/accountConstants'
import { formatCompactDateTime } from '@/pages/account/utils/accountFormatters'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
  bookings: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  showInitialSkeleton: {
    type: Boolean,
    default: false,
  },
})

const { groupedRows, isLoading: isDocumentsLoading, refresh } = useAccountDocumentReviews({
  currentUser: toRef(props, 'currentUser'),
  participantKind: 'athlete',
})

const search = ref('')
const statusFilter = ref('all')
const hideRejected = ref(true)
const { sortKey, toggleSort, getSortState, sortItems } = useTriStateTextSort('fullName')

const groupDialogState = reactive({
  isOpen: false,
  selectedGroupId: '',
})
const dialogStatusState = reactive({
  localStatus: 'new',
})
const groupStatusOptions = [
  { value: 'new', label: 'Запись' },
  { value: 'accepted', label: 'Принят' },
  { value: 'rejected', label: 'Отклонен' },
]
const statusFilterOptions = [
  { value: 'all', label: 'Все статусы' },
  ...groupStatusOptions,
]
const bookingStatusMap = reactive({})
const hasLoadedAthleteData = ref(false)
const showSkeleton = computed(
  () =>
    props.showInitialSkeleton ||
    ((props.isLoading || isDocumentsLoading.value) && !hasLoadedAthleteData.value),
)

const athleteGroups = computed(() =>
  [
    ...groupedRows.value
    .filter((group) => group.participantKind === 'athlete')
    .map((group) => ({
      ...group,
      sourceLabel: 'Документы',
      sourceTagType: 'info',
      statusLabel: 'Документы',
      statusTagType: 'info',
      localStatus: 'documents',
    })),
    ...props.bookings
      .filter((booking) => isAccountTrainerBooking(booking))
      .map((booking) => createBookingAthleteGroup(booking)),
  ]
)

const filteredGroups = computed(() => {
  const normalizedSearch = normalizeSearchValue(search.value)

  return athleteGroups.value
    .filter((group) => {
      if (hideRejected.value && group.localStatus === 'rejected') {
        return false
      }

      if (
        statusFilter.value !== 'all' &&
        !(statusFilter.value === 'accepted'
          ? group.localStatus === 'accepted'
          : statusFilter.value === 'rejected'
            ? group.localStatus === 'rejected'
            : statusFilter.value === 'new'
              ? group.localStatus === 'new'
              : false)
      ) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const haystack = [
        group.ownerName,
        group.participantName,
        group.statusMeta.label,
        group.statusMeta.note,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
    .sort((left, right) => {
      const leftTime = Date.parse(left?.statusMeta?.createdAt || left?.statusMeta?.updatedAt || 0) || 0
      const rightTime = Date.parse(right?.statusMeta?.createdAt || right?.statusMeta?.updatedAt || 0) || 0

      return rightTime - leftTime
    })
})

const sortedGroups = computed(() => {
  return sortItems(filteredGroups.value, {
    fullName: (group) => getGroupFullName(group),
  })
})

const selectedGroup = computed(
  () => athleteGroups.value.find((group) => group.id === groupDialogState.selectedGroupId) || null,
)
const isGroupStatusDirty = computed(() => {
  if (!selectedGroup.value?.bookingDetailsText) {
    return false
  }

  return dialogStatusState.localStatus !== getSelectedGroupLocalStatus()
})

function normalizeSearchValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function getGroupFullName(group) {
  return group?.participantName || group?.ownerName || ''
}

function isAccountTrainerBooking(booking) {
  return Boolean(formatBookingDetailsText(booking?.comment))
}

function createBookingAthleteGroup(booking) {
  const details = parseBookingDetails(booking.comment)
  const fullName = details['ФИО'] || [booking.lastName, booking.firstName].filter(Boolean).join(' ')
  const localStatus = getBookingLocalStatus(booking.id, booking.status)

  return {
    id: `booking:${booking.id}`,
    participantKind: 'trainer-booking',
    participantName: fullName,
    participantBirthDate: '',
    participantClub: details['Клуб'] || '',
    ownerName: fullName,
    ownerPhone: booking.phone || '',
    ownerEmail: booking.email || '',
    bookingDetailsText: formatBookingDetailsText(booking.comment),
    localStatus,
    statusLabel: getGroupStatusLabel(localStatus),
    statusTagType: getGroupStatusTagType(localStatus),
    statusMeta: {
      label: getGroupStatusLabel(localStatus),
      tagType: getGroupStatusTagType(localStatus),
      note: booking.status || '',
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    },
  }
}

function parseBookingDetails(value) {
  return formatBookingDetailsText(value)
    .split('\n')
    .slice(1)
    .reduce((details, line) => {
      const separatorIndex = line.indexOf(':')

      if (separatorIndex === -1) {
        return details
      }

      const key = line.slice(0, separatorIndex).trim()
      const detailValue = line.slice(separatorIndex + 1).trim()

      if (key && detailValue && detailValue !== 'Не указан' && detailValue !== 'Не указана') {
        details[key] = detailValue
      }

      return details
    }, {})
}

function formatBookingDetailsText(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue.startsWith('Данные пловца:')) {
    return ''
  }

  return normalizedValue.split(/\n{2,}/)[0] || ''
}

function normalizeBookingLocalStatus(status) {
  if (status === TRAINER_BOOKING_STATUS.PROCESSED || status === TRAINER_BOOKING_STATUS.COMPLETED) {
    return 'accepted'
  }

  if (status === TRAINER_BOOKING_STATUS.CANCELLED) {
    return 'rejected'
  }

  return 'new'
}

function getGroupStatusLabel(status) {
  if (status === 'accepted') {
    return 'Принят'
  }

  if (status === 'rejected') {
    return 'Отклонен'
  }

  if (status === 'documents') {
    return 'Документы'
  }

  return 'Запись'
}

function getGroupStatusTagType(status) {
  if (status === 'accepted') {
    return 'info'
  }

  if (status === 'rejected') {
    return 'danger'
  }

  if (status === 'documents') {
    return 'info'
  }

  return 'success'
}

function getSortDirection(columnKey) {
  const state = getSortState(columnKey)

  if (!state.isActive) {
    return 'none'
  }

  return state.direction === 'desc' ? 'desc' : 'asc'
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

function openGroup(group) {
  if (!group) {
    return
  }
  groupDialogState.isOpen = true
  groupDialogState.selectedGroupId = group.id
  dialogStatusState.localStatus = getSelectedGroupLocalStatus(group)
}

function handleGroupDialogClose() {
  groupDialogState.isOpen = false
}

function handleGroupDialogClosed() {
  groupDialogState.selectedGroupId = ''
  dialogStatusState.localStatus = 'new'
}

function getSelectedGroupLocalStatus(group = selectedGroup.value) {
  return group?.localStatus || 'new'
}

function saveGroupStatus() {
  const group = selectedGroup.value

  if (!group || !group.bookingDetailsText) {
    return
  }

  bookingStatusMap[group.id] = dialogStatusState.localStatus
  group.localStatus = dialogStatusState.localStatus
  handleGroupDialogClose()
}

function getBookingLocalStatus(bookingId, status) {
  const existingStatus = bookingStatusMap[`booking:${bookingId}`]

  if (existingStatus) {
    return existingStatus
  }

  return normalizeBookingLocalStatus(status)
}

watch(
  () => props.currentUser,
  () => {
    refresh()
  },
  { immediate: true },
)

watch(
  () => [props.isLoading, isDocumentsLoading.value],
  ([bookingsLoading, documentsLoading]) => {
    if (!bookingsLoading && !documentsLoading) {
      hasLoadedAthleteData.value = true
    }
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

.account-trainer-athletes__filters {
  display: flex;
  gap: 12px;
  align-items: end;
  flex-wrap: nowrap;
}

.account-trainer-athletes__meta {
  display: flex;
  justify-content: flex-end;
  flex: 0 0 auto;
}

.account-trainer-athletes__filter-select,
.account-trainer-athletes__status-select {
  width: min(50%, 280px);
  min-width: 180px;
  max-width: 280px;
}

.account-trainer-athletes__status-badge {
  border-radius: 5px !important;
}

.account-trainer-athletes__status-badge.el-tag--success {
  --el-tag-text-color: #2f8d3a;
  --el-tag-bg-color: #eef9ef;
  --el-tag-border-color: #d5efd8;
}

.account-trainer-athletes__status-badge.el-tag--info {
  --el-tag-text-color: #7a8494;
  --el-tag-bg-color: #f1f3f6;
  --el-tag-border-color: #dfe4ea;
}

.account-trainer-athletes__status-badge.el-tag--danger {
  --el-tag-text-color: #c94343;
  --el-tag-bg-color: #fff0f0;
  --el-tag-border-color: #f1d0d0;
}

.account-trainer-athletes__skeleton {
  margin-top: 8px;
}

.account-trainer-athletes__table-row--skeleton {
  background: transparent;
}

.account-trainer-athletes__skeleton-line {
  position: relative;
  display: block;
  overflow: hidden;
  height: 14px;
  margin: 0 auto;
  border-radius: 999px;
  background: color-mix(in srgb, var(--light-blue) 36%, white);
}

.account-trainer-athletes__skeleton-line::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.72), transparent);
  animation: account-trainer-athletes-skeleton 1.2s ease-in-out infinite;
}

.account-trainer-athletes__skeleton-line--title {
  width: min(220px, 82%);
  height: 16px;
  margin-left: 0;
}

.account-trainer-athletes__skeleton-line--text {
  width: 112px;
}

.account-trainer-athletes__skeleton-line--status {
  width: 86px;
  height: 24px;
}

.account-trainer-athletes__skeleton-line--button {
  width: 96px;
  height: 30px;
  border-radius: 10px;
}

.account__field--search {
  flex: 0 1 50%;
  min-width: 280px;
}

.account__field--filter {
  flex: 0 0 180px;
}

.account-trainer-athletes__checkbox {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  min-width: 190px;
  height: 38px;
  padding: 0;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.account-trainer-athletes__checkbox-input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  clip: rect(0, 0, 0, 0);
  overflow: hidden;
}

.account-trainer-athletes__checkbox-box {
  position: relative;
  width: 18px;
  height: 18px;
  border: 1.5px solid color-mix(in srgb, var(--cyan) 48%, white);
  border-radius: 5px;
  background: rgb(255 255 255 / 0.92);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.account-trainer-athletes__checkbox-input:checked + .account-trainer-athletes__checkbox-box {
  border-color: color-mix(in srgb, var(--orange) 60%, white);
  background: color-mix(in srgb, var(--orange) 16%, white);
  box-shadow: 0 0 0 3px rgb(255 181 102 / 0.12);
}

.account-trainer-athletes__checkbox-input:checked + .account-trainer-athletes__checkbox-box::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 3px;
  background: var(--orange);
}

.account-trainer-athletes__checkbox-label {
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  color: #5f6f86;
}

.account__native-table-head th:not(:first-child),
.account__native-table-cell--center {
  text-align: center;
}

.account__native-table-cell--primary {
  text-align: left;
}

.account-trainer-athletes__dialog-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.9fr);
  gap: 16px;
}

.account-trainer-athletes__dialog-section {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--cyan) 18%, white);
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 82%);
}

.account-trainer-athletes__dialog-section--wide {
  grid-column: 1 / -1;
}

.account-trainer-athletes__dialog-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account-trainer-athletes__dialog-summary-copy {
  display: grid;
  gap: 4px;
}

.account-trainer-athletes__dialog-value {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.15;
  color: var(--black);
}

.account-trainer-athletes__dialog-meta {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  color: #66758d;
}

.account-trainer-athletes__dialog-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
}

.account-trainer-athletes__dialog-fact {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  color: #5b6a7f;
}

.account-trainer-athletes__dialog-details {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 18%, white);
  border-radius: 10px;
  background: rgb(246 251 255 / 0.86);
}

.account-trainer-athletes__dialog-details-text {
  margin: 0;
  white-space: pre-wrap;
  font-family: Nunito, sans-serif;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.55;
  color: var(--black);
}

.account-trainer-athletes__dialog-view {
  display: grid;
  gap: 16px;
}

@media (max-width: 1120px) {
  .account-trainer-athletes__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .account-trainer-athletes__dialog-grid {
    grid-template-columns: 1fr;
  }

  .account-trainer-athletes__dialog-section--wide {
    grid-column: auto;
  }
}

@media (max-width: 640px) {
  .account-trainer-athletes__filters {
    grid-template-columns: 1fr;
  }

  .account-trainer-athletes__meta {
    justify-content: flex-start;
  }

  .account-trainer-athletes__dialog-facts {
    grid-template-columns: 1fr;
  }

  .account-trainer-athletes__dialog-summary {
    flex-direction: column;
  }
}

@keyframes account-trainer-athletes-skeleton {
  100% {
    transform: translateX(100%);
  }
}
</style>

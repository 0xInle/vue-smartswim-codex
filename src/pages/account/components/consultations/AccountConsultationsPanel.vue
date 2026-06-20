<template>
  <ElCard class="account__panel" shadow="never">
    <div class="account__consultations-toolbar">
      <label class="account__field account__field--search">
        <span class="account__field-label">Поиск</span>
        <input
          :value="search"
          class="account__input account__input--toolbar"
          type="search"
          name="consultation-search"
          placeholder="Поиск по заявкам"
          @input="$emit('update:search', $event.target.value)"
        />
      </label>

      <label class="account__field account__field--filter">
        <span class="account__field-label">Статус</span>
        <ElSelect
          :model-value="statusFilter"
          class="account__select"
          popper-class="account__select-popper account__select-popper--full"
          placeholder="Все статусы"
          @update:model-value="$emit('update:status-filter', $event)"
        >
          <ElOption label="Все статусы" value="all" />
          <ElOption
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </label>

      <div class="account__consultations-toolbar-meta">
        <div class="account__panel-actions">
          <ElTag type="danger" effect="light" round>{{ newCount }} новых</ElTag>
          <ElTag type="primary" effect="light" round>{{ total }} всего</ElTag>
        </div>

        <button
          type="button"
          class="account__refresh-button btn-reset"
          :disabled="isLoading"
          :aria-busy="isLoading"
          aria-label="Обновить"
          @click="$emit('refresh')"
        >
          <span v-if="isLoading" class="account__button-spinner" aria-hidden="true"></span>
          <span v-else>Обновить</span>
        </button>
      </div>
    </div>

    <div
      v-if="props.showInitialSkeleton || (isLoading && !hasLoadedRequests)"
      class="account-consultations__table-skeleton"
      aria-busy="true"
    >
      <div class="account__native-table-wrap">
        <table class="account__native-table account__native-table--consultations">
          <thead class="account__native-table-head">
            <tr>
              <th>ФИО</th>
              <th>Телефон</th>
              <th>Дата получения</th>
              <th>Статус</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="index in skeletonRows"
              :key="`consultation-skeleton-${index}`"
              class="account__native-table-row account-consultations__table-row account-consultations__table-row--skeleton"
              aria-hidden="true"
            >
              <td class="account__native-table-cell account__native-table-cell--primary">
                <span class="account-consultations__skeleton-line account-consultations__skeleton-line--name"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-consultations__skeleton-line account-consultations__skeleton-line--phone"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-consultations__skeleton-line account-consultations__skeleton-line--date"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-consultations__skeleton-line account-consultations__skeleton-line--status"></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="rows.length" class="account__native-table-wrap">
      <table class="account__native-table account__native-table--consultations">
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
            <th class="account__native-table-head-cell--sortable">
              <button
                type="button"
                class="account__table-sort-button account__table-sort-button--center btn-reset"
                :class="{ 'account__table-sort-button--active': sortKey === 'createdAt' }"
                :aria-label="getSortAriaLabel('Дата получения', 'createdAt')"
                @click="toggleSort('createdAt')"
              >
                <span>Дата получения</span>
                <span
                  class="account__table-sort-indicator"
                  :data-direction="getSortDirection('createdAt')"
                  aria-hidden="true"
                ></span>
              </button>
            </th>
            <th>Статус</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="request in sortedRows"
            :key="request.id"
            class="account__native-table-row account-consultations__table-row"
            tabindex="0"
            role="button"
            @click="$emit('open-details', request)"
            @keydown.enter.prevent="$emit('open-details', request)"
            @keydown.space.prevent="$emit('open-details', request)"
          >
            <td class="account__native-table-cell account__native-table-cell--primary">
              <div class="account__table-user">
                <div class="account__table-primary">
                  {{ formatConsultationFullName(request) }}
                </div>
              </div>
            </td>
            <td class="account__native-table-cell account__native-table-cell--phone">
              {{ request.phone }}
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              {{ formatCompactDateTime(request.createdAt) }}
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <ElTag
                :type="consultationStatusType(request.status)"
                effect="light"
                round
                class="account-consultations__status-badge"
              >
                {{ formatConsultationStatus(request.status) }}
              </ElTag>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else description="Новых заявок пока нет." />
  </ElCard>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElCard, ElEmpty, ElOption, ElSelect, ElTag } from 'element-plus'
import { useTriStateTextSort } from '@/pages/account/composables/useTriStateTextSort'
import {
  consultationStatusType,
  formatCompactDateTime,
  formatConsultationFullName,
  formatConsultationStatus,
} from '@/pages/account/utils/accountFormatters'

const props = defineProps({
  requests: {
    type: Array,
    required: true,
  },
  rows: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    required: true,
  },
  showInitialSkeleton: {
    type: Boolean,
    default: false,
  },
  search: {
    type: String,
    required: true,
  },
  statusFilter: {
    type: String,
    required: true,
  },
  statusOptions: {
    type: Array,
    required: true,
  },
  newCount: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
})

defineEmits(['refresh', 'update:search', 'update:status-filter', 'open-details'])

const { sortKey, toggleSort, getSortState, sortItems } =
  useTriStateTextSort('createdAt', { initialDirection: 'desc' })
const hasLoadedRequests = ref(false)
const skeletonRows = Array.from({ length: 4 }, (_, index) => index + 1)

watch(
  () => [props.isLoading, props.rows.length],
  ([isLoading, rowsCount]) => {
    if (!isLoading || rowsCount > 0) {
      hasLoadedRequests.value = true
    }
  },
  { immediate: true },
)

const sortedRows = computed(() =>
  sortItems(props.rows, {
    fullName: (request) => formatConsultationFullName(request),
    createdAt: (request) => request.createdAt || '',
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
</script>

<style scoped>
.account__native-table--consultations th:not(:first-child),
.account__native-table--consultations td:not(:first-child) {
  text-align: center;
}

.account__native-table--consultations .account__native-table-cell--phone {
  white-space: nowrap;
}

.account-consultations__table-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.account-consultations__table-row:hover,
.account-consultations__table-row:focus-visible,
.account-consultations__table-row:hover .account__native-table-cell,
.account-consultations__table-row:focus-visible .account__native-table-cell {
  background: #f2f5f8;
  outline: none;
}

.account-consultations__status-badge.el-tag {
  border-radius: 5px;
}

.account-consultations__table-skeleton {
  display: grid;
  gap: 0;
}

.account-consultations__table-row--skeleton {
  pointer-events: none;
}

.account-consultations__skeleton-line {
  display: inline-flex;
  width: 100%;
  height: 14px;
  overflow: hidden;
  border-radius: 999px;
  background:
    linear-gradient(
      90deg,
      rgb(226 238 246 / 0.78) 0%,
      rgb(247 251 253 / 0.96) 48%,
      rgb(226 238 246 / 0.78) 100%
    );
  background-size: 220% 100%;
  animation: account-consultations-skeleton 1.2s ease-in-out infinite;
}

.account-consultations__skeleton-line--name {
  width: min(260px, 72%);
}

.account-consultations__skeleton-line--phone {
  width: min(160px, 64%);
}

.account-consultations__skeleton-line--date {
  width: min(180px, 72%);
}

.account-consultations__skeleton-line--status {
  width: min(110px, 56%);
}

@keyframes account-consultations-skeleton {
  0% {
    background-position: 120% 0;
  }

  100% {
    background-position: -120% 0;
  }
}
</style>

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

        <ElButton class="account__refresh-button" plain type="primary" @click="$emit('refresh')">
          Обновить
        </ElButton>
      </div>
    </div>

    <div v-if="isLoading && !requests.length" class="account__loading-state">Загружаем заявки...</div>

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
            <th>Дата получения</th>
            <th>Статус</th>
            <th>Действие</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="request in sortedRows" :key="request.id" class="account__native-table-row">
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
              <ElTag :type="consultationStatusType(request.status)" effect="light" round>
                {{ formatConsultationStatus(request.status) }}
              </ElTag>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <button
                type="button"
                class="account__table-action account__table-action--edit btn-reset"
                :disabled="loadingId === request.id"
                @click="$emit('open-details', request)"
              >
                Подробнее
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else description="Новых заявок пока нет." />
  </ElCard>
</template>

<script setup>
import { computed } from 'vue'
import { ElButton, ElCard, ElEmpty, ElOption, ElSelect, ElTag } from 'element-plus'
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
  loadingId: {
    type: [Number, String, null],
    default: null,
  },
})

defineEmits(['refresh', 'update:search', 'update:status-filter', 'open-details'])

const { sortKey, toggleSort, getSortState, sortItems } =
  useTriStateTextSort('fullName')

const sortedRows = computed(() =>
  sortItems(props.rows, {
    fullName: (request) => formatConsultationFullName(request),
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
</style>

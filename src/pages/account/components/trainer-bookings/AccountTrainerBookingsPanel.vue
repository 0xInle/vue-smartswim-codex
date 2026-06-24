<template>
  <ElCard class="account__panel" shadow="never">
    <div class="account__consultations-toolbar">
      <label class="account__field account__field--search">
        <span class="account__field-label">Поиск</span>
        <input
          :value="search"
          class="account__input account__input--toolbar"
          type="search"
          name="trainer-bookings-search"
          placeholder="Поиск по записям"
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
      v-if="props.showInitialSkeleton || (isLoading && !hasLoadedBookings)"
      class="account-trainer-bookings__table-skeleton"
      aria-busy="true"
    >
      <div class="account__native-table-wrap">
        <table class="account__native-table account__native-table--trainer-bookings">
          <thead class="account__native-table-head">
            <tr>
              <th>Клиент</th>
              <th>Тренер</th>
              <th>Статус</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="index in 4"
              :key="`trainer-booking-skeleton-${index}`"
              class="account__native-table-row account-trainer-bookings__table-row account-trainer-bookings__table-row--skeleton"
            >
              <td class="account__native-table-cell account__native-table-cell--primary">
                <span class="account-trainer-bookings__skeleton-line account-trainer-bookings__skeleton-line--title"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-trainer-bookings__skeleton-line account-trainer-bookings__skeleton-line--text"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-trainer-bookings__skeleton-line account-trainer-bookings__skeleton-line--status"></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="bookings.length" class="account__native-table-wrap">
      <table class="account__native-table account__native-table--trainer-bookings">
        <thead class="account__native-table-head">
          <tr>
            <th class="account__native-table-head-cell--sortable">
              <button
                type="button"
                class="account__table-sort-button account__table-sort-button--left btn-reset"
                :class="{ 'account__table-sort-button--active': sortKey === 'clientName' }"
                :aria-label="getSortAriaLabel('Клиент', 'clientName')"
                @click="toggleSort('clientName')"
              >
                <span>Клиент</span>
                <span
                  class="account__table-sort-indicator"
                  :data-direction="getSortDirection('clientName')"
                  aria-hidden="true"
                ></span>
              </button>
            </th>
            <th class="account__native-table-head-cell--sortable">
              <button
                type="button"
                class="account__table-sort-button account__table-sort-button--center btn-reset"
                :class="{ 'account__table-sort-button--active': sortKey === 'trainerName' }"
                :aria-label="getSortAriaLabel('Тренер', 'trainerName')"
                @click="toggleSort('trainerName')"
              >
                <span>Тренер</span>
                <span
                  class="account__table-sort-indicator"
                  :data-direction="getSortDirection('trainerName')"
                  aria-hidden="true"
                ></span>
              </button>
            </th>
            <th>Статус</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="booking in sortedBookings"
            :key="booking.id"
            class="account__native-table-row account-trainer-bookings__table-row"
            tabindex="0"
            role="button"
            @click="openDetailsDialog(booking)"
            @keydown.enter.prevent="openDetailsDialog(booking)"
            @keydown.space.prevent="openDetailsDialog(booking)"
          >
            <td class="account__native-table-cell account__native-table-cell--primary">
              <div class="account__table-user">
                <div class="account__table-primary">
                  {{ formatTrainerBookingClientName(booking) }}
                </div>
              </div>
            </td>
            <td class="account__native-table-cell">{{ booking.trainerName }}</td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <ElTag
                :type="trainerBookingStatusType(booking.status)"
                effect="light"
                round
                class="account-trainer-bookings__status-badge"
              >
                {{ formatTrainerBookingStatus(booking.status) }}
              </ElTag>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else description="Записей к тренерам пока нет." />

    <AccountTrainerBookingDetailsDialog
      :model-value="isDetailsDialogOpen"
      :booking="selectedBooking"
      :can-update-status="false"
      @close="closeDetailsDialog"
      @closed="clearDetailsDialog"
    />
  </ElCard>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElCard, ElEmpty, ElOption, ElSelect, ElTag } from 'element-plus'
import AccountTrainerBookingDetailsDialog from '@/pages/account/components/trainer-bookings/AccountTrainerBookingDetailsDialog.vue'
import { useTriStateTextSort } from '@/pages/account/composables/useTriStateTextSort'
import {
  formatTrainerBookingClientName,
  formatTrainerBookingStatus,
  trainerBookingStatusType,
} from '@/pages/account/utils/accountFormatters'

const props = defineProps({
  bookings: {
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

defineEmits(['refresh', 'update:search', 'update:status-filter'])

const isDetailsDialogOpen = ref(false)
const selectedBooking = ref(null)
const hasLoadedBookings = ref(false)
const { sortKey, toggleSort, getSortState, sortItems } =
  useTriStateTextSort('clientName')

watch(
  () => [props.isLoading, props.bookings.length],
  ([isLoading, bookingsCount]) => {
    if (!isLoading || bookingsCount > 0) {
      hasLoadedBookings.value = true
    }
  },
  { immediate: true },
)

const sortedBookings = computed(() =>
  sortItems(props.bookings, {
    clientName: (booking) => formatTrainerBookingClientName(booking),
    trainerName: (booking) => booking.trainerName || '',
  }),
)

function openDetailsDialog(booking) {
  selectedBooking.value = booking
  isDetailsDialogOpen.value = true
}

function closeDetailsDialog() {
  isDetailsDialogOpen.value = false
}

function clearDetailsDialog() {
  selectedBooking.value = null
}

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
.account-trainer-bookings__table-skeleton {
  display: grid;
  gap: 12px;
}

.account-trainer-bookings__table-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.account-trainer-bookings__table-row--skeleton {
  cursor: progress;
  pointer-events: none;
}

.account-trainer-bookings__table-row:hover,
.account-trainer-bookings__table-row:focus-visible,
.account-trainer-bookings__table-row:hover .account__native-table-cell,
.account-trainer-bookings__table-row:focus-visible .account__native-table-cell {
  background: #f2f5f8;
  outline: none;
}

.account-trainer-bookings__status-badge.el-tag {
  border-radius: 5px;
}

.account-trainer-bookings__skeleton-line {
  position: relative;
  overflow: hidden;
  display: block;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cyan) 12%, white);
}

.account-trainer-bookings__skeleton-line::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.74), transparent);
  animation: account-trainer-bookings-skeleton-shimmer 1.2s ease-in-out infinite;
}

.account-trainer-bookings__skeleton-line--title {
  width: min(260px, 86%);
  height: 16px;
}

.account-trainer-bookings__skeleton-line--text {
  width: min(160px, 76%);
  height: 14px;
  margin-inline: auto;
}

.account-trainer-bookings__skeleton-line--status {
  width: 86px;
  height: 28px;
  margin-inline: auto;
}

.account__refresh-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

@keyframes account-trainer-bookings-skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

.account__native-table--trainer-bookings th:not(:first-child),
.account__native-table--trainer-bookings td:not(:first-child) {
  text-align: center;
}
</style>

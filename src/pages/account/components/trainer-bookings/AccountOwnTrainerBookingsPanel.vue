<template>
  <ElCard class="account__panel" shadow="never">
    <template #header>
      <div class="account__panel-head">
        <div>
          <h3 v-if="mode !== 'trainer'" class="account__panel-title">Мои записи к тренерам</h3>
        </div>
        <div class="account__panel-actions">
          <ElTag type="success" effect="light" round class="account-own-trainer-bookings__count-badge">
            {{ summary.newCount }} новых
          </ElTag>
          <ElTag
            type="primary"
            effect="light"
            round
            class="account-own-trainer-bookings__count-badge"
          >
            {{ summary.inWorkCount }} в работе
          </ElTag>
          <ElTag
            type="danger"
            effect="light"
            round
            class="account-own-trainer-bookings__count-badge"
          >
            {{ summary.closedCount }} завершено
          </ElTag>
          <ElTag type="info" effect="light" round class="account-own-trainer-bookings__count-badge">
            {{ total }} всего
          </ElTag>
        </div>
      </div>
    </template>

    <div
      v-if="props.showInitialSkeleton || (isLoading && !hasLoadedBookings)"
      class="account-own-trainer-bookings__skeleton"
      aria-busy="true"
    >
      <div class="account__native-table-wrap">
        <table class="account__native-table account__native-table--trainer-bookings">
          <thead class="account__native-table-head">
            <tr>
              <th>ФИО</th>
              <th>Дата</th>
              <th>Время</th>
              <th>Статус</th>
              <th>Действие</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="index in 4"
              :key="`own-trainer-booking-skeleton-${index}`"
              class="account__native-table-row account-own-trainer-bookings__table-row account-own-trainer-bookings__table-row--skeleton"
            >
              <td class="account__native-table-cell account__native-table-cell--primary">
                <span class="account-own-trainer-bookings__skeleton-line account-own-trainer-bookings__skeleton-line--title"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-own-trainer-bookings__skeleton-line account-own-trainer-bookings__skeleton-line--text"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-own-trainer-bookings__skeleton-line account-own-trainer-bookings__skeleton-line--text"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-own-trainer-bookings__skeleton-line account-own-trainer-bookings__skeleton-line--status"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-own-trainer-bookings__skeleton-line account-own-trainer-bookings__skeleton-line--button"></span>
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
            <th>Дата</th>
            <th>Время</th>
            <th>Статус</th>
            <th>Действие</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in sortedBookings" :key="row.id" class="account__native-table-row">
            <td class="account__native-table-cell account__native-table-cell--primary">
              <div class="account__table-user">
                <div class="account__table-primary">{{ formatTrainerBookingClientName(row) }}</div>
              </div>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              {{ formatTrainerBookingDate(row) }}
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              {{ row.preferredTime || 'Не указано' }}
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <ElTag
                :type="trainerBookingStatusType(row.status)"
                effect="light"
                round
                class="account-own-trainer-bookings__status-badge"
              >
                {{ formatTrainerBookingStatus(row.status) }}
              </ElTag>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <button
                type="button"
                class="account__table-action account__table-action--edit btn-reset"
                @click="openDetailsDialog(row)"
              >
                Подробнее
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else description="Записей к тренерам пока нет." />

    <AccountOwnTrainerBookingDetailsDialog
      :model-value="isDetailsDialogOpen"
      :booking="selectedBooking"
      :error-message="detailsError"
      :is-saving="isSavingDetails"
      :can-update-status="canUpdateStatus"
      @close="closeDetailsDialog"
      @closed="clearDetailsDialog"
      @save="handleDetailsSave"
    />
  </ElCard>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElCard, ElEmpty, ElTag } from 'element-plus'
import AccountOwnTrainerBookingDetailsDialog from '@/pages/account/components/trainer-bookings/AccountTrainerBookingDetailsDialog.vue'
import { useTriStateTextSort } from '@/pages/account/composables/useTriStateTextSort'
import { TRAINER_BOOKING_STATUS } from '@/pages/account/utils/accountConstants'
import {
  formatConsultationDate,
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
  total: {
    type: Number,
    required: true,
  },
  mode: {
    type: String,
    default: 'user',
  },
  canUpdateStatus: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update-status'])

const { sortKey, toggleSort, getSortState, sortItems } = useTriStateTextSort('fullName')
const isDetailsDialogOpen = ref(false)
const selectedBooking = ref(null)
const detailsError = ref('')
const isSavingDetails = ref(false)
const hasLoadedBookings = ref(false)

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
    fullName: (booking) => formatTrainerBookingClientName(booking),
  }),
)

const summary = computed(() => ({
  newCount: props.bookings.filter((booking) => booking.status === TRAINER_BOOKING_STATUS.NEW)
    .length,
  inWorkCount: props.bookings.filter((booking) =>
    [
      TRAINER_BOOKING_STATUS.IN_WORK,
      TRAINER_BOOKING_STATUS.CONTACTED,
      TRAINER_BOOKING_STATUS.CONFIRMED,
    ].includes(booking.status),
  ).length,
  closedCount: props.bookings.filter((booking) =>
    [
      TRAINER_BOOKING_STATUS.PROCESSED,
      TRAINER_BOOKING_STATUS.CANCELLED,
      TRAINER_BOOKING_STATUS.COMPLETED,
    ].includes(booking.status),
  ).length,
}))

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

function formatTrainerBookingDate(booking) {
  return formatConsultationDate(booking.preferredDate)
}

function openDetailsDialog(booking) {
  selectedBooking.value = booking
  detailsError.value = ''
  isDetailsDialogOpen.value = true
}

function closeDetailsDialog() {
  isDetailsDialogOpen.value = false
}

function clearDetailsDialog() {
  selectedBooking.value = null
  detailsError.value = ''
  isSavingDetails.value = false
}

function handleDetailsSave(payload) {
  if (!payload?.bookingId) {
    return
  }

  isSavingDetails.value = true
  detailsError.value = ''

  emit('update-status', {
    id: payload.bookingId,
    status: payload.status,
    comment: payload.comment,
    done: (isSuccess) => {
      isSavingDetails.value = false

      if (isSuccess) {
        closeDetailsDialog()
        return
      }

      detailsError.value = 'Не удалось обновить заявку.'
    },
  })
}
</script>

<style scoped>
.account-own-trainer-bookings__count-badge.el-tag {
  border-radius: 5px;
}

.account-own-trainer-bookings__status-badge.el-tag {
  border-radius: 5px;
}

.account-own-trainer-bookings__skeleton {
  display: grid;
}

.account-own-trainer-bookings__table-row--skeleton {
  pointer-events: none;
}

.account-own-trainer-bookings__skeleton-line {
  position: relative;
  overflow: hidden;
  display: block;
  height: 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cyan) 12%, white);
}

.account-own-trainer-bookings__skeleton-line::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.72), transparent);
  animation: account-own-trainer-bookings-skeleton 1.2s ease-in-out infinite;
}

.account-own-trainer-bookings__skeleton-line--title {
  width: min(220px, 70%);
}

.account-own-trainer-bookings__skeleton-line--text {
  width: min(110px, 60%);
}

.account-own-trainer-bookings__skeleton-line--status {
  width: 88px;
}

.account-own-trainer-bookings__skeleton-line--button {
  width: 96px;
  margin-inline: auto;
}

@keyframes account-own-trainer-bookings-skeleton {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>

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

    <div v-if="isLoading && !bookings.length" class="account__loading-state">
      Загружаем ваши записи...
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
import { computed, ref } from 'vue'
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

async function handleDetailsSave(payload) {
  if (!payload?.bookingId) {
    return
  }

  isSavingDetails.value = true
  detailsError.value = ''

  try {
    emit('update-status', {
      id: payload.bookingId,
      status: payload.status,
      comment: payload.comment,
    })
    closeDetailsDialog()
  } catch (error) {
    detailsError.value = error?.message || 'Не удалось обновить заявку.'
  } finally {
    isSavingDetails.value = false
  }
}
</script>

<style scoped>
.account-own-trainer-bookings__count-badge.el-tag {
  border-radius: 5px;
}

.account-own-trainer-bookings__status-badge.el-tag {
  border-radius: 5px;
}
</style>

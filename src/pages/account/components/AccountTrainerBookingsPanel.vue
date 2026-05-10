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

        <ElButton class="account__refresh-button" plain type="primary" @click="$emit('refresh')">
          Обновить
        </ElButton>
      </div>
    </div>

    <div v-if="isLoading && !bookings.length" class="account__loading-state">
      Загружаем записи к тренерам...
    </div>

    <div v-else-if="bookings.length" class="account__native-table-wrap">
      <table class="account__native-table account__native-table--trainer-bookings">
        <thead class="account__native-table-head">
          <tr>
            <th>Клиент</th>
            <th>Тренер</th>
            <th>Статус</th>
            <th>Действие</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="booking in bookings" :key="booking.id" class="account__native-table-row">
            <td class="account__native-table-cell account__native-table-cell--primary">
              <div class="account__table-user">
                <div class="account__table-primary">
                  {{ formatTrainerBookingClientName(booking) }}
                </div>
              </div>
            </td>
            <td class="account__native-table-cell">{{ booking.trainerName }}</td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <ElTag :type="trainerBookingStatusType(booking.status)" effect="light" round>
                {{ formatTrainerBookingStatus(booking.status) }}
              </ElTag>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <button
                type="button"
                class="account__table-action account__table-action--edit btn-reset"
                @click="openDetailsDialog(booking)"
              >
                Подробнее
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else description="Записей к тренерам пока нет." />

    <AccountTrainerBookingDetailsDialog
      :model-value="isDetailsDialogOpen"
      :booking="selectedBooking"
      @close="closeDetailsDialog"
    />
  </ElCard>
</template>

<script setup>
import { ref } from 'vue'
import { ElButton, ElCard, ElEmpty, ElOption, ElSelect, ElTag } from 'element-plus'
import AccountTrainerBookingDetailsDialog from '@/pages/account/components/AccountTrainerBookingDetailsDialog.vue'
import {
  formatTrainerBookingClientName,
  formatTrainerBookingStatus,
  trainerBookingStatusType,
} from '@/pages/account/utils/accountFormatters'

defineProps({
  bookings: {
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
})

defineEmits(['refresh', 'update:search', 'update:status-filter'])

const isDetailsDialogOpen = ref(false)
const selectedBooking = ref(null)

function openDetailsDialog(booking) {
  selectedBooking.value = booking
  isDetailsDialogOpen.value = true
}

function closeDetailsDialog() {
  isDetailsDialogOpen.value = false
  selectedBooking.value = null
}
</script>

<style scoped>
.account__native-table--trainer-bookings th:not(:first-child),
.account__native-table--trainer-bookings td:not(:first-child) {
  text-align: center;
}
</style>

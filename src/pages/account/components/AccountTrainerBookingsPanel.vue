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
            <th>Телефон</th>
            <th>Email</th>
            <th>Дата</th>
            <th>Время</th>
            <th>Статус</th>
            <th>Получена</th>
            <th>Комментарий</th>
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
            <td class="account__native-table-cell account__native-table-cell--phone">
              {{ booking.phone }}
            </td>
            <td class="account__native-table-cell">{{ booking.email }}</td>
            <td class="account__native-table-cell account__native-table-cell--center">
              {{ formatConsultationDate(booking.preferredDate) }}
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              {{ booking.preferredTime || 'Не указано' }}
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <ElTag :type="trainerBookingStatusType(booking.status)" effect="light" round>
                {{ formatTrainerBookingStatus(booking.status) }}
              </ElTag>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              {{ formatCompactDateTime(booking.createdAt) }}
            </td>
            <td class="account__native-table-cell account__native-table-cell--comment">
              <div
                :class="[
                  'account__booking-comment',
                  { 'account__booking-comment--expanded': isCommentExpanded(booking.id) },
                ]"
              >
                <p
                  :class="[
                    'account__booking-comment-text',
                    {
                      'account__booking-comment-text--expanded': isCommentExpanded(booking.id),
                    },
                  ]"
                >
                  {{ booking.comment || 'Без комментария' }}
                </p>

                <button
                  v-if="shouldShowCommentToggle(booking.comment)"
                  type="button"
                  class="account__booking-comment-toggle btn-reset"
                  @click="toggleComment(booking.id)"
                >
                  {{ isCommentExpanded(booking.id) ? 'Свернуть' : 'Показать' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else description="Записей к тренерам пока нет." />
  </ElCard>
</template>

<script setup>
import { ref } from 'vue'
import { ElButton, ElCard, ElEmpty, ElOption, ElSelect, ElTag } from 'element-plus'
import {
  formatCompactDateTime,
  formatConsultationDate,
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

const expandedCommentIds = ref(new Set())

function shouldShowCommentToggle(comment) {
  if (!comment) {
    return false
  }

  return comment.includes('\n') || comment.trim().length > 90
}

function isCommentExpanded(bookingId) {
  return expandedCommentIds.value.has(bookingId)
}

function toggleComment(bookingId) {
  const nextExpandedIds = new Set(expandedCommentIds.value)

  if (nextExpandedIds.has(bookingId)) {
    nextExpandedIds.delete(bookingId)
  } else {
    nextExpandedIds.add(bookingId)
  }

  expandedCommentIds.value = nextExpandedIds
}
</script>

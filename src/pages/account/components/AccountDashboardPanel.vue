<template>
  <ElCard class="account__panel account-dashboard" shadow="never">
    <div class="account-dashboard__body">
      <section class="account-dashboard__metrics" aria-label="Ключевые показатели">
        <article class="account-dashboard__metric">
          <p class="account-dashboard__metric-label">Новые заявки</p>
          <strong class="account-dashboard__metric-value">{{ newConsultationsCount }}</strong>
          <span class="account-dashboard__metric-hint">{{ consultationRequestsCount }} всего</span>
        </article>

        <article class="account-dashboard__metric">
          <p class="account-dashboard__metric-label">Новые записи</p>
          <strong class="account-dashboard__metric-value">{{ newTrainerBookingsCount }}</strong>
          <span class="account-dashboard__metric-hint">{{ trainerBookingsCount }} всего</span>
        </article>

        <article class="account-dashboard__metric">
          <p class="account-dashboard__metric-label">Пользователи</p>
          <strong class="account-dashboard__metric-value">{{ usersCount }}</strong>
          <span class="account-dashboard__metric-hint">{{ trainersCount }} тренеров</span>
        </article>

        <article class="account-dashboard__metric account-dashboard__metric--attention">
          <p class="account-dashboard__metric-label">Не оплачено</p>
          <strong class="account-dashboard__metric-value">{{ attentionCount }}</strong>
          <span class="account-dashboard__metric-hint">{{ unpaidUsersCount }} пользователей</span>
        </article>
      </section>

      <section class="account-dashboard__cards">
        <article class="account-dashboard__card">
          <div class="account-dashboard__card-head">
            <div>
              <p class="account__panel-eyebrow">Заявки</p>
              <h4 class="account-dashboard__card-title">Последняя заявка</h4>
            </div>
            <ElButton
              class="account-dashboard__action"
              plain
              type="primary"
              @click="$emit('select-section', 'consultations')"
            >
              Все заявки
            </ElButton>
          </div>

          <div v-if="latestConsultation" class="account-dashboard__list">
            <div class="account-dashboard__item">
              <span class="account-dashboard__item-name">
                {{ formatConsultationFullName(latestConsultation) }}
              </span>
              <span class="account-dashboard__item-phone">{{ latestConsultation.phone }}</span>
            </div>
          </div>

          <div v-else class="account-dashboard__empty">Нет актуальных заявок.</div>
        </article>

        <article class="account-dashboard__card">
          <div class="account-dashboard__card-head">
            <div>
              <p class="account__panel-eyebrow">Записи</p>
              <h4 class="account-dashboard__card-title">Последняя запись</h4>
            </div>
            <ElButton
              class="account-dashboard__action"
              plain
              type="primary"
              @click="$emit('select-section', 'trainer-bookings')"
            >
              Все записи
            </ElButton>
          </div>

          <div v-if="latestTrainerBooking" class="account-dashboard__list">
            <div class="account-dashboard__item">
              <span class="account-dashboard__item-name">
                {{ formatTrainerBookingClientName(latestTrainerBooking) }}
              </span>
              <span class="account-dashboard__item-phone">{{ latestTrainerBooking.phone }}</span>
            </div>
          </div>

          <div v-else class="account-dashboard__empty">Нет актуальных записей к тренеру.</div>
        </article>
      </section>
    </div>
  </ElCard>
</template>

<script setup>
import { computed } from 'vue'
import { ElButton, ElCard } from 'element-plus'
import { CRM_ROLE } from '@/utils/crmRoles'
import { CONSULTATION_STATUS, TRAINER_BOOKING_STATUS } from '@/pages/account/utils/accountConstants'
import {
  formatConsultationFullName,
  formatTrainerBookingClientName,
} from '@/pages/account/utils/accountFormatters'

const props = defineProps({
  consultationRequests: {
    type: Array,
    required: true,
  },
  trainerBookings: {
    type: Array,
    required: true,
  },
  users: {
    type: Array,
    required: true,
  },
})

function sortByDateDesc(items, field) {
  return [...items].sort((left, right) => {
    const leftValue = new Date(left?.[field] || 0).getTime()
    const rightValue = new Date(right?.[field] || 0).getTime()

    return rightValue - leftValue
  })
}

const latestConsultation = computed(
  () => sortByDateDesc(props.consultationRequests, 'createdAt')[0] || null,
)

const latestTrainerBooking = computed(
  () => sortByDateDesc(props.trainerBookings, 'createdAt')[0] || null,
)

const consultationRequestsCount = computed(() => props.consultationRequests.length)
const newConsultationsCount = computed(
  () =>
    props.consultationRequests.filter((request) => request.status === CONSULTATION_STATUS.NEW)
      .length,
)
const trainerBookingsCount = computed(() => props.trainerBookings.length)
const newTrainerBookingsCount = computed(
  () =>
    props.trainerBookings.filter((booking) => booking.status === TRAINER_BOOKING_STATUS.NEW).length,
)
const usersCount = computed(() => props.users.length)
const trainersCount = computed(
  () => props.users.filter((user) => user.role === CRM_ROLE.TRAINER).length,
)
const unpaidUsersCount = computed(
  () => props.users.filter((user) => user.status === 'unpaid').length,
)
const attentionCount = computed(
  () => newConsultationsCount.value + newTrainerBookingsCount.value + unpaidUsersCount.value,
)
</script>

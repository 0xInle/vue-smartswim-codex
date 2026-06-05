<template>
  <ElCard class="account__panel account-trainer-dashboard" shadow="never">
    <div v-if="showSkeleton" class="account-trainer-dashboard__body" aria-busy="true">
      <section class="account-trainer-dashboard__metrics" aria-label="Ключевые показатели">
        <article v-for="index in 4" :key="`trainer-dashboard-metric-skeleton-${index}`" class="account-trainer-dashboard__metric">
          <span class="account-trainer-dashboard__skeleton-line account-trainer-dashboard__skeleton-line--label"></span>
          <span class="account-trainer-dashboard__skeleton-line account-trainer-dashboard__skeleton-line--value"></span>
          <span class="account-trainer-dashboard__skeleton-line account-trainer-dashboard__skeleton-line--hint"></span>
        </article>
      </section>

      <section class="account-trainer-dashboard__cards">
        <article class="account-trainer-dashboard__card account-trainer-dashboard__card--activity">
          <div class="account-trainer-dashboard__card-head">
            <span class="account-trainer-dashboard__skeleton-line account-trainer-dashboard__skeleton-line--eyebrow"></span>
            <span class="account-trainer-dashboard__skeleton-line account-trainer-dashboard__skeleton-line--title"></span>
          </div>

          <div class="account-trainer-dashboard__activity-list">
            <div v-for="index in 4" :key="`trainer-dashboard-activity-skeleton-${index}`" class="account-trainer-dashboard__activity-item">
              <div class="account-trainer-dashboard__activity-copy">
                <span class="account-trainer-dashboard__skeleton-line account-trainer-dashboard__skeleton-line--activity-title"></span>
                <span class="account-trainer-dashboard__skeleton-line account-trainer-dashboard__skeleton-line--activity-name"></span>
              </div>

              <div class="account-trainer-dashboard__activity-meta">
                <span class="account-trainer-dashboard__skeleton-pill account-trainer-dashboard__skeleton-pill--status"></span>
                <span class="account-trainer-dashboard__skeleton-line account-trainer-dashboard__skeleton-line--time"></span>
              </div>
            </div>
          </div>
        </article>

        <article class="account-trainer-dashboard__card account-trainer-dashboard__card--snapshot">
          <div class="account-trainer-dashboard__card-head">
            <span class="account-trainer-dashboard__skeleton-line account-trainer-dashboard__skeleton-line--eyebrow"></span>
            <span class="account-trainer-dashboard__skeleton-pill"></span>
          </div>

          <div class="account-trainer-dashboard__quick-actions">
            <div v-for="index in 3" :key="`trainer-dashboard-action-skeleton-${index}`" class="account-trainer-dashboard__quick-action">
              <span class="account-trainer-dashboard__skeleton-line account-trainer-dashboard__skeleton-line--action"></span>
            </div>
          </div>
        </article>
      </section>
    </div>

    <div v-else class="account-trainer-dashboard__body">
      <section class="account-trainer-dashboard__metrics" aria-label="Статус заявок">
        <article class="account-trainer-dashboard__metric">
          <p class="account-trainer-dashboard__metric-label">Новые</p>
          <strong class="account-trainer-dashboard__metric-value">{{ summary.newCount }}</strong>
          <span class="account-trainer-dashboard__metric-hint">Ожидают обработки</span>
        </article>

        <article class="account-trainer-dashboard__metric">
          <p class="account-trainer-dashboard__metric-label">В работе</p>
          <strong class="account-trainer-dashboard__metric-value">{{ summary.inWorkCount }}</strong>
          <span class="account-trainer-dashboard__metric-hint">Активные заявки</span>
        </article>

        <article class="account-trainer-dashboard__metric">
          <p class="account-trainer-dashboard__metric-label">Обработано</p>
          <strong class="account-trainer-dashboard__metric-value">{{ summary.processedCount }}</strong>
          <span class="account-trainer-dashboard__metric-hint">Закрытые обращения</span>
        </article>

        <article class="account-trainer-dashboard__metric account-trainer-dashboard__metric--attention">
          <p class="account-trainer-dashboard__metric-label">Всего</p>
          <strong class="account-trainer-dashboard__metric-value">{{ summary.totalCount }}</strong>
          <span class="account-trainer-dashboard__metric-hint">Заявки к тренеру</span>
        </article>
      </section>

      <section class="account-trainer-dashboard__cards">
        <article class="account-trainer-dashboard__card account-trainer-dashboard__card--activity">
          <div class="account-trainer-dashboard__card-head">
            <p class="account__panel-eyebrow">Последние изменения</p>
          </div>

          <div v-if="latestBookingRows.length" class="account-trainer-dashboard__activity-list">
            <div
              v-for="booking in latestBookingRows"
              :key="booking.id"
              class="account-trainer-dashboard__activity-item"
            >
              <div class="account-trainer-dashboard__activity-copy">
                <span class="account-trainer-dashboard__activity-title">
                  {{ formatTrainerBookingClientName(booking) }}
                </span>
                <span class="account-trainer-dashboard__activity-time-label">Запланирована</span>
                <span class="account-trainer-dashboard__activity-name">
                  {{ formatTrainerBookingSlot(booking) }}
                </span>
              </div>

              <div class="account-trainer-dashboard__activity-meta">
                <ElTag
                  :type="trainerBookingStatusType(booking.status)"
                  effect="light"
                  round
                  class="account-trainer-dashboard__status-badge"
                >
                  {{ formatTrainerBookingStatus(booking.status) }}
                </ElTag>
                <span class="account-trainer-dashboard__activity-time-label">Изменена</span>
                <span class="account-trainer-dashboard__activity-time">
                  {{ formatCompactDateTime(booking.updatedAt || booking.createdAt) }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="account-trainer-dashboard__empty">
            Пока нет заявок к тренеру. Здесь появятся последние обращения клиентов.
          </div>
        </article>

        <article class="account-trainer-dashboard__card account-trainer-dashboard__card--snapshot">
          <div class="account-trainer-dashboard__card-head">
            <div>
              <p class="account__panel-eyebrow">Быстрый доступ</p>
            </div>
          </div>

          <div class="account-trainer-dashboard__quick-actions">
            <button
              type="button"
              class="account__back-button account-trainer-dashboard__quick-action btn-reset"
              @click="emit('select-section', 'trainer-bookings')"
            >
              Заявки: {{ summary.newCount }}
            </button>
            <button
              type="button"
              class="account__back-button account-trainer-dashboard__quick-action btn-reset"
              @click="emit('select-section', 'athletes')"
            >
              Спортсмены
            </button>
            <button
              type="button"
              class="account__back-button account-trainer-dashboard__quick-action btn-reset"
              @click="emit('select-section', 'profile')"
            >
              Профиль
            </button>
          </div>
        </article>
      </section>
    </div>
  </ElCard>
</template>

<script setup>
import { ElCard, ElTag } from 'element-plus'
import { computed } from 'vue'
import {
  TRAINER_BOOKING_STATUS,
} from '@/pages/account/utils/accountConstants'
import {
  formatCompactDateTime,
  formatTrainerBookingClientName,
  formatTrainerBookingSlot,
  formatTrainerBookingStatus,
  trainerBookingStatusType,
} from '@/pages/account/utils/accountFormatters'

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
})

const emit = defineEmits(['select-section'])

const showSkeleton = computed(() => props.isLoading && !props.bookings.length)

const summary = computed(() => ({
  newCount: props.bookings.filter((booking) => booking.status === TRAINER_BOOKING_STATUS.NEW).length,
  inWorkCount: props.bookings.filter((booking) =>
    [
      TRAINER_BOOKING_STATUS.IN_WORK,
      TRAINER_BOOKING_STATUS.CONTACTED,
      TRAINER_BOOKING_STATUS.CONFIRMED,
    ].includes(booking.status),
  ).length,
  processedCount: props.bookings.filter((booking) =>
    [
      TRAINER_BOOKING_STATUS.PROCESSED,
      TRAINER_BOOKING_STATUS.COMPLETED,
      TRAINER_BOOKING_STATUS.CANCELLED,
    ].includes(booking.status),
  ).length,
  totalCount: props.bookings.length,
}))

const latestBookingRows = computed(() =>
  [...props.bookings]
    .sort(
      (left, right) =>
        Date.parse(right.updatedAt || right.createdAt || 0) -
        Date.parse(left.updatedAt || left.createdAt || 0),
    )
    .slice(0, 4),
)
</script>

<style scoped>
.account-trainer-dashboard__body {
  display: grid;
  gap: 12px;
}

.account-trainer-dashboard__metrics,
.account-trainer-dashboard__cards {
  display: grid;
  gap: 12px;
}

.account-trainer-dashboard__metrics {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.account-trainer-dashboard__cards {
  grid-template-columns: minmax(0, 1.45fr) minmax(220px, 0.95fr);
  align-items: stretch;
}

.account-trainer-dashboard__card--activity {
  grid-template-rows: auto 1fr;
  align-self: stretch;
  min-width: 0;
}

.account-trainer-dashboard__card--snapshot {
  grid-template-rows: auto 1fr;
  min-width: 0;
}

.account-trainer-dashboard__metric,
.account-trainer-dashboard__card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e5eaf3;
  border-radius: 10px;
  background: rgb(255 255 255 / 0.9);
  box-shadow: 0 12px 26px rgb(15 23 42 / 0.06);
}

.account-trainer-dashboard__metric--attention {
  border-color: color-mix(in srgb, var(--orange) 24%, white);
}

.account-trainer-dashboard__metric-label {
  margin: 0;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.account-trainer-dashboard__metric-value {
  font-family: Oswald, sans-serif;
  font-size: 28px;
  line-height: 1;
  text-transform: uppercase;
  color: var(--black);
}

.account-trainer-dashboard__metric-hint {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
  color: #526072;
}

.account-trainer-dashboard__card-title {
  margin: 6px 0 0;
  font-family: Oswald, sans-serif;
  font-size: 20px;
  line-height: 1.05;
  text-transform: uppercase;
  color: var(--black);
}

.account-trainer-dashboard__card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account-trainer-dashboard__empty {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  color: #64748b;
  text-align: center;
}

.account-trainer-dashboard__empty {
  min-height: 124px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 20px;
  border: 1px dashed color-mix(in srgb, var(--cyan) 24%, white);
  background: rgb(255 255 255 / 0.62);
}

.account-trainer-dashboard__activity-list {
  display: grid;
  align-content: start;
  gap: 10px;
}

.account-trainer-dashboard__activity-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 12px 0;
  border-bottom: 1px solid #edf2f7;
}

.account-trainer-dashboard__activity-item:last-child {
  border-bottom: 0;
}

.account-trainer-dashboard__activity-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.account-trainer-dashboard__activity-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.25;
  color: var(--black);
}

.account-trainer-dashboard__activity-name,
.account-trainer-dashboard__activity-time {
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
  color: #64748b;
}

.account-trainer-dashboard__activity-meta {
  display: grid;
  justify-items: end;
  gap: 5px;
}

.account-trainer-dashboard__activity-time-label {
  font-size: 11px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}

.account-trainer-dashboard__status-badge.el-tag {
  border-radius: 5px;
}

.account-trainer-dashboard__quick-actions {
  align-self: center;
  display: grid;
  gap: 10px;
}

.account-trainer-dashboard__quick-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.account-trainer-dashboard__skeleton-line {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cyan) 12%, white);
}

.account-trainer-dashboard__skeleton-line::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.72), transparent);
  animation: account-trainer-dashboard-skeleton-shimmer 1.2s ease-in-out infinite;
}

.account-trainer-dashboard__skeleton-pill {
  display: block;
  width: 94px;
  height: 28px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cyan) 12%, white);
}

.account-trainer-dashboard__skeleton-line--label {
  width: 58%;
  height: 12px;
}

.account-trainer-dashboard__skeleton-line--value {
  width: 34%;
  height: 28px;
}

.account-trainer-dashboard__skeleton-line--hint {
  width: 72%;
  height: 12px;
}

.account-trainer-dashboard__skeleton-line--eyebrow {
  width: 104px;
  height: 12px;
}

.account-trainer-dashboard__skeleton-line--title {
  width: 220px;
  max-width: 72%;
  height: 22px;
  margin-top: 8px;
}

.account-trainer-dashboard__skeleton-line--activity-title {
  width: 62%;
  height: 14px;
}

.account-trainer-dashboard__skeleton-line--activity-name {
  width: 46%;
  height: 12px;
}

.account-trainer-dashboard__skeleton-line--time {
  width: 72px;
  height: 12px;
}

.account-trainer-dashboard__skeleton-line--action {
  width: 100%;
  height: 16px;
}

@keyframes account-trainer-dashboard-skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 1120px) {
  .account-trainer-dashboard__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .account-trainer-dashboard__cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .account-trainer-dashboard__activity-item {
    grid-template-columns: 1fr;
  }

  .account-trainer-dashboard__activity-meta {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .account-trainer-dashboard__metrics {
    grid-template-columns: 1fr;
  }
}
</style>

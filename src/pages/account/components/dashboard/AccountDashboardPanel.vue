<template>
  <ElCard class="account__panel account-dashboard" shadow="never">
    <div v-if="showSkeleton" class="account-dashboard__skeleton" aria-busy="true">
      <section class="account-dashboard__metrics account-dashboard__metrics--skeleton">
        <article v-for="index in 4" :key="`metric-skeleton-${index}`" class="account-dashboard__metric">
          <span class="account-dashboard__skeleton-line account-dashboard__skeleton-line--label"></span>
          <span class="account-dashboard__skeleton-line account-dashboard__skeleton-line--value"></span>
          <span class="account-dashboard__skeleton-line account-dashboard__skeleton-line--hint"></span>
        </article>
      </section>

      <section class="account-dashboard__cards account-dashboard__cards--overview">
        <article class="account-dashboard__card account-dashboard__card--activity">
          <div class="account-dashboard__card-head">
            <span class="account-dashboard__skeleton-line account-dashboard__skeleton-line--eyebrow"></span>
            <div class="account-dashboard__actions">
              <span class="account-dashboard__skeleton-pill"></span>
              <span class="account-dashboard__skeleton-pill"></span>
            </div>
          </div>

          <div class="account-dashboard__activity-list">
            <div v-for="index in 4" :key="`activity-skeleton-${index}`" class="account-dashboard__activity-item">
              <div class="account-dashboard__activity-copy">
                <span class="account-dashboard__skeleton-line account-dashboard__skeleton-line--activity-title"></span>
                <span class="account-dashboard__skeleton-line account-dashboard__skeleton-line--activity-name"></span>
              </div>

              <div class="account-dashboard__activity-meta">
                <span class="account-dashboard__skeleton-pill account-dashboard__skeleton-pill--status"></span>
                <span class="account-dashboard__skeleton-line account-dashboard__skeleton-line--time"></span>
              </div>
            </div>
          </div>
        </article>

        <article class="account-dashboard__card account-dashboard__card--snapshot">
          <div class="account-dashboard__card-head">
            <span class="account-dashboard__skeleton-line account-dashboard__skeleton-line--eyebrow"></span>
            <span class="account-dashboard__skeleton-pill"></span>
          </div>

          <div class="account-dashboard__document-highlight account-dashboard__document-highlight--skeleton">
            <span class="account-dashboard__skeleton-line account-dashboard__skeleton-line--label"></span>
            <span class="account-dashboard__skeleton-line account-dashboard__skeleton-line--document-name"></span>
            <span class="account-dashboard__skeleton-line account-dashboard__skeleton-line--meta"></span>
            <span class="account-dashboard__skeleton-line account-dashboard__skeleton-line--meta"></span>
          </div>

          <div class="account-dashboard__mini-stats">
            <article v-for="index in 4" :key="`mini-stat-skeleton-${index}`" class="account-dashboard__mini-stat">
              <span class="account-dashboard__skeleton-line account-dashboard__skeleton-line--label"></span>
              <span class="account-dashboard__skeleton-line account-dashboard__skeleton-line--mini-value"></span>
            </article>
          </div>

          <div class="account-dashboard__snapshot-footer">
            <span class="account-dashboard__skeleton-line account-dashboard__skeleton-line--footer-note"></span>
            <span class="account-dashboard__skeleton-pill account-dashboard__skeleton-pill--footer"></span>
          </div>
        </article>
      </section>
    </div>

    <div v-else class="account-dashboard__body">
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

      <section class="account-dashboard__cards account-dashboard__cards--overview">
        <article class="account-dashboard__card account-dashboard__card--activity">
          <div class="account-dashboard__card-head">
            <p class="account__panel-eyebrow">Последние события</p>
          </div>

          <div class="account-dashboard__activity-list">
            <div
              v-for="item in latestActivityRows"
              :key="item.id"
              class="account-dashboard__activity-item"
              :class="{ 'account-dashboard__activity-item--empty': item.isEmpty }"
            >
              <template v-if="!item.isEmpty">
                <div class="account-dashboard__activity-copy">
                  <span class="account-dashboard__activity-title">{{ item.name }}</span>
                  <span class="account-dashboard__activity-name">{{ item.actionLabel }}</span>
                </div>

                <div class="account-dashboard__activity-meta">
                  <ElTag :type="item.tagType" effect="light" round class="account-dashboard__status-badge">
                    {{ item.tagLabel }}
                  </ElTag>
                  <span class="account-dashboard__activity-time">{{ item.timeLabel }}</span>
                </div>
              </template>

              <span v-else class="account-dashboard__activity-placeholder" aria-hidden="true">
                Нет события
              </span>
            </div>
          </div>
        </article>

        <article class="account-dashboard__card account-dashboard__card--snapshot">
          <div class="account-dashboard__card-head">
            <p class="account__panel-eyebrow">Документы</p>
          </div>

          <div v-if="latestDocumentRows.length" class="account-dashboard__activity-list">
            <div
              v-for="item in latestDocumentRows"
              :key="item.id"
              class="account-dashboard__activity-item"
            >
              <div class="account-dashboard__activity-copy">
                <span class="account-dashboard__activity-title">{{ item.ownerName }}</span>
                <span class="account-dashboard__activity-name">{{ item.documentLabel }}</span>
              </div>

              <div class="account-dashboard__activity-meta">
                <ElTag :type="item.tagType" effect="light" round class="account-dashboard__status-badge">
                  {{ item.tagLabel }}
                </ElTag>
                <span class="account-dashboard__activity-time">{{ item.timeLabel }}</span>
              </div>
            </div>
          </div>

          <div v-else class="account-dashboard__empty account-dashboard__empty--documents">
            Документов на проверку нет.
          </div>

        </article>
      </section>
    </div>
  </ElCard>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElCard, ElTag } from 'element-plus'
import { CRM_ROLE } from '@/utils/crmRoles'
import {
  competitionRegistrationRecordStatusType,
  formatCompactDateTime,
  formatConsultationFullName,
  formatConsultationStatus,
  formatTrainerBookingClientName,
  formatTrainerBookingStatus,
  consultationStatusType,
  trainerBookingStatusType,
} from '@/pages/account/utils/accountFormatters'
import { CONSULTATION_STATUS, TRAINER_BOOKING_STATUS } from '@/pages/account/utils/accountConstants'
import {
  loadAllCompetitionRegistrationsForAdmin,
  subscribeToCompetitionRegistrationChanges,
} from '@/pages/account/utils/accountCompetitionRegistrations'

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
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
  openCompetitionRegistrationsCount: {
    type: Number,
    required: true,
  },
})

defineEmits(['select-section'])

const showSkeleton = computed(() => props.isLoading)

const DASHBOARD_ACTIVITY_ROWS_COUNT = 4
const DASHBOARD_DOCUMENT_ROWS_COUNT = 4

function getRecordTimestamp(record) {
  return (
    Date.parse(record?.updatedAt || record?.statusChangedAt || record?.reviewedAt || record?.createdAt || 0) ||
    0
  )
}

function formatRelativeShortDate(record) {
  if (!record) {
    return 'Нет данных'
  }

  return formatCompactDateTime(record.updatedAt || record.statusChangedAt || record.createdAt)
}

const competitionRegistrations = ref([])
let competitionRegistrationsLoadRequestId = 0
let unsubscribeFromCompetitionApplications = null

async function loadCompetitionRegistrations() {
  const requestId = competitionRegistrationsLoadRequestId + 1
  competitionRegistrationsLoadRequestId = requestId

  try {
    const nextRegistrations = await loadAllCompetitionRegistrationsForAdmin()

    if (requestId === competitionRegistrationsLoadRequestId) {
      competitionRegistrations.value = nextRegistrations
    }
  } catch {
    if (requestId === competitionRegistrationsLoadRequestId) {
      competitionRegistrations.value = []
    }
  }
}

const latestDocumentRows = computed(() => {
  const items = props.users
    .flatMap((user) =>
      (user.documents || [])
        .filter((document) => document && document.status && document.status !== 'missing')
        .map((document) => ({
          id: `${user.id || user.email || user.name || 'unknown-user'}-${document.id || document.label || getRecordTimestamp(document)}`,
          ownerName: user.name || 'Без имени',
          documentLabel: document.label || 'Документ',
          tagType: 'info',
          tagLabel: 'На проверке',
          timeLabel: formatRelativeShortDate(document),
          at: getRecordTimestamp(document),
        })),
    )
    .filter((item) => item.at > 0)

  return items.sort((left, right) => right.at - left.at).slice(0, DASHBOARD_DOCUMENT_ROWS_COUNT)
})

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

const latestActivityItems = computed(() => {
  const consultationItems = props.consultationRequests.map((request) => ({
    id: `consultation-${request.id}`,
    name: formatConsultationFullName(request),
    actionLabel: 'Консультация запланирована',
    tagType: consultationStatusType(request.status),
    tagLabel: formatConsultationStatus(request.status),
    timeLabel: formatRelativeShortDate(request),
    section: 'consultations',
    at: getRecordTimestamp(request),
  }))

  const trainerBookingItems = props.trainerBookings.map((booking) => ({
    id: `trainer-booking-${booking.id}`,
    name: formatTrainerBookingClientName(booking),
    actionLabel: 'Спортсмен добавлен',
    tagType: trainerBookingStatusType(booking.status),
    tagLabel: formatTrainerBookingStatus(booking.status),
    timeLabel: formatRelativeShortDate(booking),
    section: 'trainer-bookings',
    at: getRecordTimestamp(booking),
  }))

  const competitionRegistrationItems = competitionRegistrations.value.map((registration) => ({
    id: `competition-registration-${registration.id}`,
    name: `${registration.participantName || 'Без имени'} · ${
      registration.competitionName || 'Соревнование не указано'
    }`,
    actionLabel: registration.status === 'withdrawn' ? 'Участник снят' : 'Участник подан',
    tagType: competitionRegistrationRecordStatusType(registration.status),
    tagLabel: registration.status === 'withdrawn' ? 'Снята' : 'Подана',
    timeLabel: formatRelativeShortDate(registration),
    section: 'registrations',
    at: getRecordTimestamp(registration),
  }))

  const items = [
    ...consultationItems,
    ...trainerBookingItems,
    ...competitionRegistrationItems,
  ].filter((item) => item.at > 0)

  return items.sort((left, right) => {
    const leftTime = left.at || 0
    const rightTime = right.at || 0

    return rightTime - leftTime
  })
})

const latestActivityRows = computed(() => {
  const rows = latestActivityItems.value.slice(0, DASHBOARD_ACTIVITY_ROWS_COUNT)

  while (rows.length < DASHBOARD_ACTIVITY_ROWS_COUNT) {
    rows.push({
      id: `activity-placeholder-${rows.length}`,
      isEmpty: true,
    })
  }

  return rows
})

onMounted(() => {
  void loadCompetitionRegistrations()

  unsubscribeFromCompetitionApplications = subscribeToCompetitionRegistrationChanges(() => {
    void loadCompetitionRegistrations()
  })
})

onBeforeUnmount(() => {
  if (unsubscribeFromCompetitionApplications) {
    unsubscribeFromCompetitionApplications()
    unsubscribeFromCompetitionApplications = null
  }
})
</script>

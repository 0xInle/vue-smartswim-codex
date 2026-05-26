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

      <section class="account-dashboard__cards account-dashboard__cards--overview">
        <article class="account-dashboard__card account-dashboard__card--activity">
          <div class="account-dashboard__card-head">
            <p class="account__panel-eyebrow">Последние события</p>
            <div class="account-dashboard__actions">
              <ElButton
                class="account-dashboard__action"
                plain
                type="primary"
                @click="$emit('select-section', 'consultations')"
              >
                Открыть CRM
              </ElButton>
              <ElButton
                class="account-dashboard__action"
                plain
                type="primary"
                @click="$emit('select-section', 'email')"
              >
                Письма
              </ElButton>
            </div>
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
                  <span class="account-dashboard__activity-title">{{ item.title }}</span>
                  <span class="account-dashboard__activity-name">{{ item.name }}</span>
                </div>

                <div class="account-dashboard__activity-meta">
                  <ElTag :type="item.tagType" effect="light" round>
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
            <ElButton
              class="account-dashboard__action"
              plain
              type="primary"
              @click="$emit('select-section', 'documents')"
            >
              Проверить
            </ElButton>
          </div>

          <div
            v-if="latestDocumentContributor"
            class="account-dashboard__document-highlight"
            :class="{
              'account-dashboard__document-highlight--empty': !latestDocumentContributor.ownerName,
            }"
          >
            <span class="account-dashboard__document-highlight-label">
              Последний загрузивший документы
            </span>
            <strong class="account-dashboard__document-highlight-name">
              {{ latestDocumentContributor.ownerName }}
            </strong>
            <span class="account-dashboard__document-highlight-meta">
              {{ latestDocumentContributor.documentLabel }} · {{ latestDocumentContributor.timeLabel }}
            </span>
            <span class="account-dashboard__document-highlight-meta">
              {{ latestDocumentContributor.documentCount }} документов загружено
            </span>
          </div>

          <div v-else class="account-dashboard__document-highlight account-dashboard__document-highlight--empty">
            <span class="account-dashboard__document-highlight-label">
              Последний загрузивший документы
            </span>
            <strong class="account-dashboard__document-highlight-name">Нет данных</strong>
            <span class="account-dashboard__document-highlight-meta">Документы пока не загружены</span>
          </div>

          <div class="account-dashboard__mini-stats">
            <article class="account-dashboard__mini-stat">
              <span class="account-dashboard__mini-stat-label">На проверке</span>
              <strong class="account-dashboard__mini-stat-value">{{ documentsSummary.pending }}</strong>
            </article>

            <article class="account-dashboard__mini-stat">
              <span class="account-dashboard__mini-stat-label">С замечаниями</span>
              <strong class="account-dashboard__mini-stat-value">{{ documentsSummary.attention }}</strong>
            </article>

            <article class="account-dashboard__mini-stat">
              <span class="account-dashboard__mini-stat-label">Подано</span>
              <strong class="account-dashboard__mini-stat-value">{{ competitionSubmittedCount }}</strong>
            </article>

            <article class="account-dashboard__mini-stat">
              <span class="account-dashboard__mini-stat-label">Снято</span>
              <strong class="account-dashboard__mini-stat-value">{{ competitionWithdrawnCount }}</strong>
            </article>
          </div>

          <div class="account-dashboard__snapshot-footer">
            <span class="account-dashboard__snapshot-note">
              Открытых этапов: {{ openCompetitionRegistrationsCount }}
            </span>
            <button
              type="button"
              class="account-dashboard__snapshot-link btn-reset"
              @click="$emit('select-section', 'registrations')"
            >
              К заявкам на соревнования
            </button>
          </div>
        </article>
      </section>
    </div>
  </ElCard>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElButton, ElCard, ElTag } from 'element-plus'
import { CRM_ROLE } from '@/utils/crmRoles'
import {
  competitionRegistrationRecordStatusType,
  formatCompactDateTime,
  formatConsultationFullName,
  formatConsultationStatus,
  formatTrainerBookingClientName,
  formatTrainerBookingStatus,
  getAccountDocumentsAdmissionStatus,
} from '@/pages/account/utils/accountFormatters'
import { CONSULTATION_STATUS, TRAINER_BOOKING_STATUS } from '@/pages/account/utils/accountConstants'
import {
  loadAllCompetitionRegistrationsForAdmin,
  subscribeToCompetitionRegistrationChanges,
} from '@/pages/account/utils/accountCompetitionRegistrations'

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
  openCompetitionRegistrationsCount: {
    type: Number,
    required: true,
  },
})

defineEmits(['select-section'])

const DASHBOARD_ACTIVITY_ROWS_COUNT = 4

function sortByDateDesc(items, field) {
  return [...items].sort((left, right) => {
    const leftValue = new Date(left?.[field] || 0).getTime()
    const rightValue = new Date(right?.[field] || 0).getTime()

    return rightValue - leftValue
  })
}

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

const latestConsultation = computed(
  () => sortByDateDesc(props.consultationRequests, 'createdAt')[0] || null,
)

const latestTrainerBooking = computed(
  () => sortByDateDesc(props.trainerBookings, 'createdAt')[0] || null,
)

const latestCompetitionRegistration = computed(
  () =>
    sortByDateDesc(competitionRegistrations.value, 'updatedAt')[0] ||
    sortByDateDesc(competitionRegistrations.value, 'statusChangedAt')[0] ||
    sortByDateDesc(competitionRegistrations.value, 'createdAt')[0] ||
    null,
)

const latestDocumentContributor = computed(() => {
  const candidates = props.users
    .map((user) => {
      const loadedDocuments = (user.documents || [])
        .filter((document) => document && document.status && document.status !== 'missing')
        .slice()
        .sort((left, right) => getRecordTimestamp(right) - getRecordTimestamp(left))

      if (!loadedDocuments.length) {
        return null
      }

      const latestDocument = loadedDocuments[0]

      return {
        id: user.id || user.email || user.name || 'unknown-user',
        ownerName: user.name || 'Без имени',
        documentLabel: latestDocument.label,
        documentCount: loadedDocuments.length,
        timeLabel: formatRelativeShortDate(latestDocument),
        at: getRecordTimestamp(latestDocument),
      }
    })
    .filter(Boolean)

  return candidates.sort((left, right) => right.at - left.at)[0] || null
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

const documentsSummary = computed(() => {
  const summary = {
    pending: 0,
    attention: 0,
    admitted: 0,
    missing: 0,
  }

  props.users.forEach((user) => {
    const documentStatus = getAccountDocumentsAdmissionStatus(user.documents || [])

    if (documentStatus.status === 'pending') {
      summary.pending += 1
      return
    }

    if (documentStatus.status === 'attention') {
      summary.attention += 1
      return
    }

    if (documentStatus.status === 'admitted') {
      summary.admitted += 1
      return
    }

    summary.missing += 1
  })

  return summary
})

const competitionSubmittedCount = computed(
  () => competitionRegistrations.value.filter((registration) => registration.status === 'submitted').length,
)
const competitionWithdrawnCount = computed(
  () => competitionRegistrations.value.filter((registration) => registration.status === 'withdrawn').length,
)

const latestActivityItems = computed(() => {
  const items = []

  if (latestConsultation.value) {
    items.push({
      id: `consultation-${latestConsultation.value.id}`,
      title: 'Консультация',
      name: formatConsultationFullName(latestConsultation.value),
      tagType: 'danger',
      tagLabel: formatConsultationStatus(latestConsultation.value.status),
      timeLabel: formatRelativeShortDate(latestConsultation.value),
      section: 'consultations',
      at: getRecordTimestamp(latestConsultation.value),
    })
  }

  if (latestTrainerBooking.value) {
    items.push({
      id: `trainer-booking-${latestTrainerBooking.value.id}`,
      title: 'Тренер',
      name: formatTrainerBookingClientName(latestTrainerBooking.value),
      tagType: 'primary',
      tagLabel: formatTrainerBookingStatus(latestTrainerBooking.value.status),
      timeLabel: formatRelativeShortDate(latestTrainerBooking.value),
      section: 'trainer-bookings',
      at: getRecordTimestamp(latestTrainerBooking.value),
    })
  }

  if (latestCompetitionRegistration.value) {
    items.push({
      id: `competition-registration-${latestCompetitionRegistration.value.id}`,
      title: 'Спортсмен',
      name: `${latestCompetitionRegistration.value.participantName || 'Без имени'} · ${
        latestCompetitionRegistration.value.competitionName || 'Соревнование не указано'
      }`,
      tagType: competitionRegistrationRecordStatusType(latestCompetitionRegistration.value.status),
      tagLabel: latestCompetitionRegistration.value.status === 'withdrawn' ? 'Снята' : 'Подана',
      timeLabel: formatRelativeShortDate(latestCompetitionRegistration.value),
      section: 'registrations',
      at: getRecordTimestamp(latestCompetitionRegistration.value),
    })
  }

  if (latestDocumentContributor.value) {
    items.push({
      id: `document-${latestDocumentContributor.value.id}`,
      title: 'Документы',
      name: latestDocumentContributor.value.ownerName,
      tagType: 'primary',
      tagLabel: 'Последний загрузивший',
      timeLabel: `${latestDocumentContributor.value.documentLabel} · ${latestDocumentContributor.value.timeLabel}`,
      section: 'documents',
      at: latestDocumentContributor.value.at,
    })
  }

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

<template>
  <ElCard class="account__panel account-user-dashboard" shadow="never">
    <div class="account-user-dashboard__body">
      <section class="account-user-dashboard__metrics" aria-label="Ключевые показатели">
        <article class="account-user-dashboard__metric">
          <p class="account-user-dashboard__metric-label">Спортсмены</p>
          <strong class="account-user-dashboard__metric-value">{{ athletesCount }}</strong>
          <span class="account-user-dashboard__metric-hint">{{ athletesHint }}</span>
        </article>

        <article class="account-user-dashboard__metric">
          <p class="account-user-dashboard__metric-label">Регистрация на соревнования</p>
          <strong class="account-user-dashboard__metric-value">{{
            activeRegistrationsCount
          }}</strong>
          <span class="account-user-dashboard__metric-hint">{{ registrationsHint }}</span>
        </article>

        <article class="account-user-dashboard__metric">
          <p class="account-user-dashboard__metric-label">Соревнований открыто</p>
          <strong class="account-user-dashboard__metric-value">{{ openCompetitionsCount }}</strong>
          <span class="account-user-dashboard__metric-hint">доступно для подачи заявки</span>
        </article>

        <article class="account-user-dashboard__metric">
          <p class="account-user-dashboard__metric-label">Допуск</p>
          <strong class="account-user-dashboard__metric-value">{{ admissionLabel }}</strong>
          <span class="account-user-dashboard__metric-hint">{{ admissionHint }}</span>
        </article>
      </section>

      <section class="account-user-dashboard__cards">
        <article class="account-user-dashboard__card">
          <div>
            <p class="account__panel-eyebrow">Документы</p>
            <h4 class="account-user-dashboard__card-title">Состояние допуска</h4>
          </div>

          <div class="account-user-dashboard__mini-stats">
            <div class="account-user-dashboard__mini-stat">
              <span class="account-user-dashboard__mini-stat-label">Одобрены</span>
              <strong class="account-user-dashboard__mini-stat-value">{{
                admittedAthletesCount
              }}</strong>
            </div>
            <div class="account-user-dashboard__mini-stat">
              <span class="account-user-dashboard__mini-stat-label">На проверке</span>
              <strong class="account-user-dashboard__mini-stat-value">{{
                pendingAthletesCount
              }}</strong>
            </div>
            <div class="account-user-dashboard__mini-stat">
              <span class="account-user-dashboard__mini-stat-label">Нужны документы</span>
              <strong class="account-user-dashboard__mini-stat-value">{{
                attentionAthletesCount
              }}</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  </ElCard>
</template>

<script setup>
import { ElCard } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref, toRef, watch } from 'vue'
import {
  COMPETITION_REGISTRATION_RECORD_STATUS,
  isCompetitionRegistrationActiveStatus,
} from '@/pages/account/utils/accountConstants'
import {
  refreshAccountAdmissionWorkflowForCurrentUser,
  resolveAccountAdmissionStatus,
} from '@/pages/account/utils/accountAdmissions'
import { loadCompetitionRegistrationsForCurrentUser } from '@/pages/account/utils/accountCompetitionRegistrations'
import {
  loadAccountAthletesForCurrentUser,
  loadAccountProfileForCurrentUser,
  subscribeToAccountProfileAthleteChanges,
} from '@/domains/account-data/accountDataRepository'
import {
  loadAccountDocumentsForCurrentUser,
  subscribeToAccountDocumentChanges,
} from '@/domains/account-documents/documentRepository'
import { createEmptyAccountProfile } from '@/domains/account-data/accountDataMappers'
import { subscribeToAccountAdmissionWorkflowChanges } from '@/domains/account-admissions/accountAdmissionRepository'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
  openCompetitionsCount: {
    type: Number,
    default: 0,
  },
})

const currentUserRef = toRef(props, 'currentUser')

const profileSnapshot = ref(createEmptyAccountProfile(props.currentUser))
const athleteSnapshots = ref([])
const registrations = ref([])
let registrationsLoadRequestId = 0
let dashboardDataLoadRequestId = 0
let unsubscribeFromAccountData = null
let unsubscribeFromAccountDocuments = null
let unsubscribeFromAdmissionWorkflow = null

const currentUserKey = computed(() => {
  const user = currentUserRef.value || null

  return user?.id || user?.email || 'anonymous'
})

const profileAdmission = computed(() =>
  resolveAccountAdmissionStatus({
    ownerUserKey: props.currentUser?.id || props.currentUser?.email || 'anonymous',
    scope: 'profile',
    scopeId: 'profile',
    documents: profileSnapshot.value.documents || [],
  }),
)

const athleteAdmissions = computed(() =>
  athleteSnapshots.value.map((athlete) =>
    resolveAccountAdmissionStatus({
      ownerUserKey: props.currentUser?.id || props.currentUser?.email || 'anonymous',
      scope: 'athlete',
      scopeId: athlete.id,
      documents: athlete.documents || [],
    }),
  ),
)

const athletesCount = computed(() => athleteSnapshots.value.length)
const admittedAthletesCount = computed(
  () => athleteAdmissions.value.filter((admission) => admission.status === 'admitted').length,
)
const pendingAthletesCount = computed(
  () =>
    athleteAdmissions.value.filter((admission) => ['pending', 'ready'].includes(admission.status))
      .length,
)
const attentionAthletesCount = computed(
  () =>
    athleteAdmissions.value.filter((admission) =>
      ['attention', 'missing'].includes(admission.status),
    ).length,
)

const admissionLabel = computed(() => {
  if (!athletesCount.value) {
    return profileAdmission.value.label
  }

  return `${admittedAthletesCount.value}/${athletesCount.value}`
})

const admissionHint = computed(() => {
  if (!athletesCount.value) {
    return profileAdmission.value.description
  }

  return `${formatCount(admittedAthletesCount.value, ['спортсмен допущен', 'спортсмена допущены', 'спортсменов допущены'])}`
})

const activeRegistrationsCount = computed(
  () =>
    registrations.value.filter((registration) =>
      isCompetitionRegistrationActiveStatus(registration.status),
    ).length,
)
const withdrawnRegistrationsCount = computed(
  () =>
    registrations.value.filter(
      (registration) => registration.status === COMPETITION_REGISTRATION_RECORD_STATUS.WITHDRAWN,
    ).length,
)

const athletesHint = computed(() => {
  if (!athletesCount.value) {
    return 'спортсмены не добавлены'
  }

  return formatCount(athletesCount.value, [
    'спортсмен добавлен',
    'спортсмена добавлены',
    'спортсменов добавлены',
  ])
})

const registrationsHint = computed(() => {
  if (!registrations.value.length) {
    return 'заявок пока нет'
  }

  if (!withdrawnRegistrationsCount.value) {
    return `${registrations.value.length} всего`
  }

  return `${registrations.value.length} всего, ${withdrawnRegistrationsCount.value} снято`
})

function formatCount(value, forms) {
  const normalizedValue = Math.abs(Number(value) || 0)
  const lastDigit = normalizedValue % 10
  const lastTwoDigits = normalizedValue % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${value} ${forms[2]}`
  }

  if (lastDigit === 1) {
    return `${value} ${forms[0]}`
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${value} ${forms[1]}`
  }

  return `${value} ${forms[2]}`
}

async function loadRegistrations() {
  const requestId = registrationsLoadRequestId + 1
  registrationsLoadRequestId = requestId

  try {
    const nextRegistrations = await loadCompetitionRegistrationsForCurrentUser(currentUserRef)

    if (requestId === registrationsLoadRequestId) {
      registrations.value = nextRegistrations
    }
  } catch {
    if (requestId === registrationsLoadRequestId) {
      registrations.value = []
    }
  }
}

async function loadDashboardData() {
  const requestId = dashboardDataLoadRequestId + 1
  dashboardDataLoadRequestId = requestId

  try {
    const [profile, profileDocuments, sourceAthletes] = await Promise.all([
      loadAccountProfileForCurrentUser({ currentUser: currentUserRef }),
      loadAccountDocumentsForCurrentUser({ scope: 'profile', scopeId: 'profile' }),
      loadAccountAthletesForCurrentUser(),
      refreshAccountAdmissionWorkflowForCurrentUser(),
    ])
    const athletesWithDocuments = await Promise.all(
      sourceAthletes.map(async (athlete) => ({
        ...athlete,
        documents: await loadAccountDocumentsForCurrentUser({
          scope: 'athlete',
          scopeId: athlete.id,
        }),
      })),
    )

    if (requestId !== dashboardDataLoadRequestId) {
      return
    }

    profileSnapshot.value = {
      ...profile,
      documents: profileDocuments,
    }
    athleteSnapshots.value = athletesWithDocuments
  } catch {
    if (requestId === dashboardDataLoadRequestId) {
      profileSnapshot.value = createEmptyAccountProfile(props.currentUser)
      athleteSnapshots.value = []
    }
  }
}

watch(currentUserKey, () => {
  void loadDashboardData()
  void loadRegistrations()
}, { immediate: true })

onMounted(() => {
  unsubscribeFromAccountData = subscribeToAccountProfileAthleteChanges(() => {
    void loadDashboardData()
  })
  unsubscribeFromAccountDocuments = subscribeToAccountDocumentChanges(() => {
    void loadDashboardData()
  })
  unsubscribeFromAdmissionWorkflow = subscribeToAccountAdmissionWorkflowChanges(() => {
    void loadDashboardData()
  })
})

onBeforeUnmount(() => {
  if (unsubscribeFromAccountData) {
    unsubscribeFromAccountData()
    unsubscribeFromAccountData = null
  }

  if (unsubscribeFromAccountDocuments) {
    unsubscribeFromAccountDocuments()
    unsubscribeFromAccountDocuments = null
  }

  if (unsubscribeFromAdmissionWorkflow) {
    unsubscribeFromAdmissionWorkflow()
    unsubscribeFromAdmissionWorkflow = null
  }
})
</script>

<style scoped>
.account-user-dashboard__body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.account-user-dashboard__metrics,
.account-user-dashboard__cards {
  display: contents;
}

.account-user-dashboard__card {
  grid-column: 1 / -1;
}

.account-user-dashboard__metric,
.account-user-dashboard__card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e5eaf3;
  border-radius: 10px;
  background: rgb(255 255 255 / 0.9);
  box-shadow: 0 12px 26px rgb(15 23 42 / 0.06);
}

.account-user-dashboard__metric-label {
  margin: 0;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.account-user-dashboard__metric-value {
  font-family: Oswald, sans-serif;
  font-size: 28px;
  line-height: 1;
  text-transform: uppercase;
  color: var(--black);
}

.account-user-dashboard__metric-hint {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
  color: #526072;
}

.account-user-dashboard__card-title {
  margin: 6px 0 0;
  font-family: Oswald, sans-serif;
  font-size: 20px;
  line-height: 1.05;
  text-transform: uppercase;
  color: var(--black);
}

.account-user-dashboard__mini-stat-label {
  font-size: 10px;
  font-weight: 900;
  line-height: 1.25;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.account-user-dashboard__mini-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.account-user-dashboard__mini-stat {
  display: grid;
  grid-template-rows: minmax(42px, auto) 1fr;
  gap: 4px;
  min-height: 118px;
  padding: 10px 12px;
  border: 1px solid #e5eaf3;
  border-radius: 10px;
  background: rgb(255 255 255 / 0.92);
}

.account-user-dashboard__mini-stat-label {
  display: flex;
  align-items: flex-start;
}

.account-user-dashboard__mini-stat-value {
  align-self: end;
  font-family: Oswald, sans-serif;
  font-size: 24px;
  line-height: 1;
  text-transform: uppercase;
  color: var(--black);
}

.account-user-dashboard__source {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
  color: #64748b;
}

@media (max-width: 960px) {
  .account-user-dashboard__mini-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .account-user-dashboard__body {
    grid-template-columns: 1fr;
  }
}
</style>

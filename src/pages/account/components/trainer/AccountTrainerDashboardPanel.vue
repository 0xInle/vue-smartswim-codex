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
          <p class="account-trainer-dashboard__metric-label">Готово</p>
          <strong class="account-trainer-dashboard__metric-value">{{ summary.readyCount }}</strong>
          <span class="account-trainer-dashboard__metric-hint">Можно завершать</span>
        </article>

        <article class="account-trainer-dashboard__metric account-trainer-dashboard__metric--attention">
          <p class="account-trainer-dashboard__metric-label">Нужны данные</p>
          <strong class="account-trainer-dashboard__metric-value">{{ summary.needsDataCount }}</strong>
          <span class="account-trainer-dashboard__metric-hint">Требуют уточнения</span>
        </article>
      </section>

      <section class="account-trainer-dashboard__cards">
        <article class="account-trainer-dashboard__card account-trainer-dashboard__card--activity">
          <div class="account-trainer-dashboard__card-head">
            <div>
              <p class="account__panel-eyebrow">Последние изменения</p>
              <h4 class="account-trainer-dashboard__card-title">Заявки спортсменов</h4>
            </div>
          </div>

          <div v-if="hasActivityRows" class="account-trainer-dashboard__activity-list">
            <div
              v-for="item in latestActivityRows"
              :key="item.id"
              class="account-trainer-dashboard__activity-item"
              :class="{ 'account-trainer-dashboard__activity-item--empty': item.isEmpty }"
            >
              <template v-if="!item.isEmpty">
                <div class="account-trainer-dashboard__activity-copy">
                  <span class="account-trainer-dashboard__activity-title">
                    {{ item.title }}
                  </span>
                  <span class="account-trainer-dashboard__activity-name">
                    {{ item.name }}
                  </span>
                </div>

                <div class="account-trainer-dashboard__activity-meta">
                  <ElTag :type="item.tagType" effect="light" round>
                    {{ item.tagLabel }}
                  </ElTag>
                  <span class="account-trainer-dashboard__activity-time">
                    {{ item.timeLabel }}
                  </span>
                </div>
              </template>

              <span v-else class="account-trainer-dashboard__activity-placeholder" aria-hidden="true">
                Нет изменений
              </span>
            </div>
          </div>

          <div v-else class="account-trainer-dashboard__empty">
            Пока нет обработанных заявок. Здесь появятся последние действия по спортсменам.
          </div>
        </article>

        <article class="account-trainer-dashboard__card account-trainer-dashboard__card--snapshot">
          <div class="account-trainer-dashboard__card-head">
            <div>
              <p class="account__panel-eyebrow">Быстрый доступ</p>
              <h4 class="account-trainer-dashboard__card-title">Основные разделы</h4>
            </div>
          </div>

          <div class="account-trainer-dashboard__quick-actions">
            <ElButton
              class="account-trainer-dashboard__quick-action"
              plain
              type="primary"
              @click="$emit('select-section', 'athletes')"
            >
              Спортсмены
            </ElButton>
            <ElButton
              class="account-trainer-dashboard__quick-action"
              plain
              type="primary"
              @click="$emit('select-section', 'trainer-bookings')"
            >
              Мои заявки
            </ElButton>
            <ElButton
              class="account-trainer-dashboard__quick-action"
              plain
              type="primary"
              @click="$emit('select-section', 'settings')"
            >
              Настройки
            </ElButton>
          </div>
        </article>
      </section>
    </div>
  </ElCard>
</template>

<script setup>
import { ElButton, ElCard, ElTag } from 'element-plus'
import { computed, ref, toRef, watch } from 'vue'
import { useAccountDocumentReviews } from '@/pages/account/composables/useAccountDocumentReviews'
import {
  ATHLETE_APPLICATION_STATUS,
  CONSULTATION_STATUS,
} from '@/pages/account/utils/accountConstants'
import { formatCompactDateTime } from '@/pages/account/utils/accountFormatters'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
})

defineEmits(['select-section'])

const { groupedRows, refresh, isLoading } = useAccountDocumentReviews({
  currentUser: toRef(props, 'currentUser'),
})

const hasLoadedData = ref(false)
const currentUserKey = computed(() => props.currentUser?.id || props.currentUser?.email || 'anonymous')

const athleteGroups = computed(() =>
  groupedRows.value.filter((group) => group.participantKind === 'athlete'),
)

const showSkeleton = computed(() => isLoading.value && !hasLoadedData.value)

const summary = computed(() => ({
  newCount: athleteGroups.value.filter(
    (group) => group.statusMeta.status === CONSULTATION_STATUS.NEW,
  ).length,
  inWorkCount: athleteGroups.value.filter((group) =>
    [
      CONSULTATION_STATUS.PROCESSED,
      CONSULTATION_STATUS.CALL_BACK,
      CONSULTATION_STATUS.BUSY,
      CONSULTATION_STATUS.UNAVAILABLE,
      CONSULTATION_STATUS.SCHEDULED,
    ].includes(group.statusMeta.status),
  ).length,
  readyCount: athleteGroups.value.filter(
    (group) => group.statusMeta.status === ATHLETE_APPLICATION_STATUS.READY,
  ).length,
  needsDataCount: athleteGroups.value.filter(
    (group) => group.statusMeta.status === ATHLETE_APPLICATION_STATUS.NEEDS_DATA,
  ).length,
}))

function getGroupTimestamp(group) {
  const candidates = [
    group?.statusMeta?.updatedAt,
    group?.statusMeta?.createdAt,
    ...(Array.isArray(group?.documents) ? group.documents : []).flatMap((document) => [
      document.reviewedAt,
      document.uploadedAt,
    ]),
  ]

  return candidates.reduce((max, value) => {
    const timestamp = Date.parse(value || 0) || 0
    return Math.max(max, timestamp)
  }, 0)
}

const latestActivityRows = computed(() => {
  const rows = athleteGroups.value
    .slice()
    .sort((left, right) => getGroupTimestamp(right) - getGroupTimestamp(left))
    .slice(0, 4)
    .map((group) => ({
      id: group.id,
      title: group.participantName || group.ownerName || 'Без имени',
      name: `${group.ownerName || 'Не указан'} · ${group.participantClub || 'Клуб не указан'}`,
      tagType: group.statusMeta.tagType,
      tagLabel: group.statusMeta.label,
      timeLabel: formatCompactDateTime(
        group.statusMeta.updatedAt || group.statusMeta.createdAt || group.documents?.[0]?.uploadedAt,
      ),
    }))

  while (rows.length < 4) {
    rows.push({
      id: `trainer-dashboard-activity-placeholder-${rows.length}`,
      isEmpty: true,
    })
  }

  return rows
})

const hasActivityRows = computed(() => latestActivityRows.value.some((item) => !item.isEmpty))

watch(
  currentUserKey,
  () => {
    hasLoadedData.value = false
    refresh()
  },
  { immediate: true },
)

watch(isLoading, (loading, previousLoading) => {
  if (previousLoading && !loading) {
    hasLoadedData.value = true
  }
})
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
  grid-template-columns: 1fr;
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

.account-trainer-dashboard__activity-list {
  display: grid;
  gap: 10px;
}

.account-trainer-dashboard__activity-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid #e5eaf3;
  border-radius: 10px;
  background: rgb(255 255 255 / 0.92);
}

.account-trainer-dashboard__activity-item--empty {
  grid-template-columns: 1fr;
  justify-items: center;
  min-height: 60px;
}

.account-trainer-dashboard__activity-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.account-trainer-dashboard__activity-title {
  font-size: 15px;
  font-weight: 800;
  line-height: 1.3;
  color: var(--black);
}

.account-trainer-dashboard__activity-name {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  color: #526072;
}

.account-trainer-dashboard__activity-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-width: 0;
}

.account-trainer-dashboard__activity-time {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
}

.account-trainer-dashboard__activity-placeholder,
.account-trainer-dashboard__empty {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  color: #64748b;
  text-align: center;
}

.account-trainer-dashboard__empty {
  min-height: 124px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 20px;
  border: 1px dashed color-mix(in srgb, var(--cyan) 24%, white);
  background: rgb(255 255 255 / 0.62);
}

.account-trainer-dashboard__quick-actions {
  display: grid;
  gap: 10px;
}

.account-trainer-dashboard__quick-action {
  justify-content: flex-start;
  width: 100%;
  min-height: 44px;
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

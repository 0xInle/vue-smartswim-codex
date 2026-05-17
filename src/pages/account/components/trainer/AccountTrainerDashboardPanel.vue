<template>
  <ElCard class="account__panel account-trainer-dashboard" shadow="never">
    <div class="account-trainer-dashboard__body">
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
            <p class="account__panel-eyebrow">Последние изменения</p>
          </div>

          <div class="account-trainer-dashboard__empty">
            Пока нет обработанных заявок. Здесь появятся последние действия по спортсменам.
          </div>
        </article>

        <article class="account-trainer-dashboard__card account-trainer-dashboard__card--snapshot">
          <div class="account-trainer-dashboard__card-head">
            <p class="account__panel-eyebrow">Быстрый доступ</p>
          </div>

          <div class="account-trainer-dashboard__quick-actions">
            <button type="button" class="account-trainer-dashboard__quick-action btn-reset" disabled>
              Очередь заявок
            </button>
            <button type="button" class="account-trainer-dashboard__quick-action btn-reset" disabled>
              Нужны данные
            </button>
            <button type="button" class="account-trainer-dashboard__quick-action btn-reset" disabled>
              Завершенные
            </button>
          </div>
        </article>
      </section>
    </div>
  </ElCard>
</template>

<script setup>
import { ElCard } from 'element-plus'
import { computed, toRef, watch } from 'vue'
import { useAccountDocumentReviews } from '@/pages/account/composables/useAccountDocumentReviews'
import {
  ATHLETE_APPLICATION_STATUS,
  CONSULTATION_STATUS,
} from '@/pages/account/utils/accountConstants'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
})

const { groupedRows, refresh } = useAccountDocumentReviews({
  currentUser: toRef(props, 'currentUser'),
})

const athleteGroups = computed(() =>
  groupedRows.value.filter((group) => group.participantKind === 'athlete'),
)

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

watch(
  () => props.currentUser,
  () => {
    refresh()
  },
  { immediate: true },
)
</script>

<style scoped>
.account-trainer-dashboard__body {
  display: grid;
  gap: 18px;
}

.account-trainer-dashboard__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.account-trainer-dashboard__metric {
  display: grid;
  gap: 8px;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 68%);
  box-shadow: 0 10px 26px rgb(20 44 69 / 8%);
}

.account-trainer-dashboard__metric--attention {
  border-color: color-mix(in srgb, var(--orange) 24%, white);
}

.account-trainer-dashboard__metric-label {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.account-trainer-dashboard__metric-value {
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
  color: var(--black);
}

.account-trainer-dashboard__metric-hint {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
}

.account-trainer-dashboard__cards {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 12px;
}

.account-trainer-dashboard__card {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--cyan) 14%, white);
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 70%);
  box-shadow: 0 10px 26px rgb(20 44 69 / 8%);
}

.account-trainer-dashboard__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.account-trainer-dashboard__empty {
  min-height: 176px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 1px dashed color-mix(in srgb, var(--cyan) 24%, white);
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
  color: #64748b;
  text-align: center;
}

.account-trainer-dashboard__quick-actions {
  display: grid;
  gap: 10px;
}

.account-trainer-dashboard__quick-action {
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.72);
  font-size: 14px;
  font-weight: 800;
  color: #64748b;
  text-align: left;
  cursor: not-allowed;
}

@media (max-width: 1120px) {
  .account-trainer-dashboard__metrics,
  .account-trainer-dashboard__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .account-trainer-dashboard__metrics,
  .account-trainer-dashboard__cards {
    grid-template-columns: 1fr;
  }
}
</style>

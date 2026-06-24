<template>
  <ElCard class="account__panel account-materials" shadow="never">
    <div class="account-materials__header">
      <div>
        <h3 class="account__panel-title">Опубликованные файлы соревнований</h3>
      </div>

      <ElTag type="primary" effect="light" round>{{ materials.length }} материалов</ElTag>
    </div>

    <div v-if="materials.length" class="account-materials__list">
      <article
        v-for="material in materials"
        :key="material.id"
        class="account-materials__item"
      >
        <div class="account-materials__item-main">
          <ElTag :type="material.tagType" effect="light" round>{{ material.typeLabel }}</ElTag>
          <h4 class="account-materials__item-title">{{ material.title }}</h4>
          <p class="account-materials__item-meta">
            {{ material.competitionName }} · {{ formatCompetitionStageLabel(material.stage) }} ·
            {{ formatCompetitionCalendarDateShort(material.date) }}
          </p>
        </div>

        <a
          class="account__table-action account__table-action--edit account-materials__link"
          :href="material.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          Открыть
        </a>
      </article>
    </div>

    <ElEmpty v-else description="Опубликованных материалов пока нет." />
  </ElCard>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { ElCard, ElEmpty, ElTag } from 'element-plus'
import { buildAccountCompetitionStages } from '@/pages/account/accountCompetitionStages.data'
import { ensureCompetitionDirectionsLoaded } from '@/pages/competitions/competitionData'
import {
  formatCompetitionCalendarDateShort,
  formatCompetitionStageLabel,
} from '@/pages/account/utils/accountFormatters'

const MATERIAL_TYPES = [
  { key: 'protocolUrl', typeLabel: 'Протокол', tagType: 'success' },
  { key: 'photoUrl', typeLabel: 'Фото', tagType: 'primary' },
  { key: 'certificateUrl', typeLabel: 'Сертификаты', tagType: 'warning' },
  { key: 'memoUrl', typeLabel: 'Памятка', tagType: 'info' },
]

const materials = computed(() =>
  buildAccountCompetitionStages()
    .flatMap((stage) =>
      MATERIAL_TYPES.map((type) => {
        const url = String(stage[type.key] || '').trim()

        if (!url) {
          return null
        }

        return {
          id: `${stage.id}-${type.key}`,
          competitionName: stage.competitionName || 'Соревнование',
          stage: stage.stage,
          date: stage.date || '',
          typeLabel: type.typeLabel,
          tagType: type.tagType,
          title: buildMaterialTitle(type.typeLabel, stage),
          url,
        }
      }).filter(Boolean),
    )
    .sort((left, right) => {
      const leftTime = Date.parse(left.date)
      const rightTime = Date.parse(right.date)

      if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
        return rightTime - leftTime
      }

      return left.title.localeCompare(right.title, 'ru')
    }),
)

function buildMaterialTitle(typeLabel, stage) {
  const stageTitle = stage?.title ? `этап ${stage.title}` : formatCompetitionStageLabel(stage.stage)

  return `${typeLabel}: ${stageTitle}`
}

onMounted(() => {
  void ensureCompetitionDirectionsLoaded()
})
</script>

<style scoped>
.account-materials :deep(.el-card__body) {
  display: grid;
  gap: 18px;
}

.account-materials__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.account-materials__header :deep(.el-tag) {
  flex: 0 0 auto;
  padding: 4px 12px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 900;
}

.account-materials__list {
  display: grid;
  gap: 12px;
}

.account-materials__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--cyan) 18%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.82);
  box-shadow: 0 12px 28px rgb(15 23 42 / 0.06);
}

.account-materials__item-main {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.account-materials__item-main :deep(.el-tag) {
  justify-self: start;
  font-size: 11px;
  font-weight: 900;
}

.account-materials__item-title {
  margin: 0;
  color: #111827;
  font-family: 'Oswald', sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.account-materials__item-meta {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.35;
}

.account-materials__link {
  justify-self: end;
  min-width: 104px;
  text-align: center;
  text-decoration: none;
}

@media (max-width: 720px) {
  .account-materials__header,
  .account-materials__item {
    grid-template-columns: 1fr;
  }

  .account-materials__header {
    display: grid;
  }

  .account-materials__link {
    justify-self: stretch;
  }
}
</style>

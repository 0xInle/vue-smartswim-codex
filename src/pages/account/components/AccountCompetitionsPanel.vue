<template>
  <ElCard class="account__panel" shadow="never">
    <div class="account__competitions-toolbar">
      <label class="account__field account__field--search">
        <span class="account__field-label">Поиск</span>
        <input
          :value="search"
          class="account__input account__input--toolbar"
          type="search"
          name="competitions-search"
          placeholder="Поиск по участникам или оплатам"
          @input="$emit('update:search', $event.target.value)"
        />
      </label>

      <label class="account__field account__field--filter">
        <span class="account__field-label">Соревнование</span>
        <ElSelect
          :model-value="competitionFilter"
          class="account__select"
          popper-class="account__select-popper account__select-popper--full"
          placeholder="Все соревнования"
          @update:model-value="$emit('update:competition-filter', $event)"
        >
          <ElOption
            v-for="option in competitionOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </label>

      <div class="account__competitions-toolbar-meta">
        <ElTag type="primary" effect="light" round>{{ total }} оплат</ElTag>
      </div>
    </div>

    <div v-if="isLoading && !rows.length" class="account__loading-state">
      Загружаем соревнования...
    </div>

    <div v-else-if="rows.length" class="account__native-table-wrap">
      <table class="account__native-table account__native-table--competitions">
        <thead class="account__native-table-head">
          <tr>
            <th>ФИО</th>
            <th>Телефон</th>
            <th>Сумма</th>
            <th>Дата платежа</th>
            <th>Название соревнования</th>
            <th>Документы</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.id" class="account__native-table-row">
            <td class="account__native-table-cell account__native-table-cell--primary">
              <div class="account__table-user">
                <div class="account__table-primary">{{ row.fullName }}</div>
              </div>
            </td>
            <td class="account__native-table-cell account__native-table-cell--phone">
              {{ row.phone }}
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              {{ formatCompetitionPaymentAmount(row.amount) }}
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              {{ formatCompetitionPaymentDate(row.paymentDate) }}
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <ElTag
                :type="competitionNameTagType(row.competitionName)"
                effect="light"
                round
              >
                {{ formatCompetitionName(row.competitionName) }}
              </ElTag>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <div class="account__documents-cell">
                <button
                  type="button"
                  class="account__table-action account__table-action--ghost btn-reset"
                >
                  Скачать
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else description="Платежи по соревнованиям не найдены." />
  </ElCard>
</template>

<script setup>
import { ElCard, ElEmpty, ElOption, ElSelect, ElTag } from 'element-plus'
import {
  competitionNameTagType,
  formatCompetitionName,
  formatCompetitionPaymentAmount,
  formatCompetitionPaymentDate,
} from '@/pages/account/utils/accountFormatters'

defineProps({
  rows: {
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
  competitionFilter: {
    type: String,
    required: true,
  },
  competitionOptions: {
    type: Array,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
})

defineEmits(['update:search', 'update:competition-filter'])
</script>

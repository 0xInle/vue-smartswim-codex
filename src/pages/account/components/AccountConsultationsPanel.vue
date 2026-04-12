<template>
  <ElCard class="account__panel" shadow="never">
    <div class="account__consultations-toolbar">
      <label class="account__field account__field--search">
        <span class="account__field-label">Поиск</span>
        <input
          :value="search"
          class="account__input account__input--toolbar"
          type="search"
          name="consultation-search"
          placeholder="Имя, телефон, дата, статус"
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

    <div v-if="isLoading && !requests.length" class="account__loading-state">Загружаем заявки...</div>

    <ElTable
      v-else-if="requests.length"
      class="account__consultations-table"
      :data="rows"
      row-key="key"
      border
      stripe
      empty-text="Новых заявок пока нет."
      :span-method="spanMethod"
    >
      <ElTableColumn label="Клиент" min-width="220">
        <template #default="{ row }">
          <div v-if="row.kind === 'data'" class="account__table-user">
            <div class="account__table-primary">
              {{ formatConsultationFullName(row.request) }}
            </div>
          </div>

          <div v-else class="account__consultation-actions-row">
            <button
              type="button"
              class="account__table-action account__table-action--success btn-reset"
              :disabled="loadingId === row.request.id"
              @click="$emit('mark-processed', row.request)"
            >
              Обработана
            </button>

            <div class="account__consultation-status-editor">
              <ElSelect
                :model-value="getDraftStatus(row.request.id)"
                class="account__select"
                popper-class="account__select-popper"
                placeholder="Выберите исход"
                @update:model-value="$emit('draft-change', row.request.id, $event)"
              >
                <ElOption
                  v-for="option in statusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>

              <button
                type="button"
                class="account__table-action account__table-action--edit btn-reset"
                :disabled="loadingId === row.request.id || getDraftStatus(row.request.id) === row.request.status"
                @click="$emit('apply-draft', row.request)"
              >
                Применить
              </button>
            </div>

            <button
              type="button"
              class="account__table-action account__table-action--ghost btn-reset"
              :disabled="loadingId === row.request.id || row.request.status === consultationStatus.new"
              @click="$emit('reset-status', row.request)"
            >
              Сбросить
            </button>
          </div>
        </template>
      </ElTableColumn>

      <ElTableColumn prop="phone" label="Телефон" min-width="150">
        <template #default="{ row }">
          <span v-if="row.kind === 'data'">{{ row.request.phone }}</span>
        </template>
      </ElTableColumn>

      <ElTableColumn label="Дата" min-width="116" align="center">
        <template #default="{ row }">
          <span v-if="row.kind === 'data'">
            {{ formatConsultationDate(row.request.consultationDate) }}
          </span>
        </template>
      </ElTableColumn>

      <ElTableColumn label="Время" min-width="88" align="center">
        <template #default="{ row }">
          <span v-if="row.kind === 'data'">
            {{ row.request.consultationTime || 'Не указано' }}
          </span>
        </template>
      </ElTableColumn>

      <ElTableColumn label="Статус" min-width="156" align="center">
        <template #default="{ row }">
          <ElTag
            v-if="row.kind === 'data'"
            :type="consultationStatusType(row.request.status)"
            effect="light"
            round
          >
            {{ formatConsultationStatus(row.request.status) }}
          </ElTag>
        </template>
      </ElTableColumn>

      <ElTableColumn label="Получена" min-width="116" align="center">
        <template #default="{ row }">
          <span v-if="row.kind === 'data'">
            {{ formatCompactDateTime(row.request.createdAt) }}
          </span>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElEmpty v-else description="Новых заявок пока нет." />
  </ElCard>
</template>

<script setup>
import { ElButton, ElCard, ElEmpty, ElOption, ElSelect, ElTable, ElTableColumn, ElTag } from 'element-plus'
import { CONSULTATION_STATUS } from '@/pages/account/utils/accountConstants'
import {
  consultationStatusType,
  formatCompactDateTime,
  formatConsultationDate,
  formatConsultationFullName,
  formatConsultationStatus,
} from '@/pages/account/utils/accountFormatters'

defineProps({
  requests: {
    type: Array,
    required: true,
  },
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
  loadingId: {
    type: [Number, String, null],
    default: null,
  },
  getDraftStatus: {
    type: Function,
    required: true,
  },
  spanMethod: {
    type: Function,
    required: true,
  },
})

defineEmits([
  'refresh',
  'update:search',
  'update:status-filter',
  'mark-processed',
  'draft-change',
  'apply-draft',
  'reset-status',
])

const consultationStatus = {
  new: CONSULTATION_STATUS.NEW,
}
</script>

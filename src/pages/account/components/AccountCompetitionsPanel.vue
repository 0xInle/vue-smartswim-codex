<template>
  <ElCard class="account__panel account-competitions" shadow="never">
    <template #header>
      <div class="account__panel-head account-competitions__header">
        <div class="account__panel-actions account-competitions__summary">
          <ElTag type="primary" effect="light" round>{{ total }} этапов</ElTag>
          <ElTag type="success" effect="light" round>{{ activeCount }} активных</ElTag>
          <ElTag type="danger" effect="light" round>{{ archivedCount }} в архиве</ElTag>
        </div>
      </div>
    </template>

    <div class="account__competitions-toolbar">
      <label class="account__field account__field--filter">
        <span class="account__field-label">Соревнование</span>
        <ElSelect
          :model-value="competitionFilter"
          class="account__select"
          popper-class="account__select-popper account__select-popper--full"
          placeholder="Все соревнования"
          @update:model-value="emit('update:competition-filter', $event)"
        >
          <ElOption
            v-for="option in competitionOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </label>

      <div class="account__competition-view-switch" role="group" aria-label="Фильтр соревнований">
        <button
          type="button"
          class="account__competition-view-button btn-reset"
          :class="{
            'account__competition-view-button--active': competitionViewFilter === 'active',
          }"
          :aria-pressed="competitionViewFilter === 'active'"
          @click="emit('update:competition-view-filter', 'active')"
        >
          <span class="account__competition-view-button-label">Активные</span>
          <span class="account__competition-view-button-count">{{ activeCount }}</span>
        </button>

        <button
          type="button"
          class="account__competition-view-button btn-reset"
          :class="{
            'account__competition-view-button--active': competitionViewFilter === 'archived',
          }"
          :aria-pressed="competitionViewFilter === 'archived'"
          @click="emit('update:competition-view-filter', 'archived')"
        >
          <span class="account__competition-view-button-label">Архив</span>
          <span class="account__competition-view-button-count">{{ archivedCount }}</span>
        </button>
      </div>

      <button
        type="button"
        class="account__table-action account__table-action--success account__competition-add btn-reset"
        @click="openCreateCompetitionDialog"
      >
        Добавить
      </button>
    </div>

    <div v-if="isLoading && !rows.length" class="account__loading-state">
      Загружаем соревнования...
    </div>

    <div v-else-if="rows.length" class="account__native-table-wrap">
      <table
        class="account__native-table account__native-table--competitions"
        :class="{
          'account__native-table--competitions-archive': competitionViewFilter === 'archived',
        }"
      >
        <thead class="account__native-table-head">
          <tr v-if="competitionViewFilter === 'archived'">
            <th>Название соревнования</th>
            <th>Этап</th>
            <th>Дата начала</th>
            <th>Дата окончания</th>
          </tr>
          <tr v-else>
            <th>Название соревнования</th>
            <th>Этап</th>
            <th>Дата</th>
            <th>Протокол</th>
            <th>Фото</th>
            <th>Регистрация</th>
          </tr>
        </thead>

        <tbody>
          <template v-for="row in competitionRows" :key="row.id">
            <tr
              class="account__native-table-row"
              :class="{ 'account__native-table-row--archived': row.isArchived }"
            >
              <td class="account__native-table-cell account__native-table-cell--primary">
                <div class="account__competition-name">
                  <div class="account__competition-name-copy">
                    <span class="account__table-primary">
                      {{ formatCompetitionName(row.competitionName) }}
                    </span>
                  </div>

                </div>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account__competition-stage">
                  {{ formatCompetitionStageLabel(row.stage) }}
                </span>
              </td>
              <template v-if="competitionViewFilter === 'archived'">
                <td class="account__native-table-cell account__native-table-cell--center">
                  {{ formatCompetitionCalendarDateShort(row.date) }}
                </td>
                <td class="account__native-table-cell account__native-table-cell--center">
                  {{ formatCompetitionCalendarDateShort(row.date) }}
                </td>
              </template>
              <template v-else>
                <td class="account__native-table-cell account__native-table-cell--center">
                  {{ formatCompetitionCalendarDateShort(row.date) }}
                </td>
                <td class="account__native-table-cell account__native-table-cell--center">
                  <div
                    ref="linkEditorRefs"
                    class="account__competition-file"
                    :data-link-editor-id="getLinkEditorId(row, 'protocol')"
                  >
                    <button
                      type="button"
                      class="account__table-action account__table-action--icon account__table-action--protocol btn-reset"
                      :title="row.protocolUrl ? 'Протокол загружен' : 'Добавить ссылку на протокол'"
                      :aria-label="
                        row.protocolUrl ? 'Протокол загружен' : 'Добавить ссылку на протокол'
                      "
                      @click="toggleLinkEditor(row, 'protocol')"
                    >
                      <ElIcon>
                        <Link v-if="row.protocolUrl" />
                        <Upload v-else />
                      </ElIcon>
                    </button>

                    <form
                      v-if="isLinkEditorOpen(row, 'protocol')"
                      class="account__competition-link-form"
                      @submit.prevent="saveLinkEditor(row, 'protocol')"
                    >
                      <input
                        v-model="linkForm.url"
                        class="account__input account__input--compact"
                        type="url"
                        placeholder="Ссылка на протокол"
                      />
                      <button
                        type="submit"
                        class="account__table-action account__table-action--icon account__table-action--success btn-reset"
                        aria-label="Сохранить ссылку на протокол"
                        title="Сохранить"
                      >
                        <ElIcon>
                          <Check />
                        </ElIcon>
                      </button>
                    </form>
                  </div>
                </td>
                <td class="account__native-table-cell account__native-table-cell--center">
                  <div
                    ref="linkEditorRefs"
                    class="account__competition-file"
                    :data-link-editor-id="getLinkEditorId(row, 'photo')"
                  >
                    <button
                      type="button"
                      class="account__table-action account__table-action--icon account__table-action--photo btn-reset"
                      :title="row.photoUrl ? 'Фото загружено' : 'Добавить ссылку на фото'"
                      :aria-label="row.photoUrl ? 'Фото загружено' : 'Добавить ссылку на фото'"
                      @click="toggleLinkEditor(row, 'photo')"
                    >
                      <ElIcon>
                        <Link v-if="row.photoUrl" />
                        <Upload v-else />
                      </ElIcon>
                    </button>

                    <form
                      v-if="isLinkEditorOpen(row, 'photo')"
                      class="account__competition-link-form"
                      @submit.prevent="saveLinkEditor(row, 'photo')"
                    >
                      <input
                        v-model="linkForm.url"
                        class="account__input account__input--compact"
                        type="url"
                        placeholder="Ссылка на фото"
                      />
                      <button
                        type="submit"
                        class="account__table-action account__table-action--icon account__table-action--success btn-reset"
                        aria-label="Сохранить ссылку на фото"
                        title="Сохранить"
                      >
                        <ElIcon>
                          <Check />
                        </ElIcon>
                      </button>
                    </form>
                  </div>
                </td>
                <td class="account__native-table-cell account__native-table-cell--center">
                  <div class="account__competition-registration">
                    <span
                      class="account__competition-registration-dot"
                      :class="`account__competition-registration-dot--${competitionRegistrationState(row.registration)}`"
                      aria-hidden="true"
                    />
                    <span
                      v-if="formatCompetitionRegistrationWindow(row.registration)"
                      class="account__competition-registration-window"
                    >
                      {{ formatCompetitionRegistrationWindow(row.registration) }}
                    </span>
                  </div>
                </td>
              </template>
            </tr>

            <tr
              v-if="competitionViewFilter === 'active'"
              class="account__native-table-row account__native-table-row--actions"
            >
              <td class="account__native-table-cell" colspan="6">
                <div class="account__competition-actions-row">
                  <button
                    type="button"
                    class="account__table-action account__table-action--edit btn-reset"
                    @click="openCompetitionDialog(row)"
                  >
                    Редактирование
                  </button>
                  <button
                    type="button"
                    class="account__table-action account__table-action--delete btn-reset"
                    @click="openDeleteCompetitionDialog(row)"
                  >
                    Удаление
                  </button>
                  <button
                    type="button"
                    class="account__table-action account__table-action--distance btn-reset"
                    @click="openDistanceDialog(row)"
                  >
                    Настройка дистанции
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else :description="emptyStateDescription" />

    <AccountCompetitionEditDialog
      :model-value="isCompetitionDialogOpen"
      :stage="competitionDialogStage"
      :competition-options="competitionOptions"
      @close="closeCompetitionDialog"
      @submit="saveCompetitionDialog"
    />

    <AccountCompetitionCreateDialog
      :model-value="isCreateCompetitionDialogOpen"
      @close="closeCreateCompetitionDialog"
      @submit="saveCreateCompetitionDialog"
    />

    <AccountCompetitionDistanceDialog
      :model-value="isDistanceDialogOpen"
      :stage="distanceDialogStage"
      :description="distanceDialogDescription"
      @close="closeDistanceDialog"
      @submit="saveDistanceDialog"
    />

    <AccountCompetitionDeleteDialog
      :model-value="isDeleteCompetitionDialogOpen"
      :stage="deleteCompetitionStage"
      :active-registrations-count="deleteCompetitionActiveRegistrationsCount"
      @close="closeDeleteCompetitionDialog"
      @confirm="confirmDeleteCompetition"
    />
  </ElCard>
</template>

<script setup>
import { Check, Link, Upload } from '@element-plus/icons-vue'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElCard, ElEmpty, ElIcon, ElOption, ElSelect, ElTag } from 'element-plus'
import {
  formatCompetitionCalendarDateShort,
  formatCompetitionName,
  formatCompetitionRegistrationWindow,
  formatCompetitionStageLabel,
} from '@/pages/account/utils/accountFormatters'
import AccountCompetitionCreateDialog from '@/pages/account/components/AccountCompetitionCreateDialog.vue'
import AccountCompetitionDeleteDialog from '@/pages/account/components/AccountCompetitionDeleteDialog.vue'
import AccountCompetitionDistanceDialog from '@/pages/account/components/AccountCompetitionDistanceDialog.vue'
import AccountCompetitionEditDialog from '@/pages/account/components/AccountCompetitionEditDialog.vue'
import {
  resolveCompetitionRegistrationState,
  toCompetitionDateTime,
} from '@/utils/competitionRegistration'

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    required: true,
  },
  competitionFilter: {
    type: String,
    required: true,
  },
  competitionViewFilter: {
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
  activeCount: {
    type: Number,
    required: true,
  },
  archivedCount: {
    type: Number,
    required: true,
  },
  openCount: {
    type: Number,
    required: true,
  },
  getStageDistances: {
    type: Function,
    required: true,
  },
  getStageActiveRegistrationsCount: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'update:competition-filter',
  'update:competition-view-filter',
  'update-stage',
  'update-stage-links',
  'update-stage-distances',
  'create-stage',
  'delete-stage',
])

const isCompetitionDialogOpen = ref(false)
const isCreateCompetitionDialogOpen = ref(false)
const isDeleteCompetitionDialogOpen = ref(false)
const isDistanceDialogOpen = ref(false)
const competitionDialogStage = ref(null)
const deleteCompetitionStage = ref(null)
const distanceDialogStage = ref(null)
const linkEditor = reactive({
  stageId: '',
  type: '',
})
const linkForm = reactive({
  url: '',
})
const linkEditorRefs = ref([])

const competitionRows = computed(() =>
  props.rows.map((row) => ({
    ...row,
    isArchived: isCompetitionArchived(row),
  })),
)

const emptyStateDescription = computed(() =>
  props.competitionViewFilter === 'archived'
    ? 'Архив соревнований пока пуст.'
    : 'Активные соревнования не найдены.',
)

const distanceDialogDescription = computed(() => {
  if (!distanceDialogStage.value) {
    return ''
  }

  return props.getStageDistances(distanceDialogStage.value.id)
})

const deleteCompetitionActiveRegistrationsCount = computed(() => {
  if (!deleteCompetitionStage.value) {
    return 0
  }

  return props.getStageActiveRegistrationsCount(deleteCompetitionStage.value.id)
})

function isCompetitionArchived(row, now = Date.now()) {
  const archiveTimestamp = Date.parse(toCompetitionDateTime(row?.date, { endOfDay: true }))

  return Number.isFinite(archiveTimestamp) ? now >= archiveTimestamp : false
}

function competitionRegistrationState(registration) {
  return resolveCompetitionRegistrationState(registration).mode === 'open' ? 'open' : 'closed'
}

function openCompetitionDialog(row) {
  competitionDialogStage.value = row
  isCompetitionDialogOpen.value = true
}

function closeCompetitionDialog() {
  isCompetitionDialogOpen.value = false
  competitionDialogStage.value = null
}

function saveCompetitionDialog(payload) {
  emit('update-stage', payload)
  closeCompetitionDialog()
}

function openCreateCompetitionDialog() {
  isCreateCompetitionDialogOpen.value = true
}

function closeCreateCompetitionDialog() {
  isCreateCompetitionDialogOpen.value = false
}

function saveCreateCompetitionDialog(payload) {
  emit('create-stage', payload)
  closeCreateCompetitionDialog()
}

function openDeleteCompetitionDialog(row) {
  deleteCompetitionStage.value = row
  isDeleteCompetitionDialogOpen.value = true
}

function closeDeleteCompetitionDialog() {
  isDeleteCompetitionDialogOpen.value = false
  deleteCompetitionStage.value = null
}

function confirmDeleteCompetition(stageId) {
  emit('delete-stage', stageId)
  closeDeleteCompetitionDialog()
}

function openDistanceDialog(row) {
  distanceDialogStage.value = row
  isDistanceDialogOpen.value = true
}

function closeDistanceDialog() {
  isDistanceDialogOpen.value = false
  distanceDialogStage.value = null
}

function saveDistanceDialog(payload) {
  emit('update-stage-distances', payload)
  closeDistanceDialog()
}

function isLinkEditorOpen(row, type) {
  return linkEditor.stageId === row.id && linkEditor.type === type
}

function getLinkEditorId(row, type) {
  return `${row.id}-${type}`
}

function toggleLinkEditor(row, type) {
  if (isLinkEditorOpen(row, type)) {
    closeLinkEditor()
    return
  }

  linkEditor.stageId = row.id
  linkEditor.type = type
  linkForm.url = type === 'protocol' ? row.protocolUrl || '' : row.photoUrl || ''
}

function closeLinkEditor() {
  linkEditor.stageId = ''
  linkEditor.type = ''
  linkForm.url = ''
}

function saveLinkEditor(row, type) {
  emit('update-stage-links', {
    stageId: row.id,
    protocolUrl: type === 'protocol' ? linkForm.url : undefined,
    photoUrl: type === 'photo' ? linkForm.url : undefined,
  })

  closeLinkEditor()
}

function handleLinkEditorOutsideClick(event) {
  if (!linkEditor.stageId || !linkEditor.type) {
    return
  }

  const activeEditorId = `${linkEditor.stageId}-${linkEditor.type}`
  const activeEditorElement = linkEditorRefs.value.find(
    (element) => element?.dataset?.linkEditorId === activeEditorId,
  )

  if (!activeEditorElement || activeEditorElement.contains(event.target)) {
    return
  }

  closeLinkEditor()
}

onMounted(() => {
  document.addEventListener('pointerdown', handleLinkEditorOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleLinkEditorOutsideClick)
})
</script>

<style scoped>
.account-competitions :deep(.el-card__header) {
  padding: 18px 20px 12px;
}

.account-competitions :deep(.el-card__body) {
  padding-top: 18px;
}

.account-competitions__header {
  min-height: 0;
  justify-content: flex-end;
}

.account-competitions__summary {
  width: 100%;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.account-competitions__summary :deep(.el-tag) {
  padding: 4px 12px;
  border-width: 1px;
  border-style: solid;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
  box-shadow: 0 12px 26px rgb(15 23 42 / 0.08);
}

.account-competitions__summary :deep(.el-tag--primary) {
  background: #f5f7fb;
  border-color: #dce4ee;
  color: #526072;
}

.account-competitions__summary :deep(.el-tag--success) {
  background: #edf9f0;
  border-color: #cfe9d5;
  color: #2f8f5b;
}

.account-competitions__summary :deep(.el-tag--danger) {
  background: #fff3f1;
  border-color: #ffd8d1;
  color: #d76034;
}

.account__competitions-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr) auto;
  gap: 14px;
  align-items: end;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2f7;
}

.account__competition-view-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-self: start;
  width: 100%;
}

.account__competition-view-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex: 1 1 0;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--cyan) 22%, white);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #5d6b7d;
  background: rgb(255 255 255 / 0.9);
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.account__competition-view-button:nth-child(1) {
  color: #2f8f5b;
  border-color: #dbe9dd;
}

.account__competition-view-button:nth-child(1) .account__competition-view-button-count {
  background: #e7f7ed;
  color: #2f8f5b;
}

.account__competition-view-button:nth-child(2) {
  color: #d76034;
  border-color: color-mix(in srgb, var(--orange) 28%, white);
}

.account__competition-view-button:nth-child(2) .account__competition-view-button-count {
  background: color-mix(in srgb, var(--orange) 14%, white);
  color: #c44d27;
}

.account__competition-view-button--active {
  box-shadow: 0 10px 22px rgb(15 23 42 / 0.08);
}

.account__competition-view-button--active:nth-child(1) {
  background: #effaf5;
  border-color: #d6efc6;
}

.account__competition-view-button--active:nth-child(2) {
  background: color-mix(in srgb, var(--orange) 18%, white);
  border-color: color-mix(in srgb, var(--orange) 42%, white);
}

.account__competition-view-button--active:nth-child(1) .account__competition-view-button-count {
  background: #ddf5e8;
}

.account__competition-view-button--active:nth-child(2) .account__competition-view-button-count {
  background: color-mix(in srgb, var(--orange) 24%, white);
}

.account__competition-view-button-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--aqua) 18%, white);
  color: #176384;
  font-size: 11px;
  font-weight: 900;
}

.account__competition-add {
  min-height: 38px;
  justify-self: end;
  min-width: 140px;
  width: auto;
}

.account__native-table-row--archived {
  background: rgb(247 250 255 / 0.86);
}

.account__native-table-row--archived .account__native-table-cell {
  color: #64748b;
}

.account__native-table-row--archived .account__table-primary {
  color: #394554;
}

.account__competition-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.account__competition-name-copy {
  display: grid;
  gap: 4px;
}

.account__native-table-row--archived .account__competition-stage,
.account__native-table-row--archived .account__competition-registration-window {
  color: #6b7a8a;
}

.account__native-table-row--archived .account__competition-registration-dot--open {
  background: #7f93a5;
  box-shadow: 0 0 0 4px rgb(127 147 165 / 0.16);
}

.account__native-table-row--archived .account__competition-registration-dot--closed {
  background: #9aa7b5;
  box-shadow: 0 0 0 4px rgb(154 167 181 / 0.16);
}

.account__native-table-row--archived .el-tag {
  border-color: color-mix(in srgb, var(--cyan) 18%, white);
}

.account__native-table-wrap {
  background: transparent;
}

.account__native-table--competitions .account__native-table-cell {
  vertical-align: middle;
}

.account__native-table--competitions .account__native-table-cell--center {
  white-space: nowrap;
}

.account__native-table--competitions-archive {
  table-layout: fixed;
}

.account__native-table--competitions-archive th:nth-child(1),
.account__native-table--competitions-archive td:nth-child(1) {
  width: 42%;
}

.account__native-table--competitions-archive th:nth-child(2),
.account__native-table--competitions-archive td:nth-child(2) {
  width: 16%;
}

.account__native-table--competitions-archive th:nth-child(3),
.account__native-table--competitions-archive td:nth-child(3) {
  width: 21%;
}

.account__native-table--competitions-archive th:nth-child(4),
.account__native-table--competitions-archive td:nth-child(4) {
  width: 21%;
}

@media (max-width: 1180px) {
  .account__competitions-toolbar {
    grid-template-columns: minmax(0, 1fr);
  }

  .account__competition-view-switch {
    width: 100%;
    justify-content: space-between;
  }

  .account__competition-add {
    justify-self: stretch;
    width: 100%;
  }
}

.account__competitions-toolbar :deep(.account__select .el-select__wrapper) {
  min-height: 38px;
}

.account__competitions-toolbar :deep(.account__select .el-select__selected-item) {
  font-size: 15px;
}

.account__competition-view-button,
.account__competition-add {
  height: 38px;
}

@media (max-width: 720px) {
  .account__competition-view-switch {
    flex-direction: column;
    align-items: stretch;
  }

  .account__competition-view-button {
    justify-content: space-between;
    width: 100%;
  }
}
</style>

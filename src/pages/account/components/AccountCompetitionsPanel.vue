<template>
  <ElCard class="account__panel" shadow="never">
    <div class="account__competitions-toolbar">
      <label class="account__field account__field--filter">
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

      <button
        type="button"
        class="account__table-action account__table-action--success account__competition-add btn-reset"
        @click="openCreateCompetitionDialog"
      >
        Добавить
      </button>

      <div class="account__competitions-toolbar-meta">
        <div class="account__panel-actions">
          <ElTag type="primary" effect="light" round>{{ total }} этапов</ElTag>
          <ElTag type="success" effect="light" round>{{ openCount }} открытых</ElTag>
        </div>
      </div>
    </div>

    <div v-if="isLoading && !rows.length" class="account__loading-state">
      Загружаем соревнования...
    </div>

    <div v-else-if="rows.length" class="account__native-table-wrap">
      <table class="account__native-table account__native-table--competitions">
        <thead class="account__native-table-head">
          <tr>
            <th>Название соревнования</th>
            <th>Этап</th>
            <th>Дата</th>
            <th>Протокол</th>
            <th>Фото</th>
            <th>Регистрация</th>
          </tr>
        </thead>

        <tbody>
          <template v-for="row in rows" :key="row.id">
            <tr class="account__native-table-row">
              <td class="account__native-table-cell account__native-table-cell--primary">
                <div class="account__competition-name">
                  <span class="account__table-primary">
                    {{ formatCompetitionName(row.competitionName) }}
                  </span>
                </div>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account__competition-stage">
                  {{ formatCompetitionStageLabel(row.stage) }}
                </span>
              </td>
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
            </tr>

            <tr class="account__native-table-row account__native-table-row--actions">
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

    <ElEmpty v-else description="Этапы соревнований не найдены." />

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
import { resolveCompetitionRegistrationState } from '@/utils/competitionRegistration'

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
  competitionOptions: {
    type: Array,
    required: true,
  },
  total: {
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

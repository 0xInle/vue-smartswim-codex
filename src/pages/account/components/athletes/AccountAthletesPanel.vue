<template>
  <ElCard class="account__panel account-athletes" shadow="never">
    <template #header>
      <div class="account__panel-head">
        <div>
          <h3 class="account__panel-title">Спортсмены</h3>
        </div>

        <div class="account__panel-actions">
          <button
            type="button"
            class="account__table-action account__table-action--success btn-reset account-athletes__add-button"
            @click="openCreateDialog"
          >
            Добавить спортсмена
          </button>
        </div>
      </div>
    </template>

    <div class="account-athletes__list">
      <AccountAthleteCard
        v-for="athlete in athletes"
        :key="athlete.id"
        :athlete="athlete"
        :current-user="currentUser"
        :gender-label="genderLabel"
        @edit="handleAthleteEdit"
        @delete="deleteAthlete"
      />

      <div v-if="!athletes.length" class="account-athletes__empty">
        <p class="account-athletes__empty-copy">Спортсменов пока нет.</p>
      </div>
    </div>

    <ElDialog
      :model-value="isAthleteDialogOpen"
      width="50vw"
      append-to-body
      align-center
      destroy-on-close
      class="account__dialog account-athletes__dialog"
      :title="dialogTitle"
      :close-icon="Close"
      @closed="handleDialogClosed"
      @update:model-value="!$event && handleDialogClosed()"
    >
      <AccountAthleteForm
        :form="form"
        :errors="errors"
        :gender-options="genderOptions"
        :coach-placeholder="coachPlaceholder"
        :editing-athlete-id="editingAthleteId"
        :fetch-coach-suggestions="fetchCoachSuggestions"
        :document-upload-state="documentUploadState"
        :open-document-upload-dialog="openDocumentUploadDialog"
        :close-document-upload-dialog="closeDocumentUploadDialog"
        :handle-document-upload-submit="handleDocumentUploadSubmit"
        :handle-document-remove="handleDocumentRemove"
        @submit="handleFormSubmit"
        @update-field="updateFormField"
        @coach-select="handleCoachSelect"
      />
    </ElDialog>
  </ElCard>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { ElCard, ElDialog } from 'element-plus'
import { computed, ref, toRef } from 'vue'
import AccountAthleteCard from '@/pages/account/components/athletes/AccountAthleteCard.vue'
import AccountAthleteForm from '@/pages/account/components/athletes/AccountAthleteForm.vue'
import { useAccountAthletes } from '@/pages/account/composables/useAccountAthletes'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
})

const {
  athletes,
  editingAthleteId,
  form,
  errors,
  genderOptions,
  coachPlaceholder,
  documentUploadState,
  startEdit,
  cancelEdit,
  deleteAthlete,
  resetForm,
  updateFormField,
  handleSubmit,
  genderLabel,
  fetchCoachSuggestions,
  handleCoachSelect,
  openDocumentUploadDialog,
  closeDocumentUploadDialog,
  handleDocumentUploadSubmit,
  handleDocumentRemove,
} = useAccountAthletes({
  currentUser: toRef(props, 'currentUser'),
})

const isAthleteDialogOpen = ref(false)

const dialogTitle = computed(() =>
  editingAthleteId.value ? 'Редактирование спортсмена' : 'Добавление спортсмена',
)

function openCreateDialog() {
  resetForm()
  isAthleteDialogOpen.value = true
}

function handleAthleteEdit(athlete) {
  startEdit(athlete)
  isAthleteDialogOpen.value = true
}

function handleDialogClosed() {
  cancelEdit()
  isAthleteDialogOpen.value = false
}

async function handleFormSubmit() {
  const isSaved = await handleSubmit()

  if (isSaved) {
    isAthleteDialogOpen.value = false
  }
}
</script>

<style scoped>
.account-athletes__list {
  display: grid;
  gap: 12px;
}

.account-athletes :deep(.el-card__header) {
  padding: 20px 20px 12px;
}

.account-athletes__add-button {
  min-height: 38px;
  padding: 8px 14px;
  white-space: nowrap;
}

.account-athletes__empty {
  display: grid;
  gap: 12px;
  padding: 18px 16px;
  border: 1px dashed color-mix(in srgb, var(--cyan) 22%, white);
  border-radius: 10px;
  background: rgb(246 251 255 / 0.8);
}

.account-athletes__empty-copy {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  color: #526072;
}

.account-athletes__dialog {
  max-width: 920px;
}

@media (max-width: 640px) {
  .account-athletes__dialog {
    max-width: none;
  }

  .account-athletes__dialog :deep(.el-dialog) {
    width: 92vw !important;
  }
}

@media (max-width: 640px) {
  .account-athletes__add-button {
    width: 100%;
  }
}
</style>

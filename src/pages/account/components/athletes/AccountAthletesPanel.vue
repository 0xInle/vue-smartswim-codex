<template>
  <ElCard class="account__panel account-athletes" shadow="never">
    <template #header>
      <div class="account__panel-head">
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

    <div v-if="showSkeleton" class="account-athletes__skeleton" aria-busy="true">
      <article
        v-for="index in 4"
        :key="`athlete-skeleton-${index}`"
        class="account-athletes__skeleton-card"
      >
        <div class="account-athletes__skeleton-head">
          <div class="account-athletes__skeleton-copy">
            <span class="account-athletes__skeleton-line account-athletes__skeleton-line--name"></span>
            <span class="account-athletes__skeleton-line account-athletes__skeleton-line--meta"></span>
          </div>
          <div class="account-athletes__skeleton-actions">
            <span class="account-athletes__skeleton-pill"></span>
            <span class="account-athletes__skeleton-pill"></span>
          </div>
        </div>

        <div class="account-athletes__skeleton-grid">
          <div v-for="fieldIndex in 3" :key="`athlete-skeleton-field-${index}-${fieldIndex}`" class="account-athletes__skeleton-field">
            <span class="account-athletes__skeleton-label"></span>
            <span class="account-athletes__skeleton-value"></span>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="account-athletes__list">
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
        :is-submitting="isSubmitting"
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
  isSubmitting,
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
  isInitialAthletesLoading,
} = useAccountAthletes({
  currentUser: toRef(props, 'currentUser'),
})

const isAthleteDialogOpen = ref(false)

const dialogTitle = computed(() =>
  editingAthleteId.value ? 'Редактирование спортсмена' : 'Добавление спортсмена',
)

const showSkeleton = computed(() => isInitialAthletesLoading.value)

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
.account-athletes__skeleton {
  display: grid;
  gap: 8px;
}

.account-athletes__skeleton-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: linear-gradient(180deg, rgb(246 251 255 / 0.94) 0%, rgb(255 255 255 / 0.86) 100%);
  box-shadow: 0 10px 28px rgb(15 23 42 / 0.04);
}

.account-athletes__skeleton-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account-athletes__skeleton-copy {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.account-athletes__skeleton-actions {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.account-athletes__skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.account-athletes__skeleton-field {
  display: grid;
  gap: 6px;
}

.account-athletes__skeleton-line,
.account-athletes__skeleton-pill {
  position: relative;
  overflow: hidden;
  display: block;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cyan) 12%, white);
}

.account-athletes__skeleton-line::after,
.account-athletes__skeleton-pill::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.74), transparent);
  animation: account-athletes-skeleton-shimmer 1.2s ease-in-out infinite;
}

.account-athletes__skeleton-line--name {
  width: min(220px, 70%);
  height: 18px;
}

.account-athletes__skeleton-line--meta {
  width: min(140px, 48%);
  height: 12px;
}

.account-athletes__skeleton-label {
  width: 64px;
  height: 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cyan) 12%, white);
}

.account-athletes__skeleton-value {
  width: 100%;
  height: 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cyan) 10%, white);
}

.account-athletes__skeleton-pill {
  width: 88px;
  height: 22px;
}

.account-athletes__list {
  display: grid;
  gap: 8px;
}

.account-athletes :deep(.el-card__header) {
  padding: 16px 20px 10px;
}

.account-athletes :deep(.el-card__body) {
  padding-top: 10px;
}

.account-athletes .account__panel-head {
  justify-content: flex-end;
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

  .account-athletes__skeleton-head {
    flex-direction: column;
  }

  .account-athletes__skeleton-grid {
    grid-template-columns: 1fr;
  }
}

@keyframes account-athletes-skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>

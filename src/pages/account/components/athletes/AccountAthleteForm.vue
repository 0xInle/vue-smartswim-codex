<template>
  <form class="account-athletes__form" @submit.prevent="$emit('submit')">
    <div class="account__field-grid">
      <label class="account__field account-athletes__field--wide">
        <span class="account__field-label">ФИО спортсмена</span>
        <input
          :value="form.fullName"
          class="account__input"
          type="text"
          name="athlete-full-name"
          placeholder="Введите ФИО спортсмена"
          :aria-invalid="Boolean(errors.fullName)"
          @input="updateField('fullName', $event.target.value, { trim: true })"
        />
        <span v-if="errors.fullName" class="account__field-error">{{ errors.fullName }}</span>
      </label>

      <label class="account__field">
        <span class="account__field-label">Дата рождения</span>
        <input
          :value="form.birthDate"
          class="account__input"
          type="text"
          name="athlete-birth-date"
          inputmode="numeric"
          placeholder="дд.мм.гггг"
          :aria-invalid="Boolean(errors.birthDate)"
          @input="updateField('birthDate', $event.target.value, { trim: true })"
        />
        <span v-if="errors.birthDate" class="account__field-error">{{ errors.birthDate }}</span>
      </label>
    </div>

    <div class="account__field-grid">
      <div class="account__field">
        <span class="account__field-label">Пол</span>
        <div class="account-athletes__radio-group" role="radiogroup" aria-label="Пол спортсмена">
          <label
            v-for="option in genderOptions"
            :key="option.value"
            class="account-athletes__radio"
            :class="{ 'account-athletes__radio--selected': form.gender === option.value }"
          >
            <input
              :checked="form.gender === option.value"
              class="account-athletes__radio-input"
              type="radio"
              name="athlete-gender"
              :value="option.value"
              @change="updateField('gender', option.value)"
            />
            <span class="account-athletes__radio-label">{{ option.label }}</span>
          </label>
        </div>
        <span v-if="errors.gender" class="account__field-error">{{ errors.gender }}</span>
      </div>

      <label class="account__field">
        <span class="account__field-label">Клуб</span>
        <input
          :value="form.club"
          class="account__input"
          type="text"
          name="athlete-club"
          placeholder="Введите клуб"
          :aria-invalid="Boolean(errors.club)"
          @input="updateField('club', $event.target.value, { trim: true })"
        />
        <span v-if="errors.club" class="account__field-error">{{ errors.club }}</span>
      </label>
    </div>

    <div class="account__field-grid">
      <label class="account__field">
        <span class="account__field-label">Разряд</span>
        <input
          :value="form.rank"
          class="account__input"
          type="text"
          name="athlete-rank"
          placeholder="Введите разряд"
          @input="updateField('rank', $event.target.value, { trim: true })"
        />
      </label>

      <label class="account__field account-athletes__field--wide">
        <span class="account__field-label">Тренер</span>
        <ElAutocomplete
          :model-value="form.coach"
          class="account-athletes__autocomplete"
          :fetch-suggestions="fetchCoachSuggestions"
          clearable
          popper-class="account-athletes__coach-popper"
          :popper-style="{ marginTop: '-1px' }"
          value-key="value"
          trigger-on-focus
          :placeholder="coachPlaceholder"
          aria-label="Тренер"
          @update:model-value="updateField('coach', $event)"
          @select="$emit('coach-select', $event)"
        />
        <span v-if="errors.coach" class="account__field-error">{{ errors.coach }}</span>
      </label>
    </div>

    <div class="account-athletes__documents">
      <AccountDocumentChecklist
        :documents="form.documents"
        mode="editable"
        :show-header="false"
        embedded
        @upload="openDocumentUploadDialog"
        @remove="handleDocumentRemove"
      />
    </div>

    <div class="account-athletes__actions">
      <button
        type="submit"
        class="account__submit btn-reset account-athletes__action-button account-athletes__submit-button"
      >
        {{ editingAthleteId ? 'Сохранить изменения' : 'Добавить спортсмена' }}
      </button>
    </div>

    <AccountDocumentUploadDialog
      :model-value="documentUploadState.isOpen"
      :document-type="documentUploadState.documentType"
      :initial-expires-at="documentUploadState.expiresAt"
      :is-submitting="documentUploadState.isSubmitting"
      @close="closeDocumentUploadDialog"
      @submit="handleDocumentUploadSubmit"
    />
  </form>
</template>

<script setup>
import { ElAutocomplete } from 'element-plus'
import 'element-plus/es/components/autocomplete/style/css'
import AccountDocumentChecklist from '@/pages/account/components/documents/AccountDocumentChecklist.vue'
import AccountDocumentUploadDialog from '@/pages/account/components/documents/AccountDocumentUploadDialog.vue'

defineProps({
  form: {
    type: Object,
    required: true,
  },
  errors: {
    type: Object,
    required: true,
  },
  genderOptions: {
    type: Array,
    required: true,
  },
  coachPlaceholder: {
    type: String,
    required: true,
  },
  editingAthleteId: {
    type: String,
    required: true,
  },
  fetchCoachSuggestions: {
    type: Function,
    required: true,
  },
  documentUploadState: {
    type: Object,
    required: true,
  },
  openDocumentUploadDialog: {
    type: Function,
    required: true,
  },
  closeDocumentUploadDialog: {
    type: Function,
    required: true,
  },
  handleDocumentUploadSubmit: {
    type: Function,
    required: true,
  },
  handleDocumentRemove: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['submit', 'update-field', 'coach-select'])

function updateField(field, value, { trim = false } = {}) {
  emit('update-field', field, trim ? value.trim() : value)
}
</script>

<style scoped>
.account-athletes__form {
  display: grid;
  gap: 16px;
  margin-bottom: 0;
}

.account-athletes__radio-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.account-athletes__radio {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid color-mix(in srgb, var(--cyan) 24%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.9);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.account-athletes__radio--selected {
  border-color: color-mix(in srgb, var(--cyan) 54%, white);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--cyan) 12%, transparent);
}

.account-athletes__radio-input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--cyan);
}

.account-athletes__radio-label {
  font-size: 15px;
  font-weight: 800;
  color: var(--black);
}

.account-athletes__autocomplete {
  width: 100%;
}

.account-athletes__documents {
  margin-top: 2px;
}

.account-athletes__autocomplete :global(.el-input),
.account-athletes__autocomplete :global(.el-input__inner) {
  font-family: Nunito, sans-serif;
}

.account-athletes__autocomplete :global(.el-input__inner) {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--black);
}

.account-athletes__autocomplete :global(.el-input__inner::placeholder) {
  font-family: Nunito, sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: color-mix(in srgb, var(--black) 42%, white);
}

.account-athletes__autocomplete :global(.el-input__wrapper) {
  min-height: 48px;
  border-radius: 10px;
  background: rgb(255 255 255 / 0.9);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--cyan) 24%, white);
}

:global(.account-athletes__coach-popper.el-popper) {
  margin-top: -1px !important;
}

:global(.account-athletes__coach-popper.el-popper .el-popper__arrow) {
  display: none;
}

:global(.account-athletes__coach-popper .el-autocomplete-suggestion) {
  font-family: Nunito, sans-serif;
}

:global(.account-athletes__coach-popper .el-autocomplete-suggestion__wrap) {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

:global(.account-athletes__coach-popper .el-autocomplete-suggestion li) {
  font-family: Nunito, sans-serif;
  font-size: 14px;
  font-weight: 700;
}

.account-athletes__field--wide {
  grid-column: 1 / -1;
}

.account-athletes__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.account-athletes__action-button {
  flex: 0 0 auto;
  min-width: 0;
  min-height: 38px;
  padding: 8px 14px;
}

.account-athletes__submit-button {
  align-self: flex-start;
  width: auto;
  font-family: inherit;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .account-athletes__actions {
    justify-content: flex-start;
  }

  .account-athletes__action-button {
    width: 100%;
    align-self: stretch;
  }

  .account-athletes__submit-button {
    width: 100%;
  }

  .account-athletes__radio-group {
    grid-template-columns: 1fr;
  }
}
</style>

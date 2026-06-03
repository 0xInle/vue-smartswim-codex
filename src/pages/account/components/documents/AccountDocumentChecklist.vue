<template>
  <div v-if="compact" class="account-documents account-documents--compact">
    <div class="account-documents__compact-head">
      <span class="account-documents__compact-label">Документы</span>
    </div>

    <p v-if="!loadedDocuments.length" class="account-documents__compact-empty">
      Документы не загружены
    </p>

    <ul v-else class="account-documents__compact-list" role="list" aria-label="Документы">
      <li
        v-for="document in loadedDocuments"
        :key="document.type"
        class="account-documents__compact-item"
      >
        <span class="account-documents__compact-dot" aria-hidden="true"></span>
        <span class="account-documents__compact-label">{{ document.label }}</span>
      </li>
    </ul>
  </div>

  <div v-else class="account-documents" :class="{ 'account-documents--embedded': embedded }">
    <div v-if="showHeader" class="account-documents__head">
      <div>
        <p v-if="eyebrow" class="account__panel-eyebrow">{{ eyebrow }}</p>
        <h4 class="account-documents__title">{{ title }}</h4>
      </div>

      <div class="account__panel-actions">
        <ElTag :type="tagType" effect="light" round>
          {{ statusLabel }}
        </ElTag>
      </div>
    </div>

    <div class="account-documents__list" role="list" :aria-label="title">
      <article
        v-for="document in documents"
        :key="document.type"
        class="account-documents__item"
        :class="[
          `account-documents__item--${statusState(document)}`,
          { 'account-documents__item--readonly': !showActionButton },
        ]"
        role="listitem"
      >
        <button
          v-if="showActionButton && isEditable"
          type="button"
          class="account-documents__icon-button btn-reset"
          :class="{ 'account-documents__icon-button--locked': isDocumentLoaded(document) }"
          :aria-label="isDocumentLoaded(document) ? 'Документ загружен' : 'Загрузить документ'"
          :aria-disabled="isDocumentLoaded(document)"
          :title="isDocumentLoaded(document) ? 'Документ загружен' : 'Загрузить документ'"
          @click="!isDocumentLoaded(document) && $emit('upload', document.type)"
        >
          <ElIcon class="account-documents__action-icon">
            <component :is="isDocumentLoaded(document) ? DocumentChecked : Upload" />
          </ElIcon>
        </button>

        <div
          v-else-if="showActionButton"
          class="account-documents__icon-box"
          aria-hidden="true"
        >
          <ElIcon class="account-documents__action-icon">
            <component :is="isDocumentLoaded(document) ? DocumentChecked : Upload" />
          </ElIcon>
        </div>

        <div class="account-documents__item-copy">
          <p class="account-documents__label">{{ document.label }}</p>
          <p class="account-documents__hint">{{ document.hint }}</p>
          <div class="account-documents__meta">
            <span v-if="document.expiresAt"
              >Действует до: {{ formatAccountDocumentDate(document.expiresAt) }}</span
            >
            <span v-if="document.verifiedAt"
              >Проверен: {{ formatCompactDateTime(document.verifiedAt) }}</span
            >
          </div>
          <p v-if="reviewNote(document)" class="account-documents__review-text">
            <span class="account-documents__review-label">КОМЕНТАРИЙ:</span>
            <span class="account-documents__review-copy">{{ reviewNote(document) }}</span>
          </p>
        </div>

        <span class="account-documents__status-text" :class="statusClass(document)">
          {{ statusText(document) }}
        </span>

        <div v-if="isEditable" class="account-documents__item-actions">
          <button
            v-if="isEditable && document.status !== 'missing'"
            type="button"
            class="account-documents__edit-button btn-reset"
            :aria-label="`Редактировать документ: ${document.label}`"
            :title="`Редактировать документ: ${document.label}`"
            @click="$emit('upload', document.type)"
          >
            <ElIcon class="account-documents__edit-icon">
              <EditPen />
            </ElIcon>
          </button>

          <button
            v-if="isEditable && document.status !== 'missing'"
            type="button"
            class="account-documents__remove-button btn-reset"
            :aria-label="`Удалить документ: ${document.label}`"
            :title="`Удалить документ: ${document.label}`"
            @click="$emit('remove', document.type)"
          >
            <ElIcon class="account-documents__remove-icon">
              <Delete />
            </ElIcon>
          </button>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { Delete, DocumentChecked, EditPen, Upload } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'
import { computed } from 'vue'
import {
  formatAccountDocumentDate,
  formatCompactDateTime,
  getAccountDocumentDisplayStatus,
} from '@/pages/account/utils/accountFormatters'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  eyebrow: {
    type: String,
    default: '',
  },
  documents: {
    type: Array,
    required: true,
  },
  statusLabel: {
    type: String,
    default: '',
  },
  tagType: {
    type: String,
    default: 'info',
  },
  mode: {
    type: String,
    default: 'editable',
    validator: (value) => ['editable', 'readonly'].includes(value),
  },
  showActionButton: {
    type: Boolean,
    default: true,
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['upload', 'remove'])

const isEditable = computed(() => props.mode === 'editable')
const loadedDocuments = computed(() =>
  props.documents.filter((document) => document.status !== 'missing'),
)

function statusText(document) {
  return getAccountDocumentDisplayStatus(document).label
}

function statusState(document) {
  return getAccountDocumentDisplayStatus(document).status
}

function statusClass(document) {
  return `account-documents__status-text--${statusState(document)}`
}

function isDocumentLoaded(document) {
  return statusState(document) !== 'missing'
}

function reviewNote(document) {
  if (!document?.rejectionReason) {
    return ''
  }

  if (document.status === 'verified') {
    return ''
  }

  return document.rejectionReason
}
</script>

<style scoped>
.account-documents {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: linear-gradient(180deg, rgb(246 251 255 / 0.96) 0%, rgb(255 255 255 / 0.88) 100%);
}

.account-documents--compact {
  gap: 10px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
}

.account-documents--embedded {
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
}

.account-documents__compact-head {
  display: flex;
  align-items: center;
}

.account-documents__compact-label {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.account-documents__compact-empty {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.3;
  color: var(--black);
}

.account-documents__compact-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.account-documents__compact-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.account-documents__compact-dot {
  flex: 0 0 auto;
  width: 5px;
  height: 5px;
  margin-top: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cyan) 78%, white);
}

.account-documents__compact-label {
  min-width: 0;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.3;
  color: var(--black);
}

.account-documents__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account-documents__title {
  margin: 4px 0 0;
  font-family: Oswald, sans-serif;
  font-size: 20px;
  line-height: 1;
  text-transform: uppercase;
  color: var(--black);
}

.account-documents__list {
  display: grid;
  gap: 10px;
}

.account-documents__item {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--cyan) 14%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.88);
}

.account-documents__item--readonly {
  grid-template-columns: minmax(0, 1fr) auto;
}

.account-documents__item--verified {
  border-color: color-mix(in srgb, var(--cyan) 32%, white);
  background: linear-gradient(180deg, rgb(241 255 252 / 0.96) 0%, rgb(255 255 255 / 0.92) 100%);
}

.account-documents--embedded .account-documents__item,
.account-documents--embedded .account-documents__item--verified {
  background: transparent;
}

.account-documents__item--rejected {
  border-color: color-mix(in srgb, var(--orange) 32%, white);
}

.account-documents__item--needs_reupload,
.account-documents__item--expired {
  border-color: color-mix(in srgb, var(--orange) 32%, white);
}

.account-documents__item-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
  justify-self: start;
  text-align: left;
}

.account-documents__item-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: max-content;
  min-width: max-content;
  justify-self: end;
}

.account-documents__item--readonly .account-documents__item-actions {
  display: none;
}

.account-documents__label {
  margin: 0;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.3;
  color: var(--black);
}

.account-documents__hint,
.account-documents__meta {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  color: #64748b;
}

.account-documents__meta {
  display: grid;
  gap: 2px;
}

.account-documents__review-text {
  display: grid;
  gap: 2px;
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.45;
}

.account-documents__review-label {
  color: #d76034;
}

.account-documents__review-copy {
  color: var(--black);
}

.account-documents__icon-button,
.account-documents__icon-box,
.account-documents__edit-button,
.account-documents__remove-button {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--cyan) 18%, white);
  border-radius: 12px;
  background: color-mix(in srgb, var(--aqua) 10%, white);
  color: var(--black);
}

.account-documents__icon-button {
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.account-documents__icon-button:disabled,
.account-documents__icon-button--locked {
  cursor: default;
  opacity: 0.72;
  box-shadow: none;
  pointer-events: none;
}

.account-documents__icon-button:hover {
  border-color: color-mix(in srgb, var(--cyan) 40%, white);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--cyan) 10%, transparent);
}

.account-documents--embedded .account-documents__icon-button,
.account-documents--embedded .account-documents__icon-box,
.account-documents--embedded .account-documents__edit-button {
  background: transparent;
}

.account-documents__action-icon {
  width: 18px;
  height: 18px;
}

.account-documents__edit-icon {
  width: 16px;
  height: 16px;
}

.account-documents__edit-button {
  width: 34px;
  height: 34px;
  border-color: color-mix(in srgb, var(--cyan) 16%, white);
  background: color-mix(in srgb, var(--aqua) 8%, white);
  color: #176384;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.account-documents__edit-button:hover {
  border-color: color-mix(in srgb, var(--cyan) 40%, white);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--cyan) 10%, transparent);
}

.account-documents__remove-button {
  width: 34px;
  height: 34px;
  border: 1px solid color-mix(in srgb, var(--orange) 18%, white);
  border-radius: 10px;
  background: color-mix(in srgb, var(--orange) 9%, white);
  color: var(--orange);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.account-documents__remove-button:hover {
  border-color: color-mix(in srgb, var(--orange) 44%, white);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--orange) 10%, transparent);
}

.account-documents__remove-icon {
  width: 16px;
  height: 16px;
}

.account-documents__status-text {
  flex: 0 1 auto;
  min-width: 0;
  text-align: right;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.35;
}

.account-documents__status-text--verified,
.account-documents__status-text--admitted {
  color: #2f8f5b;
}

.account-documents__status-text--uploaded,
.account-documents__status-text--pending {
  color: #176384;
}

.account-documents__status-text--rejected,
.account-documents__status-text--needs_reupload,
.account-documents__status-text--expired,
.account-documents__status-text--attention {
  color: #d76034;
}

.account-documents__status-text--missing {
  color: #64748b;
}

@media (max-width: 640px) {
  .account-documents__item {
    grid-template-columns: 40px minmax(0, 1fr) auto auto;
    align-items: center;
  }

  .account-documents__status-text {
    text-align: left;
    white-space: normal;
  }
}
</style>

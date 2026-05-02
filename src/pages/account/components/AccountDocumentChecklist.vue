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

  <div
    v-else
    class="account-documents"
    :class="{ 'account-documents--embedded': embedded }"
  >
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
        :class="`account-documents__item--${document.status}`"
        role="listitem"
      >
        <button
          v-if="isEditable"
          type="button"
          class="account-documents__icon-button btn-reset"
          :aria-label="document.fileName ? 'Заменить документ' : 'Загрузить документ'"
          :title="document.fileName ? 'Заменить документ' : 'Загрузить документ'"
          @click="$emit('upload', document.type)"
        >
          <ElIcon class="account-documents__action-icon">
            <Upload />
          </ElIcon>
        </button>

        <div v-else class="account-documents__icon-box" aria-hidden="true">
          <ElIcon class="account-documents__action-icon">
            <Upload />
          </ElIcon>
        </div>

        <div class="account-documents__item-copy">
          <p class="account-documents__label">{{ document.label }}</p>
        </div>

        <div class="account-documents__item-actions">
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

          <ElTag
            class="account-documents__status-tag"
            :type="statusTag(document.status)"
            effect="light"
            round
          >
            {{ statusText(document.status) }}
          </ElTag>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { Delete, Upload } from '@element-plus/icons-vue'
import { ElIcon, ElTag } from 'element-plus'
import { computed } from 'vue'

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

const statusToTag = {
  missing: 'info',
  uploaded: 'warning',
  verified: 'success',
  rejected: 'danger',
}

const statusToText = {
  missing: 'Не загружен',
  uploaded: 'На проверке',
  verified: 'Проверен',
  rejected: 'Отклонён',
}

function statusTag(status) {
  return statusToTag[status] || 'info'
}

function statusText(status) {
  return statusToText[status] || 'Неизвестно'
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
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--cyan) 14%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.88);
}

.account-documents__item--verified {
  border-color: color-mix(in srgb, var(--cyan) 32%, white);
  background: linear-gradient(180deg, rgb(241 255 252 / 0.96) 0%, rgb(255 255 255 / 0.92) 100%);
}

.account-documents__item--rejected {
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
  justify-self: end;
}

.account-documents__label {
  margin: 0;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.3;
  color: var(--black);
}

.account-documents__icon-button,
.account-documents__icon-box {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid color-mix(in srgb, var(--cyan) 18%, white);
  border-radius: 12px;
  background: color-mix(in srgb, var(--aqua) 10%, white);
  color: var(--black);
}

.account-documents__icon-button {
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.account-documents__icon-button:hover {
  border-color: color-mix(in srgb, var(--cyan) 40%, white);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--cyan) 10%, transparent);
}

.account-documents__action-icon {
  width: 18px;
  height: 18px;
}

.account-documents__remove-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

@media (max-width: 640px) {
  .account-documents__item {
    grid-template-columns: 40px minmax(0, 1fr) auto;
    align-items: center;
  }
}
</style>

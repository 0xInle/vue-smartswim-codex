<template>
  <article class="account-athlete-card">
    <div class="account-athlete-card__head">
      <div class="account-athlete-card__copy">
        <div class="account-athlete-card__name-row">
          <h4 class="account-athlete-card__name">{{ athlete.fullName }}</h4>
          <span
            class="account-athlete-card__status-tag"
            :class="`account-athlete-card__status-tag--${documentsStatus.status}`"
            :title="documentsStatus.description"
          >
            {{ documentsStatus.label }}
          </span>
        </div>
        <p class="account-athlete-card__meta">
          {{ athlete.birthDate }} · {{ genderLabel(athlete.gender) }}
        </p>
      </div>

      <div class="account-athlete-card__actions">
        <button
          type="button"
          class="account__table-action account__table-action--edit btn-reset"
          @click="$emit('edit', athlete)"
        >
          Изменить
        </button>
        <button
          type="button"
          class="account__table-action account__table-action--delete btn-reset"
          @click="$emit('delete', athlete.id)"
        >
          Удалить
        </button>
      </div>
    </div>

    <div class="account-athlete-card__grid">
      <div class="account-athlete-card__field">
        <span class="account-athlete-card__label">Клуб</span>
        <span class="account-athlete-card__value">{{ athlete.club || 'Не указан' }}</span>
      </div>
      <div class="account-athlete-card__field">
        <span class="account-athlete-card__label">Разряд</span>
        <span class="account-athlete-card__value">{{ athlete.rank || 'Не указан' }}</span>
      </div>
      <div class="account-athlete-card__field">
        <span class="account-athlete-card__label">Тренер</span>
        <span class="account-athlete-card__value">{{ athlete.coach || 'Не указан' }}</span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { normalizeAccountDocumentsState } from '@/pages/account/utils/accountDocumentTypes'
import { resolveAccountAdmissionStatus } from '@/pages/account/utils/accountAdmissions'

const props = defineProps({
  athlete: {
    type: Object,
    required: true,
  },
  currentUser: {
    type: Object,
    default: null,
  },
  genderLabel: {
    type: Function,
    required: true,
  },
})

defineEmits(['edit', 'delete'])

const documents = computed(() => normalizeAccountDocumentsState(props.athlete?.documents))
const documentsStatus = computed(() =>
  resolveAccountAdmissionStatus({
    ownerUserKey: props.currentUser?.id || props.currentUser?.email || 'anonymous',
    scope: 'athlete',
    scopeId: props.athlete.id,
    documents: documents.value,
  }),
)
</script>

<style scoped>
.account-athlete-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 5px;
  background: rgb(255 255 255 / 0.9);
  box-shadow: 0 10px 28px rgb(15 23 42 / 0.04);
}

.account-athlete-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account-athlete-card__copy {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.account-athlete-card__name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}

.account-athlete-card__name {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.2;
  color: var(--black);
}

.account-athlete-card__meta {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  color: #64748b;
}

.account-athlete-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.account-athlete-card__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.account-athlete-card__field--wide {
  grid-column: 1 / -1;
}

.account-athlete-card__field {
  display: grid;
  gap: 4px;
}

.account-athlete-card__status-tag {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 4px 10px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 5px;
  background: rgb(255 255 255 / 0.86);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #176384;
}

.account-athlete-card__status-tag--attention,
.account-athlete-card__status-tag--missing {
  border-color: color-mix(in srgb, var(--orange) 20%, white);
  background: color-mix(in srgb, var(--orange) 8%, white);
  color: #b95632;
}

.account-athlete-card__status-tag--pending,
.account-athlete-card__status-tag--ready {
  border-color: color-mix(in srgb, var(--cyan) 20%, white);
  background: color-mix(in srgb, var(--cyan) 7%, white);
  color: #176384;
}

.account-athlete-card__status-tag--admitted {
  border-color: color-mix(in srgb, var(--aqua) 24%, white);
  background: color-mix(in srgb, var(--aqua) 10%, white);
  color: #2f8f5b;
}

.account-athlete-card__label {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #64748b;
}

.account-athlete-card__value {
  font-size: 13px;
  font-weight: 800;
  color: var(--black);
}

@media (max-width: 1024px) {
  .account-athlete-card__grid {
    grid-template-columns: 1fr;
  }

  .account-athlete-card__field--wide {
    grid-column: auto;
  }
}

@media (max-width: 640px) {
  .account-athlete-card__head {
    flex-direction: column;
  }

  .account-athlete-card__actions {
    justify-content: flex-start;
  }
}
</style>

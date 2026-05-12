<template>
  <article class="account-athlete-card">
    <div class="account-athlete-card__head">
      <div class="account-athlete-card__copy">
        <h4 class="account-athlete-card__name">{{ athlete.fullName }}</h4>
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
      <div class="account-athlete-card__field account-athlete-card__field--wide">
        <span class="account-athlete-card__label">Документы</span>
        <div class="account-athlete-card__documents">
          <span class="account-athlete-card__status" :class="`account-athlete-card__status--${documentsStatus.status}`">
            {{ documentsStatus.label }}
          </span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { normalizeAccountDocumentsState } from '@/pages/account/utils/accountDocumentTypes'
import { getAccountDocumentsAdmissionStatus } from '@/pages/account/utils/accountFormatters'

const props = defineProps({
  athlete: {
    type: Object,
    required: true,
  },
  genderLabel: {
    type: Function,
    required: true,
  },
})

defineEmits(['edit', 'delete'])

const documents = computed(() => normalizeAccountDocumentsState(props.athlete?.documents))
const documentsStatus = computed(() => getAccountDocumentsAdmissionStatus(documents.value))
</script>

<style scoped>
.account-athlete-card {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: var(--white);
}

.account-athlete-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account-athlete-card__copy {
  display: grid;
  gap: 4px;
}

.account-athlete-card__name {
  margin: 0;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.1;
  color: var(--black);
}

.account-athlete-card__meta {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
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
  margin-bottom: 2px;
}

.account-athlete-card__field--wide {
  grid-column: 1 / -1;
}

.account-athlete-card__field {
  display: grid;
  gap: 4px;
}

.account-athlete-card__documents {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.account-athlete-card__status {
  font-size: 12px;
  font-weight: 900;
}

.account-athlete-card__status--admitted {
  color: #2f8f5b;
}

.account-athlete-card__status--pending {
  color: #176384;
}

.account-athlete-card__status--missing {
  color: #64748b;
}

.account-athlete-card__status--attention {
  color: #d76034;
}

.account-athlete-card__label {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.account-athlete-card__value {
  font-size: 14px;
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

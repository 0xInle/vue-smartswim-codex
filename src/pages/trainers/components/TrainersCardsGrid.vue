<template>
  <section class="trainers__grid-section">
    <div v-if="trainers.length" class="trainers__grid">
      <TrainerCard
        v-for="trainer in trainers"
        :key="trainer.id"
        :trainer="trainer"
        :is-open="activeTrainerId === trainer.id"
        @toggle-details="emit('toggle-details', $event)"
        @book="emit('book', $event)"
      />
    </div>

    <div v-else class="trainers__empty">
      <p class="trainers__empty-title">Тренеры не найдены</p>
      <p class="trainers__empty-text">Сбросьте фильтры или измените условия поиска.</p>
    </div>
  </section>
</template>

<script setup>
import TrainerCard from '@/pages/trainers/components/TrainerCard.vue'

defineProps({
  trainers: {
    type: Array,
    required: true,
  },
  activeTrainerId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['toggle-details', 'book'])
</script>

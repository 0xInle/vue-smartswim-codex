<template>
  <article class="trainers__card" :class="{ 'trainers__card--open': isOpen }">
    <div class="trainers__photo-placeholder" aria-hidden="true">
      <span class="trainers__photo-text">Нет фото</span>
    </div>

    <div class="trainers__card-body">
      <div class="trainers__card-top">
        <div class="trainers__card-heading">
          <h2 class="trainers__card-title">
            <span class="trainers__card-title-line">{{ trainerSurname }}</span>
            <span class="trainers__card-title-line">{{ trainerGivenName }}</span>
          </h2>
        </div>

        <button
          type="button"
          class="trainers__card-bookmark btn-reset"
          :aria-expanded="isOpen"
          :aria-controls="`trainer-details-${trainer.id}`"
          aria-label="Открыть подробную информацию о тренере"
          @click.stop="emit('toggle-details', trainer.id)"
        >
          <span class="trainers__card-bookmark-label">
            {{ isOpen ? 'Скрыть' : 'Подробнее' }}
          </span>
        </button>
      </div>

      <div class="trainers__card-summary">
        <ul class="trainers__meta list-reset">
          <li class="trainers__meta-item">
            <span class="trainers__meta-label">Опыт работы</span>
            <span class="trainers__meta-value">{{ trainer.experience }}</span>
          </li>
          <li class="trainers__meta-item">
            <span class="trainers__meta-label">Основной профиль</span>
            <span class="trainers__meta-value">{{ trainer.primaryProfile }}</span>
          </li>
          <li class="trainers__meta-item">
            <span class="trainers__meta-label">Свободно мест</span>
            <span class="trainers__meta-value">{{ trainer.availableSlots }}</span>
          </li>
        </ul>
      </div>

      <button
        type="button"
        class="trainers__card-action btn-reset"
        @click.stop="emit('book', trainer)"
      >
        Записаться к тренеру
      </button>
    </div>

    <div :id="`trainer-details-${trainer.id}`" class="trainers__card-details" @click.stop>
      <div class="trainers__details-grid">
        <div class="trainers__detail-item">
          <span class="trainers__detail-label">Образование</span>
          <span class="trainers__card-detail-text trainers__card-detail-text--stack">
            <span
              v-for="educationLine in trainer.education"
              :key="educationLine"
              class="trainers__detail-line"
            >
              {{ educationLine }}
            </span>
          </span>
        </div>

        <div class="trainers__detail-item">
          <span class="trainers__detail-label">Спортивные достижения</span>
          <span class="trainers__card-detail-text">{{ trainer.achievements }}</span>
        </div>

        <div class="trainers__detail-item">
          <span class="trainers__detail-label">С кем работает</span>
          <span class="trainers__card-detail-text">{{ trainer.audience }}</span>
        </div>

        <div class="trainers__detail-item">
          <span class="trainers__detail-label">Минимальный возраст</span>
          <span class="trainers__card-detail-text">{{ trainer.minimumAge }}</span>
        </div>

        <div class="trainers__detail-item">
          <span class="trainers__detail-label">Уровень подготовки</span>
          <span class="trainers__card-detail-text">{{ trainer.level }}</span>
        </div>

        <div class="trainers__detail-item">
          <span class="trainers__detail-label">Метро</span>
          <span class="trainers__card-detail-text">{{ trainer.metro }}</span>
        </div>

        <div class="trainers__detail-item">
          <span class="trainers__detail-label">Email тренера</span>
          <a :href="`mailto:${trainer.email}`" class="trainers__card-detail-link link-reset">
            {{ trainer.email }}
          </a>
        </div>

        <div class="trainers__detail-item">
          <span class="trainers__detail-label">Телефон тренера</span>
          <a :href="trainer.phoneHref" class="trainers__card-detail-link link-reset">
            {{ trainer.phone }}
          </a>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  trainer: {
    type: Object,
    required: true,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-details', 'book'])

const trainerParts = computed(() => props.trainer.name.split(' ').filter(Boolean))
const trainerSurname = computed(() => trainerParts.value.at(-1) || props.trainer.name)
const trainerGivenName = computed(() => trainerParts.value.slice(0, -1).join(' '))
</script>

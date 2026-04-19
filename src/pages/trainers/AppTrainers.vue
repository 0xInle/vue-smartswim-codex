<template>
  <section class="trainers">
    <div class="container">
      <TrainersHeroSection :stats="trainersHeroStats" />
      <TrainersImageShowcase :image-src="trainersImage" />

      <div class="trainers__filters">
        <div class="trainers__filters-toolbar">
          <label class="trainers__filter-field trainers__filter-field--search">
            <span class="trainers__filter-label">Поиск по ФИО</span>
            <input
              v-model.trim="trainersSearch"
              class="trainers__filter-control trainers__filter-control--search"
              type="search"
              name="trainers-search"
              placeholder="Введите ФИО тренера"
            />
          </label>

          <label class="trainers__filter-field">
            <span class="trainers__filter-label">Метро</span>
            <ElSelect
              v-model="metroFilter"
              class="trainers__select"
              popper-class="trainers__select-popper"
              placeholder="Все метро"
            >
              <ElOption
                v-for="option in metroOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </label>

          <label class="trainers__filter-field">
            <span class="trainers__filter-label">Уровень подготовки</span>
            <ElSelect
              v-model="preparationLevelFilter"
              class="trainers__select"
              popper-class="trainers__select-popper"
              placeholder="Все уровни"
            >
              <ElOption
                v-for="option in preparationLevelOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </label>

          <label class="trainers__filter-field">
            <span class="trainers__filter-label">Возраст</span>
            <ElSelect
              v-model="ageGroupFilter"
              class="trainers__select"
              popper-class="trainers__select-popper"
              placeholder="Все возрасты"
            >
              <ElOption
                v-for="option in ageGroupOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </label>

          <button
            type="button"
            class="trainers__filter-reset btn-reset"
            :disabled="!hasActiveFilters"
            @click="resetTrainerFilters"
          >
            Сбросить
          </button>
        </div>
      </div>

      <TrainersCardsGrid
        :trainers="filteredTrainers"
        :active-trainer-id="activeTrainerId"
        @toggle-details="toggleTrainerDetails"
        @book="handleOpenTrainerBookingModal"
      />
    </div>

    <TrainerBookingModal
      :is-open="isTrainerBookingModalOpen"
      :trainer="activeBookingTrainer"
      :form="trainerBookingForm"
      :errors="trainerBookingErrors"
      :feedback="trainerBookingFeedback"
      :today-iso-date="todayIsoDate"
      :is-submitting="isTrainerBookingSubmitting"
      :is-identity-loading="isBookingIdentityLoading"
      :is-authenticated="isBookingAuthenticated"
      @close="closeTrainerBookingModal"
      @submit="handleTrainerBookingSubmit"
    />

    <HomeFooterSection />
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElOption, ElSelect } from 'element-plus'
import HomeFooterSection from '@/pages/home/components/HomeFooterSection.vue'
import TrainerBookingModal from '@/pages/trainers/components/TrainerBookingModal.vue'
import TrainersCardsGrid from '@/pages/trainers/components/TrainersCardsGrid.vue'
import TrainersHeroSection from '@/pages/trainers/components/TrainersHeroSection.vue'
import TrainersImageShowcase from '@/pages/trainers/components/TrainersImageShowcase.vue'
import { useTrainerBooking } from '@/pages/trainers/composables/useTrainerBooking'
import { useTrainersFilters } from '@/pages/trainers/composables/useTrainersFilters'
import { trainersHeroStats } from '@/pages/trainers/trainersData'
import '@/pages/trainers/trainers.css'
import { publicAsset } from '@/utils/publicAsset'
import { subscribeToAuthStateChange } from '@/utils/supabaseAuth'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/select/style/css'

const activeTrainerId = ref(null)
const trainersImage = publicAsset('/images/19-img.webp')
let authSubscription = null

const {
  trainersSearch,
  metroFilter,
  preparationLevelFilter,
  ageGroupFilter,
  metroOptions,
  preparationLevelOptions,
  ageGroupOptions,
  filteredTrainers,
  hasActiveFilters,
  resetTrainerFilters,
} = useTrainersFilters()

const {
  activeBookingTrainer,
  isTrainerBookingModalOpen,
  isTrainerBookingSubmitting,
  isBookingIdentityLoading,
  trainerBookingFeedback,
  trainerBookingForm,
  trainerBookingErrors,
  todayIsoDate,
  isBookingAuthenticated,
  openTrainerBookingModal,
  closeTrainerBookingModal,
  handleTrainerBookingSubmit,
  syncBookingIdentity,
  setBookingSession,
  cleanupTrainerBookingState,
} = useTrainerBooking()

function toggleTrainerDetails(trainerId) {
  activeTrainerId.value = activeTrainerId.value === trainerId ? null : trainerId
}

async function handleOpenTrainerBookingModal(trainer) {
  activeTrainerId.value = null
  await openTrainerBookingModal(trainer)
}

function handleGlobalPointerDown(event) {
  if (
    isTrainerBookingModalOpen.value &&
    event.target instanceof Element &&
    event.target.closest('.trainers-booking__dialog')
  ) {
    return
  }

  if (!activeTrainerId.value) {
    return
  }

  if (event.target instanceof Element && event.target.closest('.trainers__card-details')) {
    return
  }

  if (event.target instanceof Element && event.target.closest('.trainers__card-bookmark')) {
    return
  }

  activeTrainerId.value = null
}

function handleGlobalKeyDown(event) {
  if (event.key === 'Escape') {
    if (isTrainerBookingModalOpen.value) {
      closeTrainerBookingModal()
      return
    }

    activeTrainerId.value = null
  }
}

watch(filteredTrainers, (nextTrainers) => {
  if (!activeTrainerId.value) {
    return
  }

  if (!nextTrainers.some((trainer) => trainer.id === activeTrainerId.value)) {
    activeTrainerId.value = null
  }
})

onMounted(() => {
  void syncBookingIdentity()
  authSubscription = subscribeToAuthStateChange((_event, session) => {
    setBookingSession(session)
  })
  window.addEventListener('pointerdown', handleGlobalPointerDown)
  window.addEventListener('keydown', handleGlobalKeyDown)
})

onBeforeUnmount(() => {
  authSubscription?.unsubscribe()
  window.removeEventListener('pointerdown', handleGlobalPointerDown)
  window.removeEventListener('keydown', handleGlobalKeyDown)
  cleanupTrainerBookingState()
})
</script>

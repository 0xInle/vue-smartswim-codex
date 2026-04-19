import { computed, ref } from 'vue'
import {
  trainerAgeGroupFilterOptions,
  trainerMetroFilterOptions,
  trainerPreparationLevelFilterOptions,
  trainers,
} from '@/pages/trainers/trainersData'

const ALL_FILTER_VALUE = 'all'

function createFilterOptions(values, allLabel) {
  return [
    { value: ALL_FILTER_VALUE, label: allLabel },
    ...values.map((value) => ({ value, label: value })),
  ]
}

export function useTrainersFilters() {
  const trainersSearch = ref('')
  const metroFilter = ref(ALL_FILTER_VALUE)
  const preparationLevelFilter = ref(ALL_FILTER_VALUE)
  const ageGroupFilter = ref(ALL_FILTER_VALUE)

  const metroOptions = createFilterOptions(trainerMetroFilterOptions, 'Все метро')
  const preparationLevelOptions = createFilterOptions(
    trainerPreparationLevelFilterOptions,
    'Все уровни',
  )
  const ageGroupOptions = createFilterOptions(trainerAgeGroupFilterOptions, 'Все возрасты')

  const filteredTrainers = computed(() => {
    const normalizedSearch = trainersSearch.value.trim().toLowerCase()

    return trainers.filter((trainer) => {
      const matchesMetro =
        metroFilter.value === ALL_FILTER_VALUE
          ? true
          : trainer.metroStations?.includes(metroFilter.value)

      if (!matchesMetro) {
        return false
      }

      const matchesPreparationLevel =
        preparationLevelFilter.value === ALL_FILTER_VALUE
          ? true
          : trainer.preparationLevels?.includes(preparationLevelFilter.value)

      if (!matchesPreparationLevel) {
        return false
      }

      const matchesAgeGroup =
        ageGroupFilter.value === ALL_FILTER_VALUE
          ? true
          : trainer.ageGroups?.includes(ageGroupFilter.value)

      if (!matchesAgeGroup) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const haystack = trainer.name?.toLowerCase() || ''

      return haystack.includes(normalizedSearch)
    })
  })

  const filteredTrainersCount = computed(() => filteredTrainers.value.length)
  const hasActiveFilters = computed(
    () =>
      Boolean(
        trainersSearch.value.trim() ||
          metroFilter.value !== ALL_FILTER_VALUE ||
          preparationLevelFilter.value !== ALL_FILTER_VALUE ||
          ageGroupFilter.value !== ALL_FILTER_VALUE,
      ),
  )

  function resetTrainerFilters() {
    trainersSearch.value = ''
    metroFilter.value = ALL_FILTER_VALUE
    preparationLevelFilter.value = ALL_FILTER_VALUE
    ageGroupFilter.value = ALL_FILTER_VALUE
  }

  return {
    trainersSearch,
    metroFilter,
    preparationLevelFilter,
    ageGroupFilter,
    metroOptions,
    preparationLevelOptions,
    ageGroupOptions,
    filteredTrainers,
    filteredTrainersCount,
    hasActiveFilters,
    resetTrainerFilters,
  }
}

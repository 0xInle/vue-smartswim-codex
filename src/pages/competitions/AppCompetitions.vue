<template>
  <CompetitionsHeroSection @explore="scrollToSeries" />
  <CompetitionsListSection ref="seriesSectionRef" :items="competitionDirections" />
  <HomeFooterSection />
</template>

<script setup>
import HomeFooterSection from '@/pages/home/components/HomeFooterSection.vue'
import { onMounted, ref } from 'vue'
import { competitionDirections, ensureCompetitionDirectionsLoaded } from './competitionData'
import CompetitionsHeroSection from './components/CompetitionsHeroSection.vue'
import CompetitionsListSection from './components/CompetitionsListSection.vue'
const seriesSectionRef = ref(null)

function scrollToSeries() {
  seriesSectionRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

onMounted(() => {
  void ensureCompetitionDirectionsLoaded()
})
</script>

<template>
  <section class="competitions-archive">
    <div class="container">
      <CompetitionsArchiveHeroSection />
      <CompetitionsArchiveSeasonGrid :seasons="archiveSeasons" :grid-style="archiveGridStyle" />
      <CompetitionsArchiveGallery :images="archiveGalleryImages" />
    </div>

    <HomeFooterSection />
  </section>
</template>

<script setup>
import HomeFooterSection from '@/pages/home/components/HomeFooterSection.vue'
import { archiveGalleryImages, archiveGridStyle, archiveSeasons } from '@/pages/competitions/archiveData'
import CompetitionsArchiveGallery from './components/CompetitionsArchiveGallery.vue'
import CompetitionsArchiveHeroSection from './components/CompetitionsArchiveHeroSection.vue'
import CompetitionsArchiveSeasonGrid from './components/CompetitionsArchiveSeasonGrid.vue'
</script>

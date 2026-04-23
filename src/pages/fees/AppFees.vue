<template>
  <section class="fees">
    <div class="container">
      <FeesHeroSection />
      <FeesCampsGrid :camps="feeCamps" />
      <FeesFeaturesSection />
    </div>

    <HomeFooterSection />
  </section>
</template>

<script setup>
import HomeFooterSection from '@/pages/home/components/HomeFooterSection.vue'
import { feeCamps } from '@/pages/fees/feesData'
import FeesCampsGrid from './components/FeesCampsGrid.vue'
import FeesFeaturesSection from './components/FeesFeaturesSection.vue'
import FeesHeroSection from './components/FeesHeroSection.vue'
</script>

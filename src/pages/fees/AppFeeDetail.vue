<template>
  <section v-if="camp" class="fee-detail">
    <div class="container">
      <FeeDetailHeroSection :camp="camp" />
      <FeeDetailIntroSection :camp="camp" />
      <FeeDetailScheduleSection
        :camp-slug="camp.slug"
        :items="camp.dailySchedule"
        :visible-timeline-items="visibleTimelineItems"
        :set-timeline-item-ref="setTimelineItemRef"
      />
      <FeeDetailProgramSection :camp="camp" :program-section-style="programSectionStyle" />
      <FeeDetailIncludedSection :camp="camp" />
    </div>

    <HomeFooterSection />
  </section>
</template>

<script setup>
import HomeFooterSection from '@/pages/home/components/HomeFooterSection.vue'
import FeeDetailHeroSection from '@/pages/fees/components/FeeDetailHeroSection.vue'
import FeeDetailIncludedSection from '@/pages/fees/components/FeeDetailIncludedSection.vue'
import FeeDetailIntroSection from '@/pages/fees/components/FeeDetailIntroSection.vue'
import FeeDetailProgramSection from '@/pages/fees/components/FeeDetailProgramSection.vue'
import FeeDetailScheduleSection from '@/pages/fees/components/FeeDetailScheduleSection.vue'
import { useFeeCampDetail } from '@/pages/fees/composables/useFeeCampDetail'

const { camp, programSectionStyle, setTimelineItemRef, visibleTimelineItems } = useFeeCampDetail()
</script>

<style scoped>
.fee-detail {
  padding-top: 8px;
}
</style>

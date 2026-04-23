<template>
  <section class="fee-detail__schedule">
    <div class="fee-detail__section-head">
      <h2 class="fee-detail__section-title">Расписание</h2>
    </div>

    <div class="fee-detail__timeline">
      <article
        v-for="(item, index) in items"
        :key="`${campSlug}-${item.time}`"
        :ref="(element) => setTimelineItemRef(element, index)"
        class="fee-detail__timeline-item"
        :class="{ 'fee-detail__timeline-item--visible': visibleTimelineItems[index] }"
      >
        <div class="fee-detail__timeline-time-shell">
          <span class="fee-detail__timeline-time">{{ item.time }}</span>
        </div>
        <div class="fee-detail__timeline-card">
          <span class="fee-detail__timeline-title">{{ item.title }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  campSlug: {
    type: String,
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
  visibleTimelineItems: {
    type: Array,
    required: true,
  },
  setTimelineItemRef: {
    type: Function,
    required: true,
  },
})
</script>

<style scoped>
.fee-detail__schedule {
  margin-top: 24px;
  margin-bottom: 50px;
}

.fee-detail__section-head {
  margin-bottom: 18px;
}

.fee-detail__schedule .fee-detail__section-head {
  text-align: center;
}

.fee-detail__section-title {
  margin: 0;
  line-height: 0.95;
  font-size: clamp(28px, 4vw, 46px);
}

.fee-detail__timeline {
  position: relative;
  display: grid;
  gap: 6px;
  max-width: 820px;
  margin-inline: auto;
}

.fee-detail__timeline-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.6s ease,
    transform 0.6s ease;
}

.fee-detail__timeline-item--visible {
  opacity: 1;
  transform: translateY(0);
}

.fee-detail__timeline-time-shell,
.fee-detail__timeline-card {
  position: relative;
  z-index: 1;
  background: var(--white);
}

.fee-detail__timeline-time-shell {
  padding: 8px 16px;
  border: 1px solid color-mix(in srgb, var(--white) 22%, transparent);
  border-radius: 999px;
}

.fee-detail__timeline-card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, 520px);
  padding: 14px 22px;
  box-shadow: none;
  text-align: center;
}

.fee-detail__timeline-time {
  font-family: Oswald;
  font-size: clamp(24px, 3vw, 32px);
  line-height: 1;
}

.fee-detail__timeline-title {
  line-height: 1.6;
}

@media (max-width: 720px) {
  .fee-detail__timeline-item {
    gap: 6px;
  }

  .fee-detail__timeline-card {
    min-height: 96px;
    padding: 12px 18px;
  }
}
</style>

<template>
  <section class="competition-footer-image">
    <img :src="src" :alt="alt" class="competition-footer-image__media" loading="lazy" decoding="async" />
  </section>
</template>

<script setup>
defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
.competition-footer-image {
  margin-bottom: 120px;
  border-radius: 10px;
  overflow: hidden;
}

.competition-footer-image__media {
  display: block;
  width: 100%;
  height: 600px;
  object-fit: cover;
}

@media (max-width: 640px) {
  .competition-footer-image {
    margin-bottom: 80px;
  }
}
</style>

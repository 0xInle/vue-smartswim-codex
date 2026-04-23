<template>
  <section class="documents__footer-image">
    <img
      :src="src"
      :alt="alt"
      class="documents__footer-image-media"
      loading="lazy"
      decoding="async"
    />
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
.documents__footer-image {
  margin-bottom: 120px;
  border-radius: 10px;
  overflow: hidden;
}

.documents__footer-image-media {
  display: block;
  width: 100%;
  height: 600px;
  object-fit: cover;
}
</style>

<template>
  <section class="trainers__image-showcase" aria-label="Атмосфера тренировок Smart Swim">
    <div class="trainers__image-shell">
      <img
        :src="imageSrc"
        alt="Тренировка Smart Swim у бассейна"
        class="trainers__showcase-image"
        loading="lazy"
        decoding="async"
      />
    </div>
  </section>
</template>

<script setup>
defineProps({
  imageSrc: {
    type: String,
    required: true,
  },
})
</script>

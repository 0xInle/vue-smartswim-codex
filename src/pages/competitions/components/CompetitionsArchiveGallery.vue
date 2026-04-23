<template>
  <div class="competitions-archive__gallery">
    <article v-for="image in images" :key="image.src" class="competitions-archive__gallery-item">
      <img
        class="competitions-archive__gallery-image"
        :src="image.src"
        :alt="image.alt"
        loading="lazy"
        decoding="async"
      />
    </article>
  </div>
</template>

<script setup>
defineProps({
  images: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
.competitions-archive__gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: 84px;
  gap: 16px;
  margin: 50px 0 120px;
}

.competitions-archive__gallery-item {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  background: var(--very-light-blue);
  box-shadow:
    0 18px 38px rgb(from var(--black) r g b / 10%),
    inset 0 1px 0 rgb(from var(--white) r g b / 30%);
}

.competitions-archive__gallery-item::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgb(from var(--black) r g b / 10%) 0%,
    rgb(from var(--black) r g b / 18%) 48%,
    rgb(from var(--black) r g b / 28%) 100%
  );
  pointer-events: none;
}

.competitions-archive__gallery-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.competitions-archive__gallery-item:hover .competitions-archive__gallery-image {
  transform: scale(1.04);
}

.competitions-archive__gallery-item:nth-child(1) {
  grid-column: 1;
  grid-row: span 3;
}

.competitions-archive__gallery-item:nth-child(2) {
  grid-column: 2;
  grid-row: span 2;
}

.competitions-archive__gallery-item:nth-child(3) {
  grid-column: 3;
  grid-row: span 4;
}

.competitions-archive__gallery-item:nth-child(4) {
  grid-column: 2;
  grid-row: span 3;
}

.competitions-archive__gallery-item:nth-child(5) {
  grid-column: 1;
  grid-row: span 3;
}

.competitions-archive__gallery-item:nth-child(6) {
  grid-column: 3;
  grid-row: span 2;
}

.competitions-archive__gallery-item:nth-child(7) {
  grid-column: 2;
  grid-row: span 3;
}

.competitions-archive__gallery-item:nth-child(8) {
  grid-column: 3;
  grid-row: span 2;
}

.competitions-archive__gallery-item:nth-child(9) {
  grid-column: 1;
  grid-row: 7 / span 2;
}

@media (max-width: 900px) {
  .competitions-archive__gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: 160px;
  }

  .competitions-archive__gallery-item {
    grid-column: auto !important;
    grid-row: span 1 !important;
  }
}

@media (max-width: 768px) {
  .competitions-archive__gallery {
    margin: 30px 0 120px;
    gap: 12px;
  }
}

@media (max-width: 520px) {
  .competitions-archive__gallery {
    grid-template-columns: 1fr;
    grid-auto-rows: 220px;
  }
}
</style>

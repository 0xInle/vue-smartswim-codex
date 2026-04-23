<template>
  <section class="documents__image-break" aria-hidden="true">
    <img :src="src" alt="" class="documents__image" loading="lazy" decoding="async" />
    <div class="documents__image-decor">
      <div class="documents__image-panel">
        <p class="documents__image-contact">+7 (916) 729-07-73</p>
      </div>
      <div class="documents__image-panel">
        <p class="documents__image-contact">cupsmartswim@yandex.ru</p>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  src: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
.documents__image-break {
  position: relative;
  margin-bottom: 50px;
  border-radius: 10px;
  overflow: hidden;
  min-height: 208px;
}

.documents__image-break::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgb(from var(--black) r g b / 22%);
}

.documents__image {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 208px;
  object-fit: cover;
}

.documents__image-decor {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(360px, 520px));
  place-content: center;
  gap: 28px;
  padding: 24px;
}

.documents__image-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  border: 1px solid rgb(from var(--white) r g b / 18%);
  border-radius: 10px;
  background: linear-gradient(
    180deg,
    rgb(from var(--white) r g b / 16%) 0%,
    rgb(from var(--white) r g b / 8%) 100%
  );
  box-shadow:
    inset 0 1px 0 rgb(from var(--white) r g b / 20%),
    0 10px 28px rgb(from var(--black) r g b / 8%);
}

.documents__image-contact {
  margin: 0;
  padding: 20px;
  font-family: Oswald;
  font-size: clamp(28px, 3.6vw, 42px);
  font-weight: 300;
  line-height: 1.1;
  text-align: center;
  color: rgb(from var(--white) r g b / 94%);
  overflow-wrap: anywhere;
  text-transform: uppercase;
}

@media (max-width: 900px) {
  .documents__image-break {
    min-height: 190px;
  }

  .documents__image {
    min-height: 190px;
  }

  .documents__image-decor {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
    gap: 18px;
  }

  .documents__image-panel {
    min-height: 240px;
  }
}

@media (max-width: 520px) {
  .documents__image-decor {
    grid-template-columns: 1fr;
  }
}
</style>

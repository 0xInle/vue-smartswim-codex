<template>
  <section class="fee-detail__program" :style="programSectionStyle">
    <div class="fee-detail__program-copy">
      <span class="fee-detail__eyebrow">Фокус работы</span>
      <h2 class="fee-detail__section-title">Программа сбора</h2>
      <p class="fee-detail__text">{{ camp.focusLead }}</p>
      <p class="fee-detail__program-note">{{ camp.focusNote }}</p>
    </div>

    <div class="fee-detail__program-grid">
      <article v-for="item in camp.focusItems" :key="item" class="fee-detail__program-card">
        <p class="fee-detail__program-card-text">{{ item }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  camp: {
    type: Object,
    required: true,
  },
  programSectionStyle: {
    type: Object,
    required: true,
  },
})
</script>

<style scoped>
.fee-detail__program {
  position: relative;
  display: grid;
  padding: 50px 0;
  grid-template-columns: minmax(280px, 0.9fr) minmax(340px, 1fr);
  gap: 28px;
  align-items: start;
  isolation: isolate;
  margin-top: 24px;
  margin-bottom: 50px;
}

.fee-detail__program::before {
  content: '';
  position: absolute;
  z-index: -1;
  top: 0;
  bottom: 0;
  left: -50%;
  right: -50%;
  background: var(--fee-program-image) center / cover no-repeat;
  opacity: 1;
  border-radius: 10px;
  pointer-events: none;
}

.fee-detail__program-copy,
.fee-detail__program-card {
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  overflow: hidden;
  box-shadow:
    0 18px 38px rgb(from var(--black) r g b / 6%),
    inset 0 1px 0 rgb(from var(--white) r g b / 28%);
  background: rgb(from var(--white) r g b / 72%);
}

.fee-detail__program-copy {
  padding: 28px;
  text-align: left;
  background: rgb(from var(--white) r g b / 26%);
}

.fee-detail__eyebrow {
  display: inline-flex;
  align-self: flex-start;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 54%, var(--white));
}

.fee-detail__section-title {
  margin: 0;
  margin-bottom: 20px;
  line-height: 0.95;
  font-size: clamp(28px, 4vw, 46px);
}

.fee-detail__text,
.fee-detail__program-note {
  font-size: 16px;
  margin: 0;
  line-height: 1.75;
}

.fee-detail__program-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  width: 100%;
}

.fee-detail__program-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  min-height: 132px;
  padding: 20px 18px;
  background: rgb(from var(--white) r g b / 24%);
  box-shadow:
    0 14px 30px rgb(from var(--black) r g b / 10%),
    inset 0 1px 0 rgb(from var(--white) r g b / 32%);
}

.fee-detail__program-card-text {
  margin: 0;
  font-weight: 700;
  line-height: 1.6;
}

.fee-detail__program-note {
  margin-top: 18px;
  font-weight: 700;
}

@media (max-width: 900px) {
  .fee-detail__program {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1100px) {
  .fee-detail__program-grid {
    gap: 16px;
  }
}

@media (max-width: 720px) {
  .fee-detail__program-copy {
    padding: 20px;
  }

  .fee-detail__program-grid {
    grid-template-columns: 1fr;
  }

  .fee-detail__program {
    padding: 30px 0;
    margin-top: 20px;
  }
}
</style>

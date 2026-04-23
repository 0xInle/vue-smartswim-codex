<template>
  <div class="competitions-archive__grid" :style="gridStyle">
    <article v-for="season in seasons" :key="season.year" class="competitions-archive__card">
      <div class="competitions-archive__card-head">
        <span class="competitions-archive__card-year">{{ season.year }}</span>
      </div>

      <div class="competitions-archive__dates">
        <div v-for="date in season.dates" :key="date" class="competitions-archive__date">
          {{ date }}
        </div>
      </div>
    </article>
  </div>
</template>

<script setup>
defineProps({
  seasons: {
    type: Array,
    required: true,
  },
  gridStyle: {
    type: Object,
    required: true,
  },
})
</script>

<style scoped>
.competitions-archive__grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 100px 0;
  margin: 50px 0;
  border-radius: 10px;
  z-index: 0;
}

.competitions-archive__grid::before {
  content: '';
  position: absolute;
  inset: 0;
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  background-image: var(--archive-grid-image);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  z-index: -2;
}

.competitions-archive__grid::after {
  content: '';
  position: absolute;
  inset: 0;
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.3);
  z-index: -1;
}

.competitions-archive__card {
  border: 1px solid rgb(from var(--white) r g b / 28%);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  padding: 22px;
  background: linear-gradient(
    180deg,
    rgb(from var(--white) r g b / 24%) 0%,
    rgb(from var(--light-blue) r g b / 14%) 100%
  );
  box-shadow:
    0 18px 38px rgb(from var(--black) r g b / 12%),
    inset 0 1px 0 rgb(from var(--white) r g b / 30%);
}

.competitions-archive__card-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.competitions-archive__card-year {
  font-size: 34px;
  line-height: 1;
}

.competitions-archive__dates {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.competitions-archive__date {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 76px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 10%);
  box-shadow:
    inset 0 1px 0 rgb(from var(--white) r g b / 18%),
    0 8px 18px rgb(from var(--black) r g b / 8%);
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

@media (max-width: 900px) {
  .competitions-archive__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .competitions-archive__grid {
    margin: 30px 0;
  }

  .competitions-archive__dates {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .competitions-archive__dates {
    grid-template-columns: 1fr;
  }
}
</style>

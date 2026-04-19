<template>
  <section class="trainers__hero">
    <div class="trainers__hero-copy">
      <h1 class="trainers__title">Тренеры, которые подберут программу под вашу цель</h1>
      <p class="trainers__text">
        В команде Smart Swim работают 6 тренеров с разным профилем подготовки. Мы поможем выбрать
        специалиста под возраст, уровень, задачу и темп, чтобы занятия были не случайными, а
        действительно вели к результату.
      </p>
      <p class="trainers__text">
        Кому-то важно уверенно начать и убрать страх воды, кому-то улучшить технику, набрать объем
        или подготовиться к стартам. Мы собираем программу так, чтобы она подходила именно вам и
        была комфортной в реальном графике.
      </p>
    </div>

    <aside class="trainers__hero-aside">
      <article v-for="stat in stats" :key="stat.value" class="trainers__fact-card">
        <strong class="trainers__fact-value">{{ stat.value }}</strong>
        <p class="trainers__fact-label">{{ stat.label }}</p>
      </article>
    </aside>
  </section>
</template>

<script setup>
defineProps({
  stats: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <main class="main-content flex">
    <AppFloatingHeader />
    <RouterView />
  </main>
</template>

<script setup>
import AppFloatingHeader from '@/components/AppFloatingHeader.vue'
</script>

<style scoped>
.main-content {
  position: relative;
  flex-direction: column;
  justify-content: center;
}
</style>

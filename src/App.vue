<template>
  <main class="main-content flex">
    <AppFloatingHeader v-if="!isAccountRoute" />
    <RouterView />
  </main>
</template>

<script setup>
import { computed } from 'vue'
import AppFloatingHeader from '@/components/AppFloatingHeader.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isAccountRoute = computed(() => route.path.startsWith('/account'))
</script>

<style scoped>
.main-content {
  position: relative;
  flex-direction: column;
  justify-content: center;
}
</style>

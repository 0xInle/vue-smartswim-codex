<template>
  <main class="main-content flex">
    <AppFloatingHeader v-if="shouldShowFloatingHeader" />
    <RouterView />
    <AppToastHost />
  </main>
</template>

<script setup>
import { computed } from 'vue'
import AppFloatingHeader from '@/components/AppFloatingHeader.vue'
import AppToastHost from '@/components/AppToastHost.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const shouldShowFloatingHeader = computed(() => route.meta.showFloatingHeader !== false)
</script>

<style scoped>
.main-content {
  position: relative;
  flex-direction: column;
  justify-content: center;
}
</style>

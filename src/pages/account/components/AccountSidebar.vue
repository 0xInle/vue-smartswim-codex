<template>
  <ElAside class="account__sidebar" width="240px">
    <div class="account__sidebar-copy">
      <p class="account__sidebar-eyebrow">Личный кабинет</p>
      <h1 class="account__sidebar-title">Smart Swim</h1>
    </div>

    <ElMenu :default-active="activeSection" class="account__menu" @select="$emit('select', $event)">
      <ElMenuItem v-for="item in navigationItems" :key="item.id" :index="item.id">
        <ElIcon><component :is="item.icon" /></ElIcon>
        <span class="account__menu-label">{{ item.label }}</span>
      </ElMenuItem>
    </ElMenu>
  </ElAside>
</template>

<script setup>
import { ElAside, ElIcon, ElMenu, ElMenuItem } from 'element-plus'

defineProps({
  activeSection: {
    type: String,
    required: true,
  },
  navigationItems: {
    type: Array,
    required: true,
  },
})

defineEmits(['select'])
</script>

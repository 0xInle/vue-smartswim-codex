<template>
  <ElHeader class="account__header">
    <div class="account__header-copy">
      <h2 class="account__title">{{ title }}</h2>
    </div>

    <ElButton class="account__back-button" type="primary" @click="$emit('sign-out')">
      Выйти
    </ElButton>
  </ElHeader>
</template>

<script setup>
import { ElButton, ElHeader } from 'element-plus'

defineProps({
  title: {
    type: String,
    required: true,
  },
})

defineEmits(['sign-out'])
</script>

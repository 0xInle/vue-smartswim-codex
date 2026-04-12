<template>
  <ElCard class="account__panel" shadow="never">
    <template #header>
      <div class="account__panel-head">
        <div>
          <p class="account__panel-eyebrow">Профиль</p>
          <h3 class="account__panel-title">Данные аккаунта</h3>
        </div>
      </div>
    </template>

    <div class="account__profile-card">
      <div class="account__profile-item">
        <span class="account__profile-label">Имя</span>
        <strong class="account__profile-value">
          {{ currentUser?.name || 'Не указано' }}
        </strong>
      </div>
      <div class="account__profile-item">
        <span class="account__profile-label">Почта</span>
        <strong class="account__profile-value">
          {{ currentUser?.email || 'Не указано' }}
        </strong>
      </div>
      <div class="account__profile-item">
        <span class="account__profile-label">Роль</span>
        <strong class="account__profile-value">{{ currentRoleLabel }}</strong>
      </div>
    </div>
  </ElCard>
</template>

<script setup>
import { ElCard } from 'element-plus'

defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
  currentRoleLabel: {
    type: String,
    required: true,
  },
})
</script>

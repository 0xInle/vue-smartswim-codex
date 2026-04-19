<template>
  <ElCard class="account__panel" shadow="never">
    <template #header>
      <div class="account__panel-head">
        <div>
          <p class="account__panel-eyebrow">Пользователь</p>
          <h3 class="account__panel-title">Личный кабинет</h3>
        </div>
      </div>
    </template>

    <div class="account__placeholder">
      <div class="account__placeholder-copy">
        <p class="account__placeholder-lead">
          Каркас пользовательского кабинета уже готов.
        </p>
        <p class="account__placeholder-text">
          Здесь позже появятся разделы с данными пользователя и его действиями в Smart Swim.
        </p>
      </div>
    </div>
  </ElCard>
</template>

<script setup>
import { ElCard } from 'element-plus'
</script>

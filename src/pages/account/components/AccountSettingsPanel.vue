<template>
  <ElCard class="account__panel" shadow="never">
    <template #header>
      <div class="account__panel-head">
        <div>
          <p class="account__panel-eyebrow">Безопасность</p>
          <h3 class="account__panel-title">Смена пароля</h3>
        </div>
      </div>
    </template>

    <form class="account__password-form" novalidate @submit.prevent="$emit('submit')">
      <label class="account__field">
        <span class="account__field-label">Почта</span>
        <input
          v-model.trim="form.email"
          class="account__input"
          type="email"
          name="account-email"
          autocomplete="email"
          placeholder="example@mail.ru"
          :aria-invalid="Boolean(errors.email)"
        />
        <span v-if="errors.email" class="account__field-error">
          {{ errors.email }}
        </span>
      </label>

      <label class="account__field">
        <span class="account__field-label">Старый пароль</span>
        <div class="account__input-wrap">
          <input
            v-model="form.currentPassword"
            class="account__input account__input--password"
            :type="passwordFieldType('currentPassword')"
            name="current-password"
            autocomplete="current-password"
            placeholder="Введите текущий пароль"
            :aria-invalid="Boolean(errors.currentPassword)"
          />
          <button
            type="button"
            class="account__visibility btn-reset"
            :aria-label="
              visibility.currentPassword ? 'Скрыть текущий пароль' : 'Показать текущий пароль'
            "
            @click="$emit('toggle-visibility', 'currentPassword')"
          >
            <component :is="visibility.currentPassword ? Hide : View" />
          </button>
        </div>
        <span v-if="errors.currentPassword" class="account__field-error">
          {{ errors.currentPassword }}
        </span>
      </label>

      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Новый пароль</span>
          <div class="account__input-wrap">
            <input
              v-model="form.newPassword"
              class="account__input account__input--password"
              :type="passwordFieldType('newPassword')"
              name="new-password"
              autocomplete="new-password"
              :placeholder="`Минимум ${minPasswordLength} символов`"
              :aria-invalid="Boolean(errors.newPassword)"
            />
            <button
              type="button"
              class="account__visibility btn-reset"
              :aria-label="visibility.newPassword ? 'Скрыть новый пароль' : 'Показать новый пароль'"
              @click="$emit('toggle-visibility', 'newPassword')"
            >
              <component :is="visibility.newPassword ? Hide : View" />
            </button>
          </div>
          <span v-if="errors.newPassword" class="account__field-error">
            {{ errors.newPassword }}
          </span>
        </label>

        <label class="account__field">
          <span class="account__field-label">Подтвердите пароль</span>
          <div class="account__input-wrap">
            <input
              v-model="form.confirmPassword"
              class="account__input account__input--password"
              :type="passwordFieldType('confirmPassword')"
              name="confirm-new-password"
              autocomplete="new-password"
              placeholder="Повторите новый пароль"
              :aria-invalid="Boolean(errors.confirmPassword)"
            />
            <button
              type="button"
              class="account__visibility btn-reset"
              :aria-label="
                visibility.confirmPassword
                  ? 'Скрыть подтверждение нового пароля'
                  : 'Показать подтверждение нового пароля'
              "
              @click="$emit('toggle-visibility', 'confirmPassword')"
            >
              <component :is="visibility.confirmPassword ? Hide : View" />
            </button>
          </div>
          <span v-if="errors.confirmPassword" class="account__field-error">
            {{ errors.confirmPassword }}
          </span>
        </label>
      </div>

      <p
        v-if="status === 'success' || status === 'error'"
        class="account__form-status"
        :class="{
          'account__form-status--success': status === 'success',
          'account__form-status--error': status === 'error',
        }"
      >
        {{ message }}
      </p>

      <button type="submit" class="account__submit btn-reset" :disabled="status === 'loading'">
        {{ status === 'loading' ? 'Обновляем пароль...' : 'Сменить пароль' }}
      </button>
    </form>
  </ElCard>
</template>

<script setup>
import { Hide, View } from '@element-plus/icons-vue'
import { ElCard } from 'element-plus'

defineProps({
  form: {
    type: Object,
    required: true,
  },
  errors: {
    type: Object,
    required: true,
  },
  visibility: {
    type: Object,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  minPasswordLength: {
    type: Number,
    required: true,
  },
  passwordFieldType: {
    type: Function,
    required: true,
  },
})

defineEmits(['submit', 'toggle-visibility'])
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    width="640px"
    append-to-body
    align-center
    destroy-on-close
    class="account__dialog"
    title="Добавление соревнования"
    :close-icon="Close"
    @closed="emit('close')"
    @update:model-value="!$event && emit('close')"
  >
    <form class="account__dialog-form" @submit.prevent="submitForm">
      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Название соревнования</span>
          <input
            v-model.trim="form.competitionName"
            class="account__input"
            type="text"
            placeholder="SmartSwimCup"
            required
          />
        </label>

        <label class="account__field">
          <span class="account__field-label">Этап</span>
          <input
            v-model.number="form.stage"
            class="account__input"
            type="number"
            min="1"
            placeholder="10"
            required
          />
        </label>
      </div>

      <div class="account__field-grid">
        <label class="account__field">
          <span class="account__field-label">Дата</span>
          <AccountDatePicker
            v-model="form.date"
            caption="Выберите дату этапа"
            placeholder="Выберите дату"
          />
        </label>

        <label class="account__field">
          <span class="account__field-label">Регистрация</span>
          <div class="account__field-grid account__field-grid--compact">
            <AccountDatePicker
              v-model="form.openDate"
              caption="Выберите дату открытия регистрации"
              placeholder="Открытие"
            />
            <AccountDatePicker
              v-model="form.closeDate"
              caption="Выберите дату закрытия регистрации"
              placeholder="Закрытие"
            />
          </div>
        </label>
      </div>

      <div class="account__field-grid">
        <div class="account__field">
          <span class="account__field-label">Протокол</span>
          <button
            type="button"
            class="account__table-action account__table-action--protocol account__dialog-link-toggle btn-reset"
            @click="form.showProtocolUrl = true"
          >
            <ElIcon>
              <Link v-if="form.protocolUrl" />
              <Upload v-else />
            </ElIcon>
            {{ form.protocolUrl ? 'Ссылка добавлена' : 'Добавить ссылку' }}
          </button>
          <input
            v-if="form.showProtocolUrl"
            v-model.trim="form.protocolUrl"
            class="account__input"
            type="url"
            placeholder="Ссылка на протокол"
          />
        </div>

        <div class="account__field">
          <span class="account__field-label">Фото</span>
          <button
            type="button"
            class="account__table-action account__table-action--photo account__dialog-link-toggle btn-reset"
            @click="form.showPhotoUrl = true"
          >
            <ElIcon>
              <Link v-if="form.photoUrl" />
              <Upload v-else />
            </ElIcon>
            {{ form.photoUrl ? 'Ссылка добавлена' : 'Добавить ссылку' }}
          </button>
          <input
            v-if="form.showPhotoUrl"
            v-model.trim="form.photoUrl"
            class="account__input"
            type="url"
            placeholder="Ссылка на фото"
          />
        </div>
      </div>

      <div class="account__field-grid">
        <div class="account__field">
          <span class="account__field-label">Сертификаты</span>
          <button
            type="button"
            class="account__table-action account__table-action--protocol account__dialog-link-toggle btn-reset"
            @click="form.showCertificateUrl = true"
          >
            <ElIcon>
              <Link v-if="form.certificateUrl" />
              <Upload v-else />
            </ElIcon>
            {{ form.certificateUrl ? 'Ссылка добавлена' : 'Добавить ссылку' }}
          </button>
          <input
            v-if="form.showCertificateUrl"
            v-model.trim="form.certificateUrl"
            class="account__input"
            type="url"
            placeholder="Ссылка на архив сертификатов"
          />
        </div>

        <div class="account__field">
          <span class="account__field-label">Памятка</span>
          <button
            type="button"
            class="account__table-action account__table-action--photo account__dialog-link-toggle btn-reset"
            @click="form.showMemoUrl = true"
          >
            <ElIcon>
              <Link v-if="form.memoUrl" />
              <Upload v-else />
            </ElIcon>
            {{ form.memoUrl ? 'Ссылка добавлена' : 'Добавить ссылку' }}
          </button>
          <input
            v-if="form.showMemoUrl"
            v-model.trim="form.memoUrl"
            class="account__input"
            type="url"
            placeholder="Ссылка на памятку"
          />
        </div>
      </div>

      <div class="account__dialog-actions">
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset"
          @click="emit('close')"
        >
          Отмена
        </button>
        <button type="submit" class="account__submit btn-reset">Создать</button>
      </div>
    </form>
  </ElDialog>
</template>

<script setup>
import { Close, Link, Upload } from '@element-plus/icons-vue'
import { reactive, watch } from 'vue'
import { ElDialog, ElIcon } from 'element-plus'
import AccountDatePicker from '@/pages/account/components/shared/AccountDatePicker.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close', 'submit'])

const form = reactive({
  competitionName: '',
  stage: '',
  date: '',
  openDate: '',
  closeDate: '',
  protocolUrl: '',
  photoUrl: '',
  certificateUrl: '',
  memoUrl: '',
  showProtocolUrl: false,
  showPhotoUrl: false,
  showCertificateUrl: false,
  showMemoUrl: false,
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      resetForm()
    }
  },
)

function submitForm() {
  emit('submit', {
    competitionName: form.competitionName.trim(),
    stage: form.stage,
    date: form.date.trim(),
    openAt: form.openDate.trim(),
    closeAt: form.closeDate.trim(),
    protocolUrl: form.protocolUrl.trim(),
    photoUrl: form.photoUrl.trim(),
    certificateUrl: form.certificateUrl.trim(),
    memoUrl: form.memoUrl.trim(),
  })
}

function resetForm() {
  form.competitionName = ''
  form.stage = ''
  form.date = ''
  form.openDate = ''
  form.closeDate = ''
  form.protocolUrl = ''
  form.photoUrl = ''
  form.certificateUrl = ''
  form.memoUrl = ''
  form.showProtocolUrl = false
  form.showPhotoUrl = false
  form.showCertificateUrl = false
  form.showMemoUrl = false
}
</script>

<template>
  <ElCard class="account__panel account-email" shadow="never">
    <div class="account-email__layout">
      <section class="account-email__composer" aria-label="Новое письмо">
        <div class="account-email__section-head">
          <h3 class="account-email__section-title">Новое письмо</h3>
        </div>

        <div class="account-email__form-stack">
          <label class="account__field">
            <span class="account__field-label">Email</span>
            <input
              v-model.trim="form.recipientEmail"
              class="account__input"
              type="email"
              placeholder="user@example.com"
              :disabled="form.sendToAllUsers"
              @input="handleRecipientEmailInput"
            />
          </label>

          <label class="account__field">
            <span class="account__field-label">Пользователь</span>
            <ElSelect
              ref="userSelectRef"
              v-model="form.selectedUserId"
              class="account__select"
              popper-class="account__select-popper"
              filterable
              clearable
              placeholder="Выберите пользователя"
              no-match-text="Пользователь не найден"
              :disabled="form.sendToAllUsers"
              @clear="handleSelectedUserClear"
              @update:model-value="handleSelectedUserChange"
              @visible-change="handleUserSelectVisibleChange"
            >
              <ElOption
                v-for="recipient in regularUserRecipients"
                :key="recipient.ownerUserId"
                :label="formatRecipientOptionLabel(recipient)"
                :value="recipient.ownerUserId"
              />
            </ElSelect>
          </label>

          <label class="account__field">
            <span class="account__field-label">Тема</span>
            <input
              v-model.trim="form.subject"
              class="account__input"
              type="text"
              placeholder="Например: Информация по этапу Smart Swim"
            />
          </label>
        </div>

        <label class="account__field account-email__textarea-field">
          <span class="account__field-label">Текст письма</span>
          <textarea
            v-model.trim="form.body"
            class="account__input account-email__textarea"
            rows="8"
            placeholder="Текст письма"
          ></textarea>
        </label>

        <div class="account__dialog-actions account-email__actions">
          <label class="account-email__audience-option">
            <input
              v-model="form.sendToAllUsers"
              class="account-email__audience-checkbox"
              type="checkbox"
            />
            <span class="account-email__audience-copy">
              <strong>Отправить всем пользователям</strong>
            </span>
          </label>

          <button
            type="button"
            class="account__table-action account__table-action--edit btn-reset"
            :disabled="isSubmitDisabled"
            :aria-busy="isSaving"
            @click="handleSubmit"
          >
            <span
              v-if="isSaving"
              class="account__button-spinner"
              aria-hidden="true"
            ></span>
            <span :class="{ 'account__button-label--loading': isSaving }">Отправить</span>
          </button>
        </div>
      </section>

      <section class="account-email__history" aria-label="Журнал писем">
        <div class="account-email__section-head">
          <h3 class="account-email__section-title">Журнал</h3>
          <button
            type="button"
            class="account__table-action account__table-action--ghost btn-reset"
            :disabled="isLoading"
            :aria-busy="isLoading"
            aria-label="Обновить"
            @click="loadMessages"
          >
            <span v-if="isLoading" class="account__button-spinner" aria-hidden="true"></span>
            <span :class="{ 'account__button-label--loading': isLoading }">Обновить</span>
          </button>
        </div>

        <label class="account__field account-email__history-filter">
          <span class="account__field-label">Контекст</span>
          <ElSelect
            v-model="messageContextFilter"
            class="account__select"
            popper-class="account__select-popper"
            placeholder="Все письма"
          >
            <ElOption
              v-for="option in emailContextOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </label>

        <div
          v-if="props.showInitialSkeleton || (isLoading && !hasLoadedMessages)"
          class="account-email__message-list account-email__message-list--skeleton"
          aria-busy="true"
        >
          <article
            v-for="index in 3"
            :key="`email-message-skeleton-${index}`"
            class="account-email__message account-email__message--skeleton"
          >
            <div class="account-email__message-main account-email__message-main--skeleton">
              <span class="account-email__skeleton-line account-email__skeleton-line--subject"></span>
              <span class="account-email__skeleton-line account-email__skeleton-line--meta"></span>
              <span class="account-email__skeleton-line account-email__skeleton-line--meta"></span>
              <span class="account-email__skeleton-line account-email__skeleton-line--meta"></span>
            </div>
            <span class="account-email__skeleton-pill"></span>
          </article>
        </div>

        <div
          v-else-if="filteredMessages.length"
          class="account-email__message-list"
          :class="{ 'account-email__message-list--scrollable': filteredMessages.length > 3 }"
        >
          <article
            v-for="message in filteredMessages"
            :key="message.id"
            class="account-email__message"
          >
            <div class="account-email__message-main">
              <strong class="account-email__message-subject">{{ message.subject }}</strong>
              <span class="account-email__message-meta">
                {{ formatEmailAudienceType(message.audienceType) }} · {{ message.recipientCount }} получ.
              </span>
              <span class="account-email__message-meta">
                {{ formatEmailContextType(message.contextType) }} · {{ formatCompactDateTime(message.createdAt) }}
              </span>
              <span class="account-email__message-meta">
                Отправитель: {{ message.createdByEmail || 'почта администратора системы' }}
              </span>
              <span v-if="message.deliveryNote" class="account-email__message-meta">
                {{ message.deliveryNote }}
              </span>
            </div>
            <ElTag :type="getEmailStatusTagType(message.status)" effect="light" round>
              {{ formatEmailStatus(message.status) }}
            </ElTag>
          </article>
        </div>

        <ElEmpty v-else :description="emailEmptyDescription" />
      </section>
    </div>
  </ElCard>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElCard, ElEmpty, ElOption, ElSelect, ElTag } from 'element-plus'
import {
  formatEmailAudienceType,
  formatEmailStatus,
  getEmailStatusTagType,
} from '@/domains/account-email/emailLifecycle'
import {
  loadEmailMessagesForAdmin,
  subscribeToAccountEmailChanges,
} from '@/domains/account-email/emailRepository'
import {
  loadAccountEmailRecipientsForAdmin,
  subscribeToAccountUsersChanges,
} from '@/domains/account-users/accountUsersRepository'
import { formatCompactDateTime } from '@/pages/account/utils/accountFormatters'
import { CRM_ROLE } from '@/utils/crmRoles'
import { showToast } from '@/utils/toast'

const form = reactive({
  sendToAllUsers: false,
  recipientEmail: '',
  selectedUserId: '',
  subject: '',
  body: '',
})
const messageContextFilter = ref('all')
const messages = ref([])
const users = ref([])
const userSelectRef = ref(null)
const isLoading = ref(false)
const hasLoadedMessages = ref(false)
const isSaving = ref(false)
let unsubscribeFromEmail = null
let unsubscribeFromRecipientUsers = null
let messagesRefreshTimer = null
let recipientUsersRefreshTimer = null
let shouldCloseUserSelectAfterClear = false

const EMAIL_REFRESH_DEBOUNCE_MS = 300

const emailContextOptions = [
  { value: 'all', label: 'Все письма' },
  { value: 'manual', label: 'Ручные' },
  { value: 'stage', label: 'Этап' },
  { value: 'admission', label: 'Допуск' },
  { value: 'payment', label: 'Оплата' },
  { value: 'refund', label: 'Возврат' },
]

const emailContextLabels = emailContextOptions.reduce((acc, option) => {
  acc[option.value] = option.label
  return acc
}, {})

const props = defineProps({
  showInitialSkeleton: {
    type: Boolean,
    default: false,
  },
})

const regularUserRecipients = computed(() =>
  users.value
    .filter(
      (user) =>
        user.email &&
        user.role !== CRM_ROLE.ADMIN &&
        user.role !== CRM_ROLE.TRAINER,
    )
    .map((user) => ({
      ownerUserId: user.id,
      email: user.email,
      name: user.name,
      recipientType: 'user',
    })),
)

const regularRecipientsCount = computed(() => regularUserRecipients.value.length)

const selectedRecipient = computed(
  () =>
    regularUserRecipients.value.find(
      (recipient) => recipient.ownerUserId === form.selectedUserId,
    ) || null,
)

const recipientEmail = computed(() => form.recipientEmail.trim())

const hasRecipientEmail = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.value),
)

const isSubmitDisabled = computed(
  () =>
    isSaving.value ||
    !form.subject.trim() ||
    !form.body.trim() ||
    (form.sendToAllUsers
      ? !regularRecipientsCount.value
      : !selectedRecipient.value && !hasRecipientEmail.value),
)

const filteredMessages = computed(() => {
  if (messageContextFilter.value === 'all') {
    return messages.value
  }

  return messages.value.filter((message) => message.contextType === messageContextFilter.value)
})

const emailEmptyDescription = computed(() => {
  if (isLoading.value) {
    return ' '
  }

  if (messages.value.length && !filteredMessages.value.length) {
    return 'Писем с таким контекстом пока нет.'
  }

  return 'Писем пока нет.'
})

function formatEmailContextType(contextType) {
  return emailContextLabels[contextType] || 'Контекст не указан'
}

function resetForm() {
  form.sendToAllUsers = false
  form.recipientEmail = ''
  form.selectedUserId = ''
  form.subject = ''
  form.body = ''
}

function handleRecipientEmailInput() {
  if (form.recipientEmail.trim()) {
    form.sendToAllUsers = false
    form.selectedUserId = ''
  }
}

function handleSelectedUserChange(userId) {
  const recipient = regularUserRecipients.value.find(
    (item) => item.ownerUserId === userId,
  )

  if (!recipient) {
    return
  }

  form.sendToAllUsers = false
  form.recipientEmail = recipient.email || ''
}

function blurUserSelectAfterClear() {
  void nextTick(() => {
    userSelectRef.value?.blur?.()
  })
}

function handleSelectedUserClear() {
  shouldCloseUserSelectAfterClear = true
  blurUserSelectAfterClear()
}

function handleUserSelectVisibleChange(isVisible) {
  if (!isVisible) {
    shouldCloseUserSelectAfterClear = false
    return
  }

  if (shouldCloseUserSelectAfterClear) {
    blurUserSelectAfterClear()
  }
}

function formatRecipientOptionLabel(recipient) {
  return recipient.name || 'Без имени'
}

async function loadMessages() {
  isLoading.value = true

  try {
    messages.value = await loadEmailMessagesForAdmin()
  } catch (error) {
    showToast(error, { type: 'error' })
  } finally {
    isLoading.value = false
  }
}

watch(
  () => isLoading.value,
  (loading, previousLoading) => {
    if (previousLoading && !loading) {
      hasLoadedMessages.value = true
    }
  },
)

watch(
  () => form.sendToAllUsers,
  (sendToAllUsers) => {
    if (sendToAllUsers) {
      form.recipientEmail = ''
      form.selectedUserId = ''
    }
  },
)

async function loadRecipientUsers() {
  try {
    users.value = await loadAccountEmailRecipientsForAdmin()
  } catch (error) {
    users.value = []
    showToast(error, { type: 'error' })
  }
}

function scheduleMessagesRefresh() {
  if (messagesRefreshTimer) {
    return
  }

  messagesRefreshTimer = window.setTimeout(() => {
    messagesRefreshTimer = null
    void loadMessages()
  }, EMAIL_REFRESH_DEBOUNCE_MS)
}

function scheduleRecipientUsersRefresh() {
  if (recipientUsersRefreshTimer) {
    return
  }

  recipientUsersRefreshTimer = window.setTimeout(() => {
    recipientUsersRefreshTimer = null
    void loadRecipientUsers()
  }, EMAIL_REFRESH_DEBOUNCE_MS)
}

function cancelEmailRefreshTimers() {
  if (messagesRefreshTimer) {
    clearTimeout(messagesRefreshTimer)
    messagesRefreshTimer = null
  }

  if (recipientUsersRefreshTimer) {
    clearTimeout(recipientUsersRefreshTimer)
    recipientUsersRefreshTimer = null
  }
}

async function handleSubmit() {
  if (isSubmitDisabled.value) {
    return
  }

  isSaving.value = true

  try {
    showToast('Каркас отправки готов. Подключение email-провайдера будет отдельным шагом.')
    resetForm()
  } catch (error) {
    showToast(error, { type: 'error' })
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  void loadMessages()
  void loadRecipientUsers()

  unsubscribeFromEmail = subscribeToAccountEmailChanges(() => {
    scheduleMessagesRefresh()
  })
  unsubscribeFromRecipientUsers = subscribeToAccountUsersChanges(() => {
    scheduleRecipientUsersRefresh()
  })
})

onBeforeUnmount(() => {
  cancelEmailRefreshTimers()

  if (unsubscribeFromEmail) {
    unsubscribeFromEmail()
    unsubscribeFromEmail = null
  }

  if (unsubscribeFromRecipientUsers) {
    unsubscribeFromRecipientUsers()
    unsubscribeFromRecipientUsers = null
  }
})
</script>

<style scoped>
.account-email {
  overflow: hidden;
}

.account-email__layout {
  display: grid;
  gap: 18px;
}

.account-email__composer,
.account-email__history {
  border: 1px solid color-mix(in srgb, var(--light-blue) 54%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 86%, transparent);
  box-shadow: 0 16px 34px color-mix(in srgb, var(--light-blue) 22%, transparent);
  padding: 18px;
}

.account-email__section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.account-email__section-title {
  margin: 0;
  font-family: 'Oswald', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--black);
}

.account-email__history-filter {
  margin-bottom: 14px;
}

.account-email__form-stack {
  display: grid;
  gap: 14px;
}

.account-email .account__field {
  width: 50%;
  max-width: 100%;
  margin-bottom: 14px;
}

.account-email .account-email__textarea-field {
  width: 100%;
}

.account-email .account__input,
.account-email :deep(.account__select) {
  width: 50%;
  max-width: 100%;
}

.account-email .account__field > .account__input,
.account-email .account__field > :deep(.account__select),
.account-email :deep(.account__select .el-select__wrapper) {
  width: 100%;
}

.account-email .account__input,
.account-email :deep(.account__select .el-select__wrapper),
.account-email :deep(.account__select .el-select__selected-item),
.account-email :deep(.account__select .el-select__placeholder),
.account-email :deep(.account__select .el-select__input) {
  font-size: 15px;
  font-weight: 700;
}

.account-email__textarea {
  width: 100%;
  min-height: 156px;
  max-height: none;
  padding-block: 12px;
  line-height: 1.5;
  resize: none;
}

.account-email__audience-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.account-email__audience-checkbox {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--cyan);
}

.account-email__audience-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.account-email__audience-copy strong {
  font-size: 15px;
  line-height: 1.35;
  color: var(--black);
}

.account-email__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 16px;
}

.account-email__message-list {
  display: grid;
  gap: 10px;
}

.account-email__message-list--scrollable {
  max-height: 294px;
  overflow-y: auto;
  padding-right: 4px;
}

.account-email__message-list--skeleton {
  pointer-events: none;
}

.account-email__message--skeleton {
  align-items: center;
}

.account-email__message {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid color-mix(in srgb, var(--light-blue) 42%, transparent);
  border-radius: 10px;
  padding: 12px;
}

.account-email__message-main {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.account-email__message-main--skeleton {
  gap: 8px;
}

.account-email__message-subject {
  overflow: hidden;
  color: var(--black);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-email__message-meta {
  font-size: 13px;
  color: color-mix(in srgb, var(--black) 56%, transparent);
}

.account-email__skeleton-line,
.account-email__skeleton-pill {
  position: relative;
  overflow: hidden;
  display: block;
  border-radius: 999px;
  background: color-mix(in srgb, var(--light-blue) 22%, white);
}

.account-email__skeleton-line::after,
.account-email__skeleton-pill::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.74), transparent);
  animation: account-email-skeleton 1.2s ease-in-out infinite;
}

.account-email__skeleton-line--subject {
  width: min(260px, 60%);
  height: 16px;
}

.account-email__skeleton-line--meta {
  width: min(360px, 88%);
  height: 12px;
}

.account-email__skeleton-pill {
  width: 84px;
  height: 28px;
  margin-top: 2px;
}

@keyframes account-email-skeleton {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 980px) {
  .account-email .account__input,
  .account-email :deep(.account__select),
  .account-email__form-stack,
  .account-email .account__field {
    width: 100%;
  }

  .account-email__section-head,
  .account-email__message,
  .account-email__actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

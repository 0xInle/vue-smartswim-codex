<template>
  <ElCard class="account__panel account-user-email" shadow="never">
    <div class="account-user-email__header">
      <div>
        <h3 class="account__panel-title">Сообщения от Smart Swim</h3>
      </div>

      <button
        type="button"
        class="account__table-action account__table-action--ghost btn-reset"
        :disabled="isLoading"
        :aria-busy="isLoading"
        aria-label="Обновить"
        @click="loadMessages"
      >
        <span v-if="isLoading" class="account__button-spinner" aria-hidden="true"></span>
        <span v-else>Обновить</span>
      </button>
    </div>

    <div
      v-if="loadError"
      class="account-user-email__notice account-user-email__notice--error"
    >
      {{ loadError }}
    </div>

    <div v-else-if="isLoading && !hasLoadedMessages" class="account-user-email__skeleton" aria-busy="true">
      <article
        v-for="index in 3"
        :key="`user-email-skeleton-${index}`"
        class="account-user-email__message account-user-email__message--skeleton"
      >
        <div class="account-user-email__message-head">
          <div class="account-user-email__message-title-group account-user-email__message-title-group--skeleton">
            <span class="account-user-email__skeleton-line account-user-email__skeleton-line--title"></span>
            <span class="account-user-email__skeleton-line account-user-email__skeleton-line--subtitle"></span>
          </div>
          <div class="account-user-email__message-meta">
            <span class="account-user-email__skeleton-pill"></span>
          </div>
        </div>

        <span class="account-user-email__skeleton-line account-user-email__skeleton-line--body"></span>
        <span class="account-user-email__skeleton-line account-user-email__skeleton-line--body-short"></span>
      </article>
    </div>

    <div v-else-if="messages.length" class="account-user-email__list">
      <article
        v-for="message in messages"
        :key="message.id"
        class="account-user-email__message"
      >
        <div class="account-user-email__message-head">
          <div class="account-user-email__message-title-group">
            <h4 class="account-user-email__message-title">{{ message.subject }}</h4>
          </div>
          <div class="account-user-email__message-meta">
            <span class="account-user-email__message-date">
              {{ formatCompactDateTime(message.createdAt) }}
            </span>
            <ElTag :type="getEmailStatusTagType(message.status)" effect="light" round>
              {{ formatEmailStatus(message.status) }}
            </ElTag>
          </div>
        </div>

        <p v-if="message.deliveryNote" class="account-user-email__message-note">
          {{ message.deliveryNote }}
        </p>

        <p class="account-user-email__message-body">{{ message.body }}</p>
      </article>
    </div>

    <ElEmpty v-else description="Писем пока нет." />
  </ElCard>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElCard, ElEmpty, ElTag } from 'element-plus'
import {
  formatEmailStatus,
  getEmailStatusTagType,
} from '@/domains/account-email/emailLifecycle'
import {
  loadEmailMessagesForCurrentUser,
  subscribeToAccountEmailChanges,
} from '@/domains/account-email/emailRepository'
import { formatCompactDateTime } from '@/pages/account/utils/accountFormatters'

const messages = ref([])
const isLoading = ref(false)
const loadError = ref('')
const hasLoadedMessages = ref(false)
let unsubscribeFromEmail = null
let messagesRefreshTimer = null

const EMAIL_REFRESH_DEBOUNCE_MS = 300

async function loadMessages() {
  isLoading.value = true
  loadError.value = ''

  try {
    messages.value = await loadEmailMessagesForCurrentUser()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Не удалось загрузить письма.'
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

function scheduleMessagesRefresh() {
  if (messagesRefreshTimer) {
    return
  }

  messagesRefreshTimer = window.setTimeout(() => {
    messagesRefreshTimer = null
    void loadMessages()
  }, EMAIL_REFRESH_DEBOUNCE_MS)
}

function cancelMessagesRefresh() {
  if (messagesRefreshTimer) {
    clearTimeout(messagesRefreshTimer)
    messagesRefreshTimer = null
  }
}

onMounted(() => {
  void loadMessages()

  unsubscribeFromEmail = subscribeToAccountEmailChanges(() => {
    scheduleMessagesRefresh()
  })
})

onBeforeUnmount(() => {
  cancelMessagesRefresh()

  if (unsubscribeFromEmail) {
    unsubscribeFromEmail()
    unsubscribeFromEmail = null
  }
})
</script>

<style scoped>
.account-user-email :deep(.el-card__body) {
  display: grid;
  gap: 18px;
}

.account-user-email__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.account-user-email__skeleton {
  display: grid;
  gap: 10px;
}

.account-user-email__message--skeleton {
  pointer-events: none;
}

.account-user-email__message-title-group--skeleton {
  gap: 8px;
}

.account-user-email__skeleton-line,
.account-user-email__skeleton-pill {
  position: relative;
  overflow: hidden;
  display: block;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cyan) 12%, white);
}

.account-user-email__skeleton-line::after,
.account-user-email__skeleton-pill::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.74), transparent);
  animation: account-user-email-skeleton 1.2s ease-in-out infinite;
}

.account-user-email__skeleton-line--title {
  width: min(240px, 72%);
  height: 16px;
}

.account-user-email__skeleton-line--subtitle {
  width: min(140px, 48%);
  height: 12px;
}

.account-user-email__skeleton-pill {
  width: 70px;
  height: 24px;
}

.account-user-email__skeleton-line--body {
  width: 100%;
  height: 14px;
}

.account-user-email__skeleton-line--body-short {
  width: 78%;
  height: 14px;
}

@keyframes account-user-email-skeleton {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.account-user-email__list {
  display: grid;
  gap: 10px;
}

.account-user-email__message {
  display: grid;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--cyan) 18%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.86);
  box-shadow: 0 12px 28px rgb(15 23 42 / 0.06);
}

.account-user-email__message-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.account-user-email__message-title-group {
  display: grid;
  gap: 0;
  min-width: 0;
}

.account-user-email__message-title {
  margin: 0;
  color: #111827;
  font-family: 'Oswald', sans-serif;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
}

.account-user-email__message-meta {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-left: auto;
  flex: 0 0 auto;
  min-width: 0;
}

.account-user-email__message-meta :deep(.el-tag) {
  flex: 0 0 auto;
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 900;
}

.account-user-email__message-date,
.account-user-email__message-note,
.account-user-email__message-body {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.4;
}

.account-user-email__message-date {
  text-align: right;
  white-space: nowrap;
}

.account-user-email__message-note {
  color: #c75f33;
}

.account-user-email__message-body {
  padding-top: 8px;
  border-top: 1px solid color-mix(in srgb, var(--cyan) 14%, white);
  color: #334155;
  white-space: pre-wrap;
}

.account-user-email__notice {
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.9);
  color: #31526b;
  font-weight: 800;
}

.account-user-email__notice--error {
  border-color: color-mix(in srgb, #d7502f 24%, white);
  color: #9f341f;
}

@media (max-width: 720px) {
  .account-user-email__header,
  .account-user-email__message-head,
  .account-user-email__message-meta {
    display: grid;
  }

  .account-user-email__message-meta {
    justify-items: start;
    justify-content: start;
  }

  .account-user-email__message-date {
    text-align: left;
  }
}
</style>

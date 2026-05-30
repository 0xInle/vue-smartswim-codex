<template>
  <ElCard class="account__panel account-email" shadow="never">
    <div class="account-email__notice">
      <div>
        <p class="account__panel-eyebrow">Email foundation</p>
        <h3 class="account__panel-title account-email__notice-title">Ручные письма и журнал</h3>
      </div>
      <ElTag type="warning" effect="light" round>
        Отправка через провайдера еще не подключена
      </ElTag>
    </div>

    <div class="account-email__layout">
      <section class="account-email__composer" aria-label="Новое письмо">
        <div class="account-email__section-head">
          <h4 class="account-email__section-title">Новое письмо</h4>
          <span class="account-email__section-meta">
            Будет создана очередь в Supabase без фактической отправки
          </span>
        </div>

        <div class="account-email__form-grid">
          <label class="account__field">
            <span class="account__field-label">Получатели</span>
            <ElSelect
              v-model="form.audienceType"
              class="account__select"
              popper-class="account__select-popper"
              placeholder="Выберите аудиторию"
            >
              <ElOption label="Выбранные пользователи" value="selected_users" />
              <ElOption label="Участники этапа" value="stage_participants" />
            </ElSelect>
          </label>

          <label v-if="form.audienceType === 'stage_participants'" class="account__field">
            <span class="account__field-label">Этап</span>
            <ElSelect
              v-model="form.stageId"
              class="account__select"
              popper-class="account__select-popper"
              placeholder="Выберите этап"
            >
              <ElOption
                v-for="stage in stageOptions"
                :key="stage.value"
                :label="stage.label"
                :value="stage.value"
              />
            </ElSelect>
          </label>
        </div>

        <div v-if="form.audienceType === 'selected_users'" class="account-email__user-picker">
          <label class="account__field account-email__search-field">
            <span class="account__field-label">Поиск пользователя</span>
            <input
              v-model="userSearch"
              class="account__input"
              type="search"
              placeholder="Имя или email"
            />
          </label>

          <div v-if="filteredUsers.length" class="account-email__user-list">
            <label
              v-for="user in filteredUsers"
              :key="user.id"
              class="account-email__user-option"
            >
              <input
                v-model="form.selectedUserIds"
                type="checkbox"
                :value="user.id"
                :disabled="!user.email"
              />
              <span class="account-email__user-copy">
                <strong>{{ user.name || 'Без имени' }}</strong>
                <small>{{ user.email || 'Почта не указана' }}</small>
              </span>
            </label>
          </div>

          <ElEmpty v-else description="Пользователи не найдены." />
        </div>

        <label class="account__field">
          <span class="account__field-label">Тема</span>
          <input
            v-model="form.subject"
            class="account__input"
            type="text"
            placeholder="Например: Информация по этапу Smart Swim"
          />
        </label>

        <label class="account__field">
          <span class="account__field-label">Текст письма</span>
          <textarea
            v-model="form.body"
            class="account__textarea account-email__textarea"
            rows="8"
            placeholder="Текст для будущей отправки через email-провайдера"
          ></textarea>
        </label>

        <div class="account-email__preview">
          <div class="account-email__preview-head">
            <span>Получатели</span>
            <ElTag type="primary" effect="light" round>{{ recipientPreview.length }}</ElTag>
          </div>

          <div v-if="recipientPreview.length" class="account-email__recipient-chips">
            <span
              v-for="recipient in recipientPreview.slice(0, 8)"
              :key="recipient.email"
              class="account-email__recipient-chip"
            >
              {{ recipient.name || recipient.email }}
            </span>
            <span v-if="recipientPreview.length > 8" class="account-email__recipient-more">
              +{{ recipientPreview.length - 8 }}
            </span>
          </div>
          <p v-else class="account-email__empty-copy">
            Выберите пользователей или этап, чтобы увидеть получателей.
          </p>
        </div>

        <div class="account__dialog-actions account-email__actions">
          <button
            type="button"
            class="account__submit btn-reset"
            :disabled="isSubmitDisabled"
            @click="handleSubmit"
          >
            {{ isSaving ? 'Сохраняем...' : 'Поставить в очередь' }}
          </button>
        </div>
      </section>

      <section class="account-email__history" aria-label="Журнал писем">
        <div class="account-email__section-head">
          <h4 class="account-email__section-title">Журнал</h4>
          <button
            type="button"
            class="account__table-action account__table-action--ghost btn-reset"
            :disabled="isLoading"
            @click="loadMessages"
          >
            Обновить
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

        <div v-if="filteredMessages.length" class="account-email__message-list">
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
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElCard, ElEmpty, ElOption, ElSelect, ElTag } from 'element-plus'
import {
  EMAIL_AUDIENCE_TYPE,
  formatEmailAudienceType,
  formatEmailStatus,
  getEmailStatusTagType,
} from '@/domains/account-email/emailLifecycle'
import {
  createQueuedEmailMessageForAdmin,
  loadEmailMessagesForAdmin,
  subscribeToAccountEmailChanges,
} from '@/domains/account-email/emailRepository'
import { dedupeEmailRecipients } from '@/domains/account-email/emailMappers'
import { loadAllCompetitionRegistrationsForAdmin } from '@/pages/account/utils/accountCompetitionRegistrations'
import { buildAccountCompetitionStages } from '@/pages/account/accountCompetitionStages.data'
import { formatCompactDateTime } from '@/pages/account/utils/accountFormatters'
import { showToast } from '@/utils/toast'

const props = defineProps({
  users: {
    type: Array,
    required: true,
  },
})

const form = reactive({
  audienceType: EMAIL_AUDIENCE_TYPE.SELECTED_USERS,
  selectedUserIds: [],
  stageId: '',
  subject: '',
  body: '',
})
const userSearch = ref('')
const messageContextFilter = ref('all')
const messages = ref([])
const registrations = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
let unsubscribeFromEmail = null

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

function getUuidOrEmpty(value) {
  const normalizedValue = String(value || '').trim()

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    normalizedValue,
  )
    ? normalizedValue
    : ''
}

const stageOptions = computed(() =>
  buildAccountCompetitionStages().map((stage) => ({
    value: stage.id,
    label: `${stage.competitionName} · этап ${stage.title} · ${stage.registration.competitionDateLabel}`,
  })),
)

const filteredUsers = computed(() => {
  const search = userSearch.value.trim().toLowerCase()

  return props.users
    .filter((user) => user.email)
    .filter((user) => {
      if (!search) {
        return true
      }

      return [user.name, user.email].filter(Boolean).join(' ').toLowerCase().includes(search)
    })
    .slice(0, 80)
})

const selectedUserRecipients = computed(() => {
  const selectedIds = new Set(form.selectedUserIds)

  return props.users
    .filter((user) => selectedIds.has(user.id))
    .map((user) => ({
      ownerUserId: user.id,
      email: user.email,
      name: user.name,
      recipientType: 'user',
    }))
})

const stageParticipantRecipients = computed(() =>
  registrations.value
    .filter((registration) => registration.stageId === form.stageId)
    .map((registration) => ({
      ownerUserId: getUuidOrEmpty(registration.sourceUserKey),
      email: registration.ownerEmail || registration.participantEmail,
      name: registration.participantName || registration.ownerName,
      recipientType: 'participant',
    })),
)

const recipientPreview = computed(() => {
  if (form.audienceType === EMAIL_AUDIENCE_TYPE.STAGE_PARTICIPANTS) {
    return dedupeEmailRecipients(stageParticipantRecipients.value)
  }

  return dedupeEmailRecipients(selectedUserRecipients.value)
})

const isSubmitDisabled = computed(
  () =>
    isSaving.value ||
    !form.subject.trim() ||
    !form.body.trim() ||
    !recipientPreview.value.length,
)

const filteredMessages = computed(() => {
  if (messageContextFilter.value === 'all') {
    return messages.value
  }

  return messages.value.filter((message) => message.contextType === messageContextFilter.value)
})

const emailEmptyDescription = computed(() => {
  if (isLoading.value) {
    return 'Загружаем письма...'
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
  form.selectedUserIds = []
  form.stageId = ''
  form.subject = ''
  form.body = ''
  userSearch.value = ''
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

async function loadRegistrations() {
  try {
    registrations.value = await loadAllCompetitionRegistrationsForAdmin()
  } catch {
    registrations.value = []
  }
}

async function handleSubmit() {
  if (isSubmitDisabled.value) {
    return
  }

  isSaving.value = true

  try {
    await createQueuedEmailMessageForAdmin({
      audienceType: form.audienceType,
      contextType:
        form.audienceType === EMAIL_AUDIENCE_TYPE.STAGE_PARTICIPANTS ? 'stage' : 'manual',
      contextId:
        form.audienceType === EMAIL_AUDIENCE_TYPE.STAGE_PARTICIPANTS ? form.stageId : '',
      subject: form.subject,
      body: form.body,
      recipients: recipientPreview.value,
    })
    showToast('Письмо поставлено в очередь. Отправка включится после подключения провайдера.')
    resetForm()
    await loadMessages()
  } catch (error) {
    showToast(error, { type: 'error' })
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  void loadMessages()
  void loadRegistrations()

  unsubscribeFromEmail = subscribeToAccountEmailChanges(() => {
    void loadMessages()
  })
})

onBeforeUnmount(() => {
  if (unsubscribeFromEmail) {
    unsubscribeFromEmail()
    unsubscribeFromEmail = null
  }
})
</script>

<style scoped>
.account-email {
  overflow: hidden;
}

.account-email__notice {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.account-email__notice-title {
  margin: 4px 0 0;
}

.account-email__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
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

.account-email__section-meta {
  max-width: 280px;
  font-size: 13px;
  line-height: 1.35;
  color: color-mix(in srgb, var(--black) 58%, transparent);
  text-align: right;
}

.account-email__history-filter {
  margin-bottom: 14px;
}

.account-email__form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.account-email__user-picker {
  display: grid;
  gap: 10px;
  margin: 14px 0;
}

.account-email__search-field {
  margin: 0;
}

.account-email__user-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  max-height: 240px;
  overflow: auto;
  padding: 2px;
}

.account-email__user-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--light-blue) 48%, transparent);
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
}

.account-email__user-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.account-email__user-copy strong,
.account-email__user-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-email__user-copy small {
  color: color-mix(in srgb, var(--black) 56%, transparent);
}

.account-email__textarea {
  min-height: 156px;
  resize: vertical;
}

.account-email__preview {
  display: grid;
  gap: 10px;
  margin-top: 14px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--very-light-blue) 58%, transparent);
  padding: 12px;
}

.account-email__preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-weight: 800;
}

.account-email__recipient-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.account-email__recipient-chip,
.account-email__recipient-more {
  border-radius: 999px;
  background: var(--white);
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 800;
  color: color-mix(in srgb, var(--black) 74%, transparent);
}

.account-email__recipient-more {
  color: var(--cyan);
}

.account-email__empty-copy {
  margin: 0;
  color: color-mix(in srgb, var(--black) 56%, transparent);
}

.account-email__actions {
  margin-top: 16px;
}

.account-email__message-list {
  display: grid;
  gap: 10px;
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

@media (max-width: 980px) {
  .account-email__layout,
  .account-email__form-grid,
  .account-email__user-list {
    grid-template-columns: 1fr;
  }

  .account-email__notice,
  .account-email__section-head,
  .account-email__message {
    align-items: stretch;
    flex-direction: column;
  }

  .account-email__section-meta {
    max-width: none;
    text-align: left;
  }
}
</style>

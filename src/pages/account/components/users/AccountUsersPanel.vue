<template>
  <ElCard class="account__panel" shadow="never">
    <div class="account__users-toolbar">
      <label class="account__field account__field--search">
        <span class="account__field-label">Поиск</span>
        <input
          :value="search"
          class="account__input account__input--toolbar"
          type="search"
          name="users-search"
          placeholder="Поиск по пользователям"
          @input="$emit('update:search', $event.target.value)"
        />
      </label>

      <label class="account__field account__field--filter">
        <span class="account__field-label">Роль</span>
        <ElSelect
          :model-value="roleFilter"
          class="account__select"
          popper-class="account__select-popper"
          placeholder="Выберите роль"
          @update:model-value="$emit('update:role-filter', $event)"
        >
          <ElOption label="Все роли" value="all" />
          <ElOption
            v-for="option in userRoleOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </label>

      <div class="account__users-toolbar-meta">
        <ElTag type="primary" effect="light" round>{{ total }} записей</ElTag>
      </div>
    </div>

    <div v-if="users.length || isLoading" class="account__native-table-wrap account-users__table-wrap">
      <table class="account__native-table account__native-table--users">
        <thead class="account__native-table-head">
          <tr>
            <th class="account__native-table-head-cell--sortable">
              <button
                type="button"
                class="account__table-sort-button account__table-sort-button--left btn-reset"
                :class="{ 'account__table-sort-button--active': sortKey === 'name' }"
                :aria-label="getSortAriaLabel('ФИО', 'name')"
                @click="$emit('toggle-sort', 'name')"
              >
                <span>ФИО</span>
                <span
                  class="account__table-sort-indicator"
                  :data-direction="getSortDirection('name')"
                  aria-hidden="true"
                ></span>
              </button>
            </th>
            <th>Роль</th>
            <th>Телефон</th>
          </tr>
        </thead>

        <tbody>
          <template v-if="isLoading">
            <tr
              v-for="rowIndex in skeletonRows"
              :key="`users-skeleton-${rowIndex}`"
              class="account__native-table-row account-users__table-row account-users__table-row--skeleton"
              aria-hidden="true"
            >
              <td class="account__native-table-cell account__native-table-cell--primary">
                <span class="account-users__skeleton-line account-users__skeleton-line--name"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-users__skeleton-line account-users__skeleton-line--role"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-users__skeleton-line account-users__skeleton-line--phone"></span>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="row in users"
              :key="row.id"
              class="account__native-table-row account-users__table-row"
              tabindex="0"
              role="button"
              @click="$emit('edit-user', row)"
              @keydown.enter.prevent="$emit('edit-user', row)"
              @keydown.space.prevent="$emit('edit-user', row)"
            >
              <td class="account__native-table-cell account__native-table-cell--primary">
                <div class="account__table-user">
                  <div class="account__table-primary">{{ row.name }}</div>
                </div>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <div class="account-users__role-cell">
                  <span class="account-users__role-text">{{ formatUserRole(row.role) }}</span>
                </div>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <div class="account-users__phone-cell">{{ row.phone || 'Не указан' }}</div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else description="Пользователи не найдены." />

    <div v-if="pageCount > 1" class="account-users__pagination-wrap">
      <ElPagination
        background
        class="account-users__pagination"
        layout="prev, pager, next"
        :current-page="page"
        :page-size="usersPageSize"
        :total="total"
        @current-change="$emit('page-change', $event)"
      />
    </div>

    <ElDialog
      :model-value="isEditDialogOpen"
      width="760px"
      append-to-body
      align-center
      destroy-on-close
      class="account__dialog account__dialog--user-view"
      title="Просмотр пользователя"
      :close-icon="Close"
      @closed="$emit('closed-edit')"
      @update:model-value="!$event && $emit('close-edit')"
    >
      <div class="account__dialog-form account-users__dialog-form">
        <div class="account-users__dialog-head">
          <div>
            <h4 class="account__panel-title account-users__dialog-title">{{ dialogTitle }}</h4>
          </div>

          <label class="account__field account-users__role-select">
            <span class="account__field-label">Роль</span>
            <ElSelect
              v-model="editForm.role"
              class="account__select"
              popper-class="account__select-popper"
              placeholder="Выберите роль"
              :disabled="isAthleteRecord"
            >
              <ElOption
                v-for="option in roleAssignmentOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </label>
        </div>

        <div class="account-users__summary-grid">
          <article
            v-for="field in activeSummaryFields"
            :key="field.label"
            class="account__profile-item account-users__summary-item"
          >
            <span class="account__profile-label">{{ field.label }}</span>
            <strong class="account__profile-value account-users__summary-value">
              {{ field.value || 'Не указано' }}
            </strong>
          </article>
        </div>

        <section v-if="showDocumentReview" class="account-users__documents-review">
          <div class="account__panel-head account-users__documents-review-head">
            <h4 class="account__panel-title">
              {{ selectedAthlete || isAthleteRecord ? 'Документы спортсмена' : 'Документы пользователя' }}
            </h4>
            <div
              v-if="showActiveDocumentAdmissionAction"
              class="account-users__documents-review-head-actions"
            >
              <ElTag
                v-if="activeDocumentAdmissionStatus.status === 'admitted'"
                :type="activeDocumentAdmissionStatus.tagType"
                effect="light"
                class="account-users__documents-review-admission-tag"
              >
                {{ activeDocumentAdmissionStatus.label }}
              </ElTag>
              <button
                v-else-if="canAdmitActiveDocumentGroup"
                type="button"
                class="account__table-action account__table-action--delete account-users__documents-review-admit btn-reset"
                :disabled="isActiveDocumentAdmissionLoading"
                :aria-busy="isActiveDocumentAdmissionLoading"
                @click="$emit('admit-document-group', activeDocumentReviewGroup)"
              >
                <span
                  v-if="isActiveDocumentAdmissionLoading"
                  class="account__button-spinner"
                  aria-hidden="true"
                ></span>
                Допустить к соревнованиям
              </button>
            </div>
          </div>

          <div class="account-users__documents-review-list">
            <article
              v-for="group in activeDocumentReviewGroups"
              :key="group.id"
              class="account-users__documents-review-group"
            >
              <div class="account-users__documents-review-group-head">
                <strong class="account-users__documents-review-group-title">{{ group.title }}</strong>
                <span class="account-users__documents-review-group-meta">{{ group.meta }}</span>
              </div>

              <div class="account-users__documents-review-items">
                <article
                  v-for="document in group.documents"
                  :key="document.id || `${group.id}-${document.type}`"
                  class="account-users__documents-review-item"
                  :class="`account-users__documents-review-item--${documentState(document)}`"
                >
                  <div class="account-users__documents-review-copy">
                    <div class="account-users__documents-review-title-row">
                      <strong class="account-users__documents-review-title">
                        {{ document.label }}
                      </strong>
                      <ElTag
                        :type="documentStatusTagType(document)"
                        effect="light"
                        round
                        class="account-users__documents-review-tag"
                      >
                        {{ documentStatusLabel(document) }}
                      </ElTag>
                    </div>
                    <span class="account-users__documents-review-hint">
                      {{ documentReviewHint(document) }}
                    </span>
                    <span class="account-users__documents-review-expiry">
                      Срок действия: {{ formatDocumentExpiry(document) }}
                    </span>
                    <span class="account-users__documents-review-file">
                      Файл:
                      <a
                        v-if="getDocumentPreviewUrl(document)"
                        class="account-users__documents-review-link"
                        :href="getDocumentPreviewUrl(document)"
                        :download="document.fileName || document.label"
                      >
                        {{ document.fileName || 'Скачать' }}
                      </a>
                      <span v-else>{{ document.fileName || 'Не загружен' }}</span>
                    </span>
                  </div>

                  <div class="account-users__documents-review-actions">
                    <button
                      type="button"
                      class="account__table-action account__table-action--edit btn-reset"
                      :disabled="!canApproveDocument(document) || isDocumentActionLoading(document, 'verified')"
                      :aria-busy="isDocumentActionLoading(document, 'verified')"
                      @click="$emit('approve-document', document)"
                    >
                      <span
                        v-if="isDocumentActionLoading(document, 'verified')"
                        class="account__button-spinner"
                        aria-hidden="true"
                      ></span>
                      Одобрить
                    </button>
                    <button
                      type="button"
                      class="account__table-action account__table-action--delete btn-reset"
                      :disabled="!canReviewDocument(document) || isDocumentActionLoading(document, 'needs_reupload')"
                      :aria-busy="isDocumentActionLoading(document, 'needs_reupload')"
                      @click="$emit('request-document-reupload', document)"
                    >
                      <span
                        v-if="isDocumentActionLoading(document, 'needs_reupload')"
                        class="account__button-spinner"
                        aria-hidden="true"
                      ></span>
                      Запросить обновление
                    </button>
                  </div>
                </article>

                <p v-if="!group.documents.length" class="account-users__documents-review-empty">
                  Документов на проверку нет.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section v-if="showAthleteList" class="account-users__admission-section">
          <div class="account__panel-head account-users__admission-head">
            <h4 class="account__panel-title">Спортсмены</h4>
          </div>

          <div v-if="viewedAthleteAdmissions.length" class="account-users__admission-list">
            <button
              v-for="athlete in viewedAthleteAdmissions"
              :key="athlete.id"
              type="button"
              class="account-users__admission-item btn-reset"
              @click="selectedAthleteId = athlete.id"
            >
              <div class="account-users__admission-copy">
                <strong class="account-users__admission-name">{{ athlete.fullName }}</strong>
                <span class="account-users__admission-meta">
                  {{ athlete.birthDate || 'Дата рождения не указана' }}
                </span>
              </div>

              <span class="account-users__admission-status" :class="`account-users__admission-status--${athlete.admission.status}`">
                {{ athlete.admission.label }}
              </span>
            </button>
          </div>

          <p v-else class="account-users__admission-empty">
            У этого пользователя пока нет добавленных спортсменов.
          </p>
        </section>

        <div class="account__dialog-actions">
          <button
            v-if="selectedAthlete"
            type="button"
            class="account__table-action account__table-action--ghost btn-reset"
            @click="selectedAthleteId = ''"
          >
            Вернуться к пользователю
          </button>
          <button
            type="button"
            class="account__table-action account__table-action--ghost btn-reset"
            @click="$emit('close-edit')"
          >
            Закрыть
          </button>
          <button
            v-if="!isAthleteRecord"
            type="button"
            class="account__table-action account__table-action--delete btn-reset"
            :disabled="isDeleteSubmitting"
            :aria-busy="isDeleteSubmitting"
            @click="$emit('delete-user', props.editForm)"
          >
            <span v-if="isDeleteSubmitting" class="account__button-spinner" aria-hidden="true"></span>
            Удалить
          </button>
          <button
            v-if="!isAthleteRecord"
            type="button"
            class="account__table-action account__table-action--edit btn-reset"
            :disabled="isEditSubmitting"
            :aria-busy="isEditSubmitting"
            @click="$emit('submit-edit')"
          >
            <span v-if="isEditSubmitting" class="account__button-spinner" aria-hidden="true"></span>
            Сохранить
          </button>
        </div>
      </div>
    </ElDialog>

    <AccountDocumentUploadDialog
      :model-value="documentUploadState.isOpen"
      :document-type="documentUploadState.documentType"
      @close="$emit('close-document-upload')"
      @submit="$emit('submit-document-upload', $event)"
    />

    <ElDialog
      :model-value="isDeleteDialogOpen"
      width="480px"
      append-to-body
      align-center
      destroy-on-close
      class="account__dialog account__dialog--confirm"
      title="Удалить пользователя"
      :close-icon="Close"
      @closed="$emit('close-delete')"
      @update:model-value="!$event && $emit('close-delete')"
    >
      <div class="account__dialog-copy account-users__delete-copy">
        <p class="account__dialog-text account-users__delete-question">
          Удалить пользователя <strong>{{ pendingDeleteUser?.name || 'Без имени' }}</strong
          >?
        </p>
      </div>

      <div class="account__dialog-actions">
        <button
          type="button"
          class="account__table-action account__table-action--ghost btn-reset"
          @click="$emit('close-delete')"
        >
          Отмена
        </button>
        <button
          type="button"
          class="account__table-action account__table-action--delete btn-reset"
          :disabled="isDeleteSubmitting"
          :aria-busy="isDeleteSubmitting"
          @click="$emit('confirm-delete')"
        >
          <span v-if="isDeleteSubmitting" class="account__button-spinner" aria-hidden="true"></span>
          Удалить
        </button>
      </div>
    </ElDialog>
  </ElCard>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'
import { ElCard, ElDialog, ElEmpty, ElOption, ElPagination, ElSelect, ElTag } from 'element-plus'
import AccountDocumentUploadDialog from '@/pages/account/components/documents/AccountDocumentUploadDialog.vue'
import { resolveAccountAdmissionStatus } from '@/pages/account/utils/accountAdmissions'
import { isAccountDocumentExpiryRequired } from '@/pages/account/utils/accountDocumentTypes'
import { USER_ROLE_OPTIONS, USERS_PAGE_SIZE } from '@/pages/account/utils/accountConstants'
import { CRM_ROLE } from '@/utils/crmRoles'
import {
  formatCompactDateTime,
  formatAccountDocumentDate,
  getAccountDocumentDisplayStatus,
  formatUserRole,
  formatUserStatus,
} from '@/pages/account/utils/accountFormatters'

const props = defineProps({
  users: {
    type: Array,
    required: true,
  },
  search: {
    type: String,
    required: true,
  },
  roleFilter: {
    type: String,
    required: true,
  },
  sortKey: {
    type: String,
    required: true,
  },
  sortDirection: {
    type: String,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  page: {
    type: Number,
    required: true,
  },
  pageCount: {
    type: Number,
    required: true,
  },
  isEditDialogOpen: {
    type: Boolean,
    required: true,
  },
  isDeleteDialogOpen: {
    type: Boolean,
    required: true,
  },
  editForm: {
    type: Object,
    required: true,
  },
  pendingDeleteUser: {
    type: Object,
    default: null,
  },
  documentUploadState: {
    type: Object,
    required: true,
  },
  isEditSubmitting: {
    type: Boolean,
    default: false,
  },
  isDeleteSubmitting: {
    type: Boolean,
    default: false,
  },
  documentActionId: {
    type: String,
    default: '',
  },
  admissionActionId: {
    type: String,
    default: '',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

defineEmits([
  'update:search',
  'update:role-filter',
  'page-change',
  'edit-user',
  'delete-user',
  'close-edit',
  'closed-edit',
  'submit-edit',
  'close-delete',
  'confirm-delete',
  'open-document-upload',
  'close-document-upload',
  'submit-document-upload',
  'remove-document',
  'approve-document',
  'request-document-reupload',
  'admit-document-group',
  'toggle-sort',
])

const userRoleOptions = USER_ROLE_OPTIONS
const skeletonRows = Array.from({ length: USERS_PAGE_SIZE }, (_, index) => index + 1)
const roleAssignmentOptions = [
  USER_ROLE_OPTIONS.find((option) => option.value === CRM_ROLE.ADMIN),
  USER_ROLE_OPTIONS.find((option) => option.value === CRM_ROLE.TRAINER),
  USER_ROLE_OPTIONS.find((option) => option.value === CRM_ROLE.USER),
  USER_ROLE_OPTIONS.find((option) => option.value === CRM_ROLE.ATHLETE),
].filter(Boolean)
const usersPageSize = USERS_PAGE_SIZE
const selectedAthleteId = ref('')

function formatValue(value, fallback = 'Не указано') {
  return value ? String(value) : fallback
}

function formatRegisteredAt(value) {
  return value ? formatCompactDateTime(value) : 'Не указана'
}

function formatGender(value) {
  if (value === 'male') {
    return 'Мужской'
  }

  if (value === 'female') {
    return 'Женский'
  }

  return ''
}

function getSortIndicator(columnKey) {
  if (props.sortKey !== columnKey) {
    return 'none'
  }

  return props.sortDirection === 'desc' ? 'desc' : 'asc'
}

function getSortDirection(columnKey) {
  return getSortIndicator(columnKey)
}

function getSortAriaLabel(label, columnKey) {
  if (props.sortKey !== columnKey) {
    return `Сортировать по ${label} по возрастанию`
  }

  if (props.sortDirection === 'asc') {
    return `Сортировать по ${label} по убыванию`
  }

  return `Сбросить сортировку по ${label}`
}

function getOwnerUserKey() {
  if (isAthleteRecord.value) {
    return props.editForm?.ownerUserId || props.editForm?.ownerEmail || 'anonymous'
  }

  return props.editForm?.id || props.editForm?.email || 'anonymous'
}

function createDocumentReviewGroup({
  id,
  title,
  meta,
  documents = [],
  ownerUserKey,
  ownerName = '',
  ownerEmail = '',
  scope = 'profile',
  scopeId = 'profile',
  participantName = '',
  participantBirthDate = '',
  participantClub = '',
  participantKind = 'owner',
}) {
  const normalizedDocuments = Array.isArray(documents) ? documents : []

  return {
    id,
    title,
    meta,
    ownerUserKey,
    ownerName,
    ownerEmail,
    scope,
    scopeId,
    participantName,
    participantBirthDate,
    participantClub,
    participantKind,
    documents: normalizedDocuments,
    statusMeta: resolveAccountAdmissionStatus({
      ownerUserKey,
      scope,
      scopeId,
      documents: normalizedDocuments,
    }),
  }
}

const viewedAthleteAdmissions = computed(() => {
  const ownerUserKey = props.editForm?.id || props.editForm?.email || 'anonymous'
  const athletes = Array.isArray(props.editForm?.athletes) ? props.editForm.athletes : []

  return athletes.map((athlete) => ({
    ...athlete,
    admission: resolveAccountAdmissionStatus({
      ownerUserKey,
      scope: 'athlete',
      scopeId: athlete.id,
      documents: athlete.documents || [],
    }),
  }))
})

const selectedAthlete = computed(() => {
  if (!selectedAthleteId.value) {
    return null
  }

  return viewedAthleteAdmissions.value.find((athlete) => athlete.id === selectedAthleteId.value) || null
})

const isAdminView = computed(() => props.editForm?.role === CRM_ROLE.ADMIN)
const isTrainerView = computed(() => props.editForm?.role === CRM_ROLE.TRAINER)
const isAthleteRecord = computed(() => Boolean(props.editForm?.isAthleteRecord))
const isUserView = computed(() =>
  isAthleteRecord.value || [CRM_ROLE.USER, CRM_ROLE.ATHLETE].includes(props.editForm?.role),
)

const dialogTitle = computed(() => {
  if (selectedAthlete.value) {
    return selectedAthlete.value.fullName || 'Спортсмен без имени'
  }

  return props.editForm?.name || 'Пользователь без имени'
})

const adminSummaryFields = computed(() => [
  { label: 'Имя и фамилия', value: formatValue(props.editForm?.name) },
  { label: 'Почта', value: formatValue(props.editForm?.email, 'Не указана') },
  { label: 'Телефон', value: formatValue(props.editForm?.phone) },
  { label: 'Роль', value: formatUserRole(props.editForm?.role) },
  { label: 'Дата регистрации', value: formatRegisteredAt(props.editForm?.registeredAt) },
])

const trainerSummaryFields = computed(() => [
  ...adminSummaryFields.value,
  { label: 'Дата рождения', value: formatValue(props.editForm?.birthDate, 'Не указана') },
  { label: 'Опыт работы', value: formatValue(props.editForm?.experience) },
  { label: 'Основной профиль', value: formatValue(props.editForm?.mainProfile) },
  { label: 'Свободно мест', value: formatValue(props.editForm?.availableSeats) },
  { label: 'Образование', value: formatValue(props.editForm?.education) },
  { label: 'Спортивные достижения', value: formatValue(props.editForm?.sportAchievements) },
  { label: 'С кем работает', value: formatValue(props.editForm?.worksWith) },
  { label: 'Минимальный возраст', value: formatValue(props.editForm?.minAge) },
  { label: 'Уровень подготовки', value: formatValue(props.editForm?.preparationLevel) },
  { label: 'Метро', value: formatValue(props.editForm?.metro) },
])

const userSummaryFields = computed(() => [
  ...adminSummaryFields.value,
  { label: 'Статус', value: formatUserStatus(props.editForm?.status) },
  { label: 'Дата рождения', value: formatValue(props.editForm?.birthDate, 'Не указана') },
  { label: 'Клуб', value: formatValue(props.editForm?.club) },
])

const standaloneAthleteSummaryFields = computed(() => [
  { label: 'ФИО спортсмена', value: formatValue(props.editForm?.name) },
  { label: 'Роль', value: formatUserRole(props.editForm?.role) },
  { label: 'Владелец ЛК', value: formatValue(props.editForm?.ownerName) },
  { label: 'Почта владельца', value: formatValue(props.editForm?.ownerEmail, 'Не указана') },
  { label: 'Дата рождения', value: formatValue(props.editForm?.birthDate, 'Не указана') },
  { label: 'Пол', value: formatValue(formatGender(props.editForm?.gender)) },
  { label: 'Клуб', value: formatValue(props.editForm?.club) },
  { label: 'Разряд', value: formatValue(props.editForm?.rank) },
  { label: 'Тренер', value: formatValue(props.editForm?.coach) },
])

const athleteSummaryFields = computed(() => {
  const athlete = selectedAthlete.value

  if (!athlete) {
    return []
  }

  return [
    { label: 'ФИО спортсмена', value: formatValue(athlete.fullName) },
    { label: 'Дата рождения', value: formatValue(athlete.birthDate, 'Не указана') },
    { label: 'Пол', value: formatValue(formatGender(athlete.gender)) },
    { label: 'Клуб', value: formatValue(athlete.club) },
    { label: 'Разряд', value: formatValue(athlete.rank) },
    { label: 'Тренер', value: formatValue(athlete.coach) },
    { label: 'Допуск', value: athlete.admission?.label || 'Не указан' },
  ]
})

const activeSummaryFields = computed(() => {
  if (selectedAthlete.value) {
    return athleteSummaryFields.value
  }

  if (isAthleteRecord.value) {
    return standaloneAthleteSummaryFields.value
  }

  if (isTrainerView.value) {
    return trainerSummaryFields.value
  }

  if (isAdminView.value) {
    return adminSummaryFields.value
  }

  return userSummaryFields.value
})

const activeDocumentReviewGroups = computed(() => {
  void props.admissionActionId

  if (isAthleteRecord.value) {
    const ownerUserKey = getOwnerUserKey()
    const athleteId = props.editForm?.athleteId || props.editForm?.id || 'profile'

    return [
      createDocumentReviewGroup({
        id: `athlete-${props.editForm?.athleteId || props.editForm?.id}`,
        title: props.editForm?.name || 'Спортсмен без имени',
        meta: props.editForm?.birthDate || 'Дата рождения не указана',
        ownerUserKey,
        ownerName: props.editForm?.ownerName || '',
        ownerEmail: props.editForm?.ownerEmail || '',
        scope: 'athlete',
        scopeId: athleteId,
        participantName: props.editForm?.name || 'Спортсмен без имени',
        participantBirthDate: props.editForm?.birthDate || '',
        participantClub: props.editForm?.club || '',
        participantKind: 'athlete',
        documents: Array.isArray(props.editForm?.documents) ? props.editForm.documents : [],
      }),
    ]
  }

  if (selectedAthlete.value) {
    const ownerUserKey = getOwnerUserKey()

    return [
      createDocumentReviewGroup({
        id: `athlete-${selectedAthlete.value.id}`,
        title: selectedAthlete.value.fullName || 'Спортсмен без имени',
        meta: selectedAthlete.value.birthDate || 'Дата рождения не указана',
        ownerUserKey,
        ownerName: props.editForm?.name || '',
        ownerEmail: props.editForm?.email || '',
        scope: 'athlete',
        scopeId: selectedAthlete.value.id,
        participantName: selectedAthlete.value.fullName || 'Спортсмен без имени',
        participantBirthDate: selectedAthlete.value.birthDate || '',
        participantClub: selectedAthlete.value.club || '',
        participantKind: 'athlete',
        documents: Array.isArray(selectedAthlete.value.documents) ? selectedAthlete.value.documents : [],
      }),
    ]
  }

  if (!isUserView.value) {
    return []
  }

  const ownerUserKey = getOwnerUserKey()

  return [
    createDocumentReviewGroup({
      id: 'profile',
      title: 'Профиль владельца ЛК',
      meta: props.editForm?.email || 'Основные документы пользователя',
      ownerUserKey,
      ownerName: props.editForm?.name || '',
      ownerEmail: props.editForm?.email || '',
      scope: 'profile',
      scopeId: 'profile',
      participantName: props.editForm?.name || 'Пользователь без имени',
      participantBirthDate: props.editForm?.birthDate || '',
      participantClub: props.editForm?.club || '',
      participantKind: 'owner',
      documents: Array.isArray(props.editForm?.documents) ? props.editForm.documents : [],
    }),
  ]
})

const showDocumentReview = computed(() => activeDocumentReviewGroups.value.length > 0)
const activeDocumentReviewGroup = computed(() => activeDocumentReviewGroups.value[0] || null)
const activeDocumentAdmissionStatus = computed(
  () => activeDocumentReviewGroup.value?.statusMeta || null,
)
const canAdmitActiveDocumentGroup = computed(
  () => activeDocumentAdmissionStatus.value?.status === 'ready',
)
const showActiveDocumentAdmissionAction = computed(
  () => activeDocumentAdmissionStatus.value?.status === 'admitted' || canAdmitActiveDocumentGroup.value,
)
const isActiveDocumentAdmissionLoading = computed(
  () => Boolean(activeDocumentReviewGroup.value?.id && props.admissionActionId === activeDocumentReviewGroup.value.id),
)
const showAthleteList = computed(() =>
  isUserView.value && !isAthleteRecord.value && !selectedAthlete.value,
)

function documentStatusMeta(document) {
  return getAccountDocumentDisplayStatus(document)
}

function documentStatusLabel(document) {
  return documentStatusMeta(document).label
}

function documentState(document) {
  return documentStatusMeta(document).status
}

function documentStatusTagType(document) {
  return documentStatusMeta(document).tagType
}

function getDocumentPreviewUrl(document) {
  return document?.fileDataUrl || document?.fileUrl || ''
}

function canReviewDocument(document) {
  return Boolean(document?.id)
}

function canApproveDocument(document) {
  return Boolean(
    document?.id &&
      (!isAccountDocumentExpiryRequired(document?.type) || document?.expiresAt),
  )
}

function isDocumentActionLoading(document, status) {
  return Boolean(document?.id && props.documentActionId === `${document.id}:${status}`)
}

function formatDocumentExpiry(document) {
  if (!isAccountDocumentExpiryRequired(document?.type)) {
    return 'Не требуется'
  }

  return formatAccountDocumentDate(document?.expiresAt)
}

function documentReviewHint(document) {
  const dateLabel = formatAccountDocumentDate(document?.expiresAt)

  if (isAccountDocumentExpiryRequired(document?.type)) {
    return `Срок обязателен: ${dateLabel}. Без срока меддопуск или страховка не дают допуск.`
  }

  return document?.expiresAt
    ? `Срок указан: ${dateLabel}. Для этого документа срок не обязателен.`
    : 'Срок действия для этого документа не требуется.'
}

watch(
  () => [props.isEditDialogOpen, props.editForm?.id, props.editForm?.role],
  ([isOpen]) => {
    if (!isOpen) {
      return
    }

    selectedAthleteId.value = ''
  },
)
</script>

<style scoped>
.account-users__dialog-form {
  gap: 18px;
}

.account-users__dialog-head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.account-users__dialog-title {
  margin-top: 0;
}

.account-users__role-select {
  width: min(260px, 100%);
  flex: 0 0 260px;
}

.account-users__summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.account-users__summary-item {
  align-content: start;
  min-width: 0;
  background: transparent;
}

.account-users__table-wrap .account__native-table-row,
.account-users__table-wrap .account__native-table-row:nth-child(even),
.account-users__table-wrap .account__native-table-row:nth-child(odd) {
  background: #fff;
}

.account-users__table-wrap .account__native-table-cell {
  background: #fff;
}

.account-users__table-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.account-users__table-row--skeleton {
  cursor: default;
  pointer-events: none;
}

.account-users__table-row:hover,
.account-users__table-row:focus-visible,
.account-users__table-row:hover .account__native-table-cell,
.account-users__table-row:focus-visible .account__native-table-cell {
  background: #f2f5f8;
  outline: none;
}

.account-users__role-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 12px;
}

.account-users__phone-cell {
  font-weight: 800;
  color: #526072;
}

.account-users__skeleton-line {
  display: inline-flex;
  width: 100%;
  height: 14px;
  max-width: 100%;
  overflow: hidden;
  border-radius: 999px;
  background:
    linear-gradient(
      90deg,
      rgb(226 238 246 / 0.78) 0%,
      rgb(247 251 253 / 0.96) 48%,
      rgb(226 238 246 / 0.78) 100%
    );
  background-size: 220% 100%;
  animation: account-users-skeleton 1.2s ease-in-out infinite;
}

.account-users__skeleton-line--name {
  width: min(260px, 72%);
}

.account-users__skeleton-line--role {
  width: min(132px, 80%);
}

.account-users__skeleton-line--phone {
  width: min(150px, 84%);
}

@keyframes account-users-skeleton {
  0% {
    background-position: 120% 0;
  }

  100% {
    background-position: -120% 0;
  }
}

.account-users__delete-copy {
  text-align: left;
}

.account-users__delete-question {
  margin: 0;
  text-align: left;
}

.account-users__role-text {
  font-weight: 800;
  color: var(--black);
}

.account-users__documents-review {
  display: grid;
  gap: 12px;
}

.account-users__documents-review-head {
  align-items: center;
  padding: 0;
}

.account-users__documents-review-head .account__panel-title {
  margin-top: 0;
}

.account-users__documents-review-head-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
}

.account-users__documents-review-admit {
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 10px 16px;
  white-space: nowrap;
  text-transform: none;
}

.account-users__documents-review-admission-tag {
  min-height: 34px;
  align-items: center;
  border-radius: 5px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.account-users__documents-review-list {
  display: grid;
  gap: 12px;
}

.account-users__documents-review-group {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: transparent;
}

.account-users__documents-review-group-head {
  display: flex;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
}

.account-users__documents-review-group-title {
  color: var(--black);
  font-size: 15px;
  font-weight: 900;
  line-height: 1.25;
}

.account-users__documents-review-group-meta {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
  text-align: right;
}

.account-users__documents-review-items {
  display: grid;
  gap: 8px;
}

.account-users__documents-review-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--cyan) 12%, white);
  border-radius: 10px;
  background: transparent;
}

.account-users__documents-review-item--verified {
  border-color: color-mix(in srgb, var(--cyan) 28%, white);
}

.account-users__documents-review-item--attention,
.account-users__documents-review-item--expired,
.account-users__documents-review-item--needs_reupload,
.account-users__documents-review-item--rejected {
  border-color: color-mix(in srgb, var(--orange) 30%, white);
}

.account-users__documents-review-copy {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.account-users__documents-review-title-row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.account-users__documents-review-title {
  min-width: 0;
  color: var(--black);
  font-size: 14px;
  font-weight: 900;
  line-height: 1.25;
}

.account-users__documents-review-tag {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.account-users__documents-review-item--verified .account-users__documents-review-tag {
  border-radius: 5px;
}

.account-users__documents-review-hint,
.account-users__documents-review-expiry,
.account-users__documents-review-file {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
}

.account-users__documents-review-link {
  color: var(--el-color-primary);
  font-weight: 900;
  text-decoration: none;
}

.account-users__documents-review-link:hover {
  text-decoration: underline;
}

.account-users__documents-review-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: min(100%, 320px);
  gap: 8px;
}

.account-users__documents-review-actions > * {
  width: 100%;
}

@media (max-width: 720px) {
  .account-users__documents-review-head {
    align-items: stretch;
    flex-direction: column;
  }

  .account-users__documents-review-head-actions,
  .account-users__documents-review-admit {
    width: 100%;
  }

  .account-users__documents-review-group-head,
  .account-users__documents-review-title-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .account-users__documents-review-group-meta {
    text-align: left;
  }

  .account-users__documents-review-item {
    grid-template-columns: 1fr;
  }

  .account-users__documents-review-actions {
    width: 100%;
  }
}

.account-users__actions-cell {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.account-users__table-wrap {
  margin-bottom: 16px;
}

.account-users__pagination-wrap {
  display: flex;
  justify-content: center;
}

.account-users__pagination :deep(.el-pager li),
.account-users__pagination :deep(.btn-prev),
.account-users__pagination :deep(.btn-next) {
  min-width: 38px;
  height: 38px;
  margin: 0 5px;
  border: 1px solid color-mix(in srgb, var(--cyan) 18%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.88);
  box-shadow: 0 10px 18px rgb(15 23 42 / 0.06);
  color: #526072;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.account-users__pagination :deep(.el-pager li:hover),
.account-users__pagination :deep(.btn-prev:hover),
.account-users__pagination :deep(.btn-next:hover) {
  border-color: color-mix(in srgb, var(--cyan) 42%, white);
  background: color-mix(in srgb, var(--aqua) 12%, white);
  color: var(--black);
}

.account-users__pagination :deep(.el-pager li.is-active) {
  border-color: color-mix(in srgb, var(--orange) 42%, white);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--orange) 18%, white) 0%,
    #fff7ef 100%
  );
  color: var(--black);
  box-shadow: 0 10px 18px rgb(239 120 55 / 0.14);
}

.account-users__pagination :deep(.el-pager li.is-active:hover) {
  border-color: color-mix(in srgb, var(--orange) 52%, white);
}

.account-users__pagination :deep(.btn-prev[disabled]),
.account-users__pagination :deep(.btn-next[disabled]) {
  background: rgb(255 255 255 / 0.7);
  color: #a4afbd;
  box-shadow: none;
}

.account-users__summary-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-users__admission-section {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: transparent;
}

.account-users__admission-head {
  padding: 0;
}

.account-users__admission-list {
  display: grid;
  gap: 10px;
}

.account-users__admission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--cyan) 14%, white);
  border-radius: 10px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.account-users__admission-item:hover,
.account-users__admission-item:focus-visible {
  border-color: color-mix(in srgb, var(--cyan) 38%, white);
  background: rgb(255 255 255 / 0.64);
  box-shadow: 0 10px 18px rgb(15 23 42 / 0.06);
  outline: none;
}

.account-users__admission-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.account-users__admission-name {
  font-size: 14px;
  font-weight: 900;
  color: var(--black);
}

.account-users__admission-meta {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.account-users__admission-status {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.account-users__admission-status--admitted {
  color: #2f8f5b;
}

.account-users__admission-status--ready,
.account-users__admission-status--pending {
  color: #176384;
}

.account-users__admission-status--attention,
.account-users__admission-status--missing {
  color: #d76034;
}

.account-users__admission-empty {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #526072;
}

.account__dialog--user-view :deep(.el-dialog__body) {
  max-height: min(72vh, 760px);
  overflow-y: auto;
}

.account__dialog--user-view :deep(.el-dialog__body)::-webkit-scrollbar {
  width: 12px;
}

.account__dialog--user-view :deep(.el-dialog__body)::-webkit-scrollbar-thumb {
  border: 3px solid transparent;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cyan) 36%, white);
  background-clip: content-box;
}

@media (max-width: 900px) {
  .account-users__dialog-head {
    flex-direction: column;
  }

  .account-users__role-select {
    width: 100%;
    flex-basis: auto;
  }

  .account-users__summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>

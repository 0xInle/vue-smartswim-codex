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
        <ElTag type="primary" effect="light" round>{{ total }} пользователей</ElTag>
      </div>
    </div>

    <div v-if="users.length" class="account__native-table-wrap account-users__table-wrap">
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
            <th>Действия</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in users" :key="row.id" class="account__native-table-row">
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
              <div class="account-users__actions-cell">
                <div class="account__table-actions">
                  <button
                    type="button"
                    class="account__table-action account__table-action--edit btn-reset"
                    @click="$emit('edit-user', row)"
                  >
                    Просмотр
                  </button>
                  <button
                    type="button"
                    class="account__table-action account__table-action--delete btn-reset"
                    @click="$emit('delete-user', row)"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </td>
          </tr>
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
      @closed="$emit('close-edit')"
      @update:model-value="!$event && $emit('close-edit')"
    >
      <div class="account__dialog-form account-users__dialog-form">
        <div class="account-users__summary-grid">
          <article class="account__profile-item account-users__summary-item">
            <span class="account__profile-label">Имя и фамилия</span>
            <strong class="account__profile-value account-users__summary-value">
              {{ editForm.name || 'Не указано' }}
            </strong>
          </article>

          <article class="account__profile-item account-users__summary-item">
            <span class="account__profile-label">Почта</span>
            <strong class="account__profile-value account-users__summary-value">
              {{ editForm.email || 'Не указана' }}
            </strong>
          </article>

          <article class="account__profile-item account-users__summary-item">
            <span class="account__profile-label">Телефон</span>
            <strong class="account__profile-value account-users__summary-value">
              {{ editForm.phone || 'Не указан' }}
            </strong>
          </article>

          <article class="account__profile-item account-users__summary-item">
            <span class="account__profile-label">Роль</span>
            <strong class="account__profile-value account-users__summary-value">
              {{ formatUserRole(editForm.role) }}
            </strong>
          </article>

          <article class="account__profile-item account-users__summary-item">
            <span class="account__profile-label">Статус</span>
            <strong class="account__profile-value account-users__summary-value">
              {{ formatUserStatus(editForm.status) }}
            </strong>
          </article>

          <article class="account__profile-item account-users__summary-item">
            <span class="account__profile-label">Дата регистрации</span>
            <strong class="account__profile-value account-users__summary-value">
              {{
                editForm.registeredAt ? formatCompactDateTime(editForm.registeredAt) : 'Не указана'
              }}
            </strong>
          </article>
        </div>

        <AccountDocumentChecklist
          :documents="editForm.documents"
          :show-header="false"
          embedded
          mode="readonly"
          :show-action-button="false"
        />

        <section class="account-users__admission-section">
          <div class="account__panel-head account-users__admission-head">
            <h4 class="account__panel-title">Спортсмены и допуск</h4>
          </div>

          <div v-if="viewedAthleteAdmissions.length" class="account-users__admission-list">
            <article
              v-for="athlete in viewedAthleteAdmissions"
              :key="athlete.id"
              class="account-users__admission-item"
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
            </article>
          </div>

          <p v-else class="account-users__admission-empty">
            У этого пользователя пока нет добавленных спортсменов.
          </p>
        </section>

        <div class="account__dialog-actions">
          <button
            type="button"
            class="account__table-action account__table-action--ghost btn-reset"
            @click="$emit('close-edit')"
          >
            Закрыть
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
      <div class="account__dialog-copy">
        <p class="account__dialog-text">
          Удалить пользователя <strong>{{ pendingDeleteUser?.name || 'Без имени' }}</strong
          >?
        </p>
        <p class="account__dialog-hint">
          Запись будет удалена из CRM-списка. Учетная запись Supabase Auth не удаляется клиентским интерфейсом.
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
          @click="$emit('confirm-delete')"
        >
          Удалить
        </button>
      </div>
    </ElDialog>
  </ElCard>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { ElCard, ElDialog, ElEmpty, ElOption, ElPagination, ElSelect, ElTag } from 'element-plus'
import AccountDocumentChecklist from '@/pages/account/components/documents/AccountDocumentChecklist.vue'
import AccountDocumentUploadDialog from '@/pages/account/components/documents/AccountDocumentUploadDialog.vue'
import { resolveAccountAdmissionStatus } from '@/pages/account/utils/accountAdmissions'
import { USER_ROLE_OPTIONS, USERS_PAGE_SIZE } from '@/pages/account/utils/accountConstants'
import {
  formatCompactDateTime,
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
})

defineEmits([
  'update:search',
  'update:role-filter',
  'page-change',
  'edit-user',
  'delete-user',
  'close-edit',
  'submit-edit',
  'close-delete',
  'confirm-delete',
  'open-document-upload',
  'close-document-upload',
  'submit-document-upload',
  'remove-document',
  'toggle-sort',
])

const userRoleOptions = USER_ROLE_OPTIONS
const usersPageSize = USERS_PAGE_SIZE

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
</script>

<style scoped>
.account-users__dialog-form {
  gap: 18px;
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

.account-users__role-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 12px;
}

.account-users__role-text {
  font-weight: 800;
  color: var(--black);
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
  background: linear-gradient(180deg, rgb(246 251 255 / 0.96) 0%, rgb(255 255 255 / 0.88) 100%);
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
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--cyan) 14%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.86);
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
  .account-users__summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>

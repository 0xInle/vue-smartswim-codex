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
          placeholder="Имя, почта, телефон, роль"
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

    <ElTable
      class="account__users-table"
      :data="users"
      row-key="id"
      border
      stripe
      empty-text="Пользователи не найдены."
    >
      <ElTableColumn label="Пользователь" min-width="240">
        <template #default="{ row }">
          <div class="account__table-user">
            <div class="account__table-primary">{{ row.name }}</div>
            <div class="account__table-secondary">{{ row.email }}</div>
          </div>
        </template>
      </ElTableColumn>

      <ElTableColumn prop="phone" label="Телефон" min-width="180" />

      <ElTableColumn label="Роль" min-width="180" align="center">
        <template #default="{ row }">
          <ElTag class="account__user-role-tag" :type="userRoleTagType(row.role)" effect="light" round>
            {{ formatUserRole(row.role) }}
          </ElTag>
        </template>
      </ElTableColumn>

      <ElTableColumn label="Статус" width="170" align="center">
        <template #default="{ row }">
          <ElTag :type="userStatusTagType(row.status)" effect="light" round>
            {{ formatUserStatus(row.status) }}
          </ElTag>
        </template>
      </ElTableColumn>

      <ElTableColumn label="Регистрация" min-width="140" align="center">
        <template #default="{ row }">
          {{ formatCompactDateTime(row.registeredAt) }}
        </template>
      </ElTableColumn>

      <ElTableColumn label="Действия" width="280" align="center">
        <template #default="{ row }">
          <div class="account__table-actions">
            <button
              type="button"
              class="account__table-action account__table-action--edit btn-reset"
              @click="$emit('edit-user', row)"
            >
              Редактировать
            </button>
            <button
              type="button"
              class="account__table-action account__table-action--delete btn-reset"
              @click="$emit('delete-user', row)"
            >
              Удалить
            </button>
          </div>
        </template>
      </ElTableColumn>
    </ElTable>

    <div v-if="pageCount > 1" class="account__pagination-wrap">
      <ElPagination
        background
        layout="prev, pager, next"
        :current-page="page"
        :page-size="usersPageSize"
        :total="total"
        @current-change="$emit('page-change', $event)"
      />
    </div>

    <ElDialog
      :model-value="isEditDialogOpen"
      width="520px"
      destroy-on-close
      class="account__dialog"
      title="Редактирование пользователя"
      @closed="$emit('close-edit')"
      @update:model-value="!$event && $emit('close-edit')"
    >
      <form class="account__dialog-form" @submit.prevent="$emit('submit-edit')">
        <label class="account__field">
          <span class="account__field-label">Имя и фамилия</span>
          <input
            v-model.trim="editForm.name"
            class="account__input"
            type="text"
            name="user-name"
            placeholder="Введите имя пользователя"
          />
        </label>

        <label class="account__field">
          <span class="account__field-label">Почта</span>
          <input
            v-model.trim="editForm.email"
            class="account__input"
            type="email"
            name="user-email"
            placeholder="example@mail.ru"
          />
        </label>

        <label class="account__field">
          <span class="account__field-label">Телефон</span>
          <input
            v-model.trim="editForm.phone"
            class="account__input"
            type="text"
            name="user-phone"
            placeholder="+7 (999) 000-00-00"
          />
        </label>

        <div class="account__field-grid">
          <label class="account__field">
            <span class="account__field-label">Роль</span>
            <ElSelect
              v-model="editForm.role"
              class="account__select"
              popper-class="account__select-popper"
              placeholder="Выберите роль"
            >
              <ElOption
                v-for="option in userRoleOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </label>

          <label class="account__field">
            <span class="account__field-label">Статус</span>
            <ElSelect
              v-model="editForm.status"
              class="account__select"
              popper-class="account__select-popper"
              placeholder="Выберите статус"
            >
              <ElOption
                v-for="option in userStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </label>
        </div>

        <div class="account__dialog-actions">
          <button
            type="button"
            class="account__table-action account__table-action--ghost btn-reset"
            @click="$emit('close-edit')"
          >
            Отмена
          </button>
          <button type="submit" class="account__submit btn-reset">Сохранить</button>
        </div>
      </form>
    </ElDialog>

    <ElDialog
      :model-value="isDeleteDialogOpen"
      width="420px"
      destroy-on-close
      class="account__dialog"
      title="Удалить пользователя"
      @closed="$emit('close-delete')"
      @update:model-value="!$event && $emit('close-delete')"
    >
      <div class="account__dialog-copy">
        <p class="account__dialog-text">
          Удалить пользователя <strong>{{ pendingDeleteUser?.name || 'Без имени' }}</strong
          >?
        </p>
        <p class="account__dialog-hint">
          Запись исчезнет из текущего мокового списка сразу после подтверждения.
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
import {
  ElCard,
  ElDialog,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import {
  USER_ROLE_OPTIONS,
  USERS_PAGE_SIZE,
  USER_STATUS_OPTIONS,
} from '@/pages/account/utils/accountConstants'
import {
  formatCompactDateTime,
  formatUserRole,
  formatUserStatus,
  userRoleTagType,
  userStatusTagType,
} from '@/pages/account/utils/accountFormatters'

defineProps({
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
])

const userRoleOptions = USER_ROLE_OPTIONS
const userStatusOptions = USER_STATUS_OPTIONS
const usersPageSize = USERS_PAGE_SIZE
</script>

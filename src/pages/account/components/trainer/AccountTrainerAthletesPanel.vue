<template>
  <ElCard class="account__panel account-trainer-athletes" shadow="never">
    <div class="account-trainer-athletes__header">
      <div class="account-trainer-athletes__filters">
        <label class="account__field account__field--search">
          <span class="account__field-label">Поиск</span>
          <input
            v-model.trim="search"
            class="account__input account__input--toolbar"
            type="search"
            name="trainer-athletes-search"
            placeholder="Поиск по ФИО"
          />
        </label>

        <div class="account-trainer-athletes__meta">
          <ElButton class="account__refresh-button" plain type="primary" @click="refresh">
            Обновить
          </ElButton>
        </div>
      </div>
    </div>

    <div v-if="filteredGroups.length" class="account__native-table-wrap">
      <table class="account__native-table account__native-table--trainer-athletes">
        <thead class="account__native-table-head">
          <tr>
            <th class="account__native-table-head-cell--sortable">
              <button
                type="button"
                class="account__table-sort-button account__table-sort-button--left btn-reset"
                :class="{ 'account__table-sort-button--active': sortKey === 'fullName' }"
                :aria-label="getSortAriaLabel('ФИО', 'fullName')"
                @click="toggleSort('fullName')"
              >
                <span>ФИО</span>
                <span
                  class="account__table-sort-indicator"
                  :data-direction="getSortDirection('fullName')"
                  aria-hidden="true"
                ></span>
              </button>
            </th>
            <th>Телефон</th>
            <th>Действие</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="group in sortedGroups" :key="group.id" class="account__native-table-row">
            <td class="account__native-table-cell account__native-table-cell--primary">
              <div class="account__table-user">
                <div class="account__table-primary">
                  {{ group.participantName || group.ownerName || 'Не указан' }}
                </div>
              </div>
            </td>

            <td class="account__native-table-cell account__native-table-cell--center">
              {{ group.ownerPhone || 'Не указан' }}
            </td>

            <td class="account__native-table-cell account__native-table-cell--center">
              <button
                type="button"
                class="account__table-action account__table-action--edit btn-reset"
                @click="openGroup(group)"
              >
                Подробнее
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else description="Заявки спортсменов не найдены." />

    <ElDialog
      :model-value="groupDialogState.isOpen"
      width="920px"
      append-to-body
      align-center
      destroy-on-close
      class="account__dialog"
      title="Детали спортсмена"
      :close-icon="Close"
      @closed="closeGroupDialog"
      @update:model-value="!$event && closeGroupDialog()"
    >
      <div v-if="selectedGroup" class="account-trainer-athletes__dialog-view">
        <div class="account-trainer-athletes__dialog-grid">
          <section class="account-trainer-athletes__dialog-section account-trainer-athletes__dialog-section--wide">
            <div class="account-trainer-athletes__dialog-summary">
              <div class="account-trainer-athletes__dialog-summary-copy">
                <strong class="account-trainer-athletes__dialog-value">
                  {{ selectedGroup.participantName || selectedGroup.ownerName || 'Не указан' }}
                </strong>
                <span class="account-trainer-athletes__dialog-meta">
                  {{ selectedGroup.statusMeta.label }}
                </span>
              </div>
              <ElTag :type="selectedGroup.statusMeta.tagType" effect="light" round>
                {{ selectedGroup.statusMeta.label }}
              </ElTag>
            </div>

            <div class="account-trainer-athletes__dialog-facts">
              <span class="account-trainer-athletes__dialog-fact">
                Телефон: {{ selectedGroup.ownerPhone || 'Не указан' }}
              </span>
              <span class="account-trainer-athletes__dialog-fact">
                Email: {{ selectedGroup.ownerEmail || 'Не указан' }}
              </span>
              <span class="account-trainer-athletes__dialog-fact">
                Дата рождения:
                {{ selectedGroup.participantBirthDate || 'Не указана' }}
              </span>
              <span class="account-trainer-athletes__dialog-fact">
                Клуб: {{ selectedGroup.participantClub || 'Не указан' }}
              </span>
              <span class="account-trainer-athletes__dialog-fact">
                Заявка создана:
                {{ formatCompactDateTime(selectedGroup.statusMeta.createdAt) }}
              </span>
              <span class="account-trainer-athletes__dialog-fact">
                Обновлено:
                {{ formatCompactDateTime(selectedGroup.statusMeta.updatedAt) }}
              </span>
            </div>
          </section>
        </div>

        <div class="account__dialog-actions">
          <button
            type="button"
            class="account__table-action account__table-action--ghost btn-reset"
            @click="closeGroupDialog"
          >
            Отмена
          </button>
        </div>
      </div>
    </ElDialog>
  </ElCard>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { computed, reactive, ref, toRef, watch } from 'vue'
import { ElButton, ElCard, ElDialog, ElEmpty, ElTag } from 'element-plus'
import { useTriStateTextSort } from '@/pages/account/composables/useTriStateTextSort'
import { useAccountDocumentReviews } from '@/pages/account/composables/useAccountDocumentReviews'
import { formatCompactDateTime } from '@/pages/account/utils/accountFormatters'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
})

const { groupedRows, refresh } = useAccountDocumentReviews({
  currentUser: toRef(props, 'currentUser'),
})

const search = ref('')
const { sortKey, toggleSort, getSortState, sortItems } = useTriStateTextSort('fullName')

const groupDialogState = reactive({
  isOpen: false,
  selectedGroupId: '',
})

const athleteGroups = computed(() =>
  groupedRows.value
    .filter((group) => group.participantKind === 'athlete')
    .map((group) => ({
      ...group,
    })),
)

const filteredGroups = computed(() => {
  const normalizedSearch = normalizeSearchValue(search.value)

  return athleteGroups.value
    .filter((group) => {
      if (!normalizedSearch) {
        return true
      }

      const haystack = [
        group.ownerName,
        group.participantName,
        group.statusMeta.label,
        group.statusMeta.note,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
    .sort((left, right) => {
      const leftTime = Date.parse(left?.statusMeta?.createdAt || left?.statusMeta?.updatedAt || 0) || 0
      const rightTime = Date.parse(right?.statusMeta?.createdAt || right?.statusMeta?.updatedAt || 0) || 0

      return rightTime - leftTime
    })
})

const sortedGroups = computed(() => {
  return sortItems(filteredGroups.value, {
    fullName: (group) => getGroupFullName(group),
  })
})

const selectedGroup = computed(
  () => athleteGroups.value.find((group) => group.id === groupDialogState.selectedGroupId) || null,
)

function normalizeSearchValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function getGroupFullName(group) {
  return group?.participantName || group?.ownerName || ''
}

function getSortDirection(columnKey) {
  const state = getSortState(columnKey)

  if (!state.isActive) {
    return 'none'
  }

  return state.direction === 'desc' ? 'desc' : 'asc'
}

function getSortAriaLabel(label, columnKey) {
  const state = getSortState(columnKey)

  if (!state.isActive) {
    return `Сортировать по ${label} по возрастанию`
  }

  if (state.direction === 'asc') {
    return `Сортировать по ${label} по убыванию`
  }

  return `Сбросить сортировку по ${label}`
}

function openGroup(group) {
  if (!group) {
    return
  }
  groupDialogState.isOpen = true
  groupDialogState.selectedGroupId = group.id
}

function closeGroupDialog() {
  groupDialogState.isOpen = false
  groupDialogState.selectedGroupId = ''
}

watch(
  () => props.currentUser,
  () => {
    refresh()
  },
  { immediate: true },
)
</script>

<style scoped>
.account-trainer-athletes__header {
  display: grid;
  gap: 18px;
  margin-bottom: 16px;
}

.account-trainer-athletes__filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.account-trainer-athletes__meta {
  display: flex;
  justify-content: flex-end;
}

.account__native-table-head th:not(:first-child),
.account__native-table-cell--center {
  text-align: center;
}

.account__native-table-cell--primary {
  text-align: left;
}

.account-trainer-athletes__dialog-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.9fr);
  gap: 16px;
}

.account-trainer-athletes__dialog-section {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--cyan) 18%, white);
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 82%);
}

.account-trainer-athletes__dialog-section--wide {
  grid-column: 1 / -1;
}

.account-trainer-athletes__dialog-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account-trainer-athletes__dialog-summary-copy {
  display: grid;
  gap: 4px;
}

.account-trainer-athletes__dialog-value {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.15;
  color: var(--black);
}

.account-trainer-athletes__dialog-meta {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  color: #66758d;
}

.account-trainer-athletes__dialog-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
}

.account-trainer-athletes__dialog-fact {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  color: #5b6a7f;
}

.account-trainer-athletes__dialog-view {
  display: grid;
  gap: 16px;
}

@media (max-width: 1120px) {
  .account-trainer-athletes__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .account-trainer-athletes__dialog-grid {
    grid-template-columns: 1fr;
  }

  .account-trainer-athletes__dialog-section--wide {
    grid-column: auto;
  }
}

@media (max-width: 640px) {
  .account-trainer-athletes__filters {
    grid-template-columns: 1fr;
  }

  .account-trainer-athletes__meta {
    justify-content: flex-start;
  }

  .account-trainer-athletes__dialog-facts {
    grid-template-columns: 1fr;
  }

  .account-trainer-athletes__dialog-summary {
    flex-direction: column;
  }
}
</style>

<template>
  <ElCard class="account__panel account-competition-registrations-admin" shadow="never">
    <div class="account-competition-registrations-admin__header">
      <div class="account__panel-head">
        <div class="account__panel-actions">
          <ElTag type="primary" effect="light" round>{{ summary.total }} заявок</ElTag>
          <ElTag type="success" effect="light" round>{{ summary.active }} активных на странице</ElTag>
          <ElTag type="danger" effect="light" round>{{ summary.withdrawn }} снятых на странице</ElTag>
          <ElTag type="warning" effect="light" round>{{ summary.refunds }} возвратов на странице</ElTag>
        </div>
      </div>

      <div class="account-competition-registrations-admin__filters">
        <div class="account-competition-registrations-admin__filter-row">
          <label class="account__field account__field--search account-competition-registrations-admin__search-field">
            <span class="account__field-label">Поиск</span>
            <input
              v-model.trim="search"
              class="account__input account__input--toolbar"
              type="search"
              name="competition-registrations-search"
              placeholder="ФИО, соревнование, владелец"
            />
          </label>

          <label class="account__field account__field--filter">
            <span class="account__field-label">Статус</span>
            <ElSelect
              v-model="statusFilter"
              class="account__select"
              popper-class="account__select-popper"
              placeholder="Все статусы"
            >
              <ElOption label="Все статусы" value="all" />
              <ElOption
                v-for="option in registrationStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </label>

          <label class="account__field account__field--filter">
            <span class="account__field-label">Оплата</span>
            <ElSelect
              v-model="paymentStatusFilter"
              class="account__select"
              popper-class="account__select-popper"
              placeholder="Все оплаты"
            >
              <ElOption
                v-for="option in paymentStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </label>
        </div>
      </div>
    </div>

    <section
      v-if="activeRefundRequests.length"
      class="account-competition-registrations-admin__refunds"
      aria-label="Запросы возврата"
    >
      <div class="account-competition-registrations-admin__refunds-head">
        <h3 class="account__panel-title">Запросы возврата</h3>
        <span class="account-competition-registrations-admin__refunds-note">
          Реальная операция в ЮKassa не выполняется. Статус фиксируется в Smart Swim для проверки процесса.
        </span>
      </div>

      <div class="account-competition-registrations-admin__refund-list">
        <article
          v-for="item in activeRefundRequests"
          :key="item.refund.id"
          class="account-competition-registrations-admin__refund-card"
        >
          <div>
            <strong class="account-competition-registrations-admin__refund-title">
              {{ item.registration?.participantName || 'Участник не найден' }}
            </strong>
            <span class="account-competition-registrations-admin__refund-meta">
              {{ item.registration?.competitionName || 'Соревнование не указано' }}
            </span>
          </div>
          <ElTag :type="getRefundStatusTagType(item.refund)" effect="light" round>
            {{ getRefundStatusLabel(item.refund) }}
          </ElTag>
          <div class="account-competition-registrations-admin__refund-actions">
            <button
              type="button"
              class="account__table-action account__table-action--success btn-reset"
              :disabled="isRefundActionLoading(item.refund.id)"
              :aria-busy="isRefundActionLoading(item.refund.id, refundSucceededStatus)"
              @click="handleResolveRefundWithLoading(item.refund.id, refundSucceededStatus)"
            >
              <span
                v-if="isRefundActionLoading(item.refund.id, refundSucceededStatus)"
                class="account__button-spinner"
                aria-hidden="true"
              ></span>
              <span :class="{ 'account__button-label--loading': isRefundActionLoading(item.refund.id, refundSucceededStatus) }">Выполнен</span>
            </button>
            <button
              type="button"
              class="account__table-action account__table-action--delete btn-reset"
              :disabled="isRefundActionLoading(item.refund.id)"
              :aria-busy="isRefundActionLoading(item.refund.id, refundRejectedStatus)"
              @click="handleResolveRefundWithLoading(item.refund.id, refundRejectedStatus)"
            >
              <span
                v-if="isRefundActionLoading(item.refund.id, refundRejectedStatus)"
                class="account__button-spinner"
                aria-hidden="true"
              ></span>
              <span :class="{ 'account__button-label--loading': isRefundActionLoading(item.refund.id, refundRejectedStatus) }">Отклонить</span>
            </button>
          </div>
        </article>
      </div>
    </section>

    <div
      v-if="registrationsError"
      class="account-competition-registrations-admin__notice account-competition-registrations-admin__notice--error"
    >
      {{ registrationsError }}
    </div>

    <div
      v-else-if="showSkeleton"
      class="account-competition-registrations-admin__skeleton"
      aria-busy="true"
    >
      <div class="account__native-table-wrap account-competition-registrations-admin__table-wrap">
        <table class="account__native-table account__native-table--competition-admin-registrations">
          <thead class="account__native-table-head">
            <tr>
              <th>ФИО</th>
              <th>Соревнование</th>
              <th>Статус</th>
              <th>Оплата</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="index in 4"
              :key="`competition-admin-registration-skeleton-${index}`"
              class="account__native-table-row account-competition-registrations-admin__table-row--skeleton"
            >
              <td class="account__native-table-cell">
                <span class="account-competition-registrations-admin__skeleton-line account-competition-registrations-admin__skeleton-line--title"></span>
              </td>
              <td class="account__native-table-cell">
                <span class="account-competition-registrations-admin__skeleton-line account-competition-registrations-admin__skeleton-line--wide"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-competition-registrations-admin__skeleton-line account-competition-registrations-admin__skeleton-line--status"></span>
              </td>
              <td class="account__native-table-cell account__native-table-cell--center">
                <span class="account-competition-registrations-admin__skeleton-line account-competition-registrations-admin__skeleton-line--status"></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="filteredRegistrations.length" class="account__native-table-wrap account-competition-registrations-admin__table-wrap">
      <table class="account__native-table account__native-table--competition-admin-registrations">
        <thead class="account__native-table-head">
          <tr>
            <th class="account__native-table-head-cell--sortable">
              <button
                type="button"
                class="account__table-sort-button account__table-sort-button--left btn-reset"
                :class="{ 'account__table-sort-button--active': sortKey === 'participantName' }"
                :aria-label="getSortAriaLabel('ФИО', 'participantName')"
                @click="toggleSort('participantName')"
              >
                <span>ФИО</span>
                <span
                  class="account__table-sort-indicator"
                  :data-direction="getSortDirection('participantName')"
                  aria-hidden="true"
                ></span>
              </button>
            </th>
            <th class="account__native-table-head-cell--sortable">
              <button
                type="button"
                class="account__table-sort-button account__table-sort-button--left btn-reset"
                :class="{ 'account__table-sort-button--active': sortKey === 'competitionDate' }"
                :aria-label="getSortAriaLabel('дате соревнования', 'competitionDate')"
                @click="toggleSort('competitionDate')"
              >
                <span>Соревнование</span>
                <span
                  class="account__table-sort-indicator"
                  :data-direction="getSortDirection('competitionDate')"
                  aria-hidden="true"
                ></span>
              </button>
            </th>
            <th>Статус</th>
            <th>Оплата</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="registration in sortedRegistrations"
            :key="registration.id"
            class="account__native-table-row account-competition-registrations-admin__table-row"
            :class="`account-competition-registrations-admin__row--${registration.status}`"
            tabindex="0"
            role="button"
            @click="openDetailsDialog(registration)"
            @keydown.enter.prevent="openDetailsDialog(registration)"
            @keydown.space.prevent="openDetailsDialog(registration)"
          >
            <td class="account__native-table-cell">
              <span class="account__table-primary account-competition-registrations-admin__nowrap">
                {{ registration.participantName || 'Без имени' }}
              </span>
            </td>
            <td class="account__native-table-cell">
              <span class="account__table-primary account-competition-registrations-admin__nowrap">
                {{ registration.competitionName || 'Соревнование не указано' }}
              </span>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <ElTag
                class="account-competition-registrations-admin__status-tag"
                :type="competitionRegistrationRecordStatusType(registration.status)"
                effect="light"
                round
              >
                {{ formatCompetitionRegistrationRecordStatus(registration.status) }}
              </ElTag>
            </td>
            <td class="account__native-table-cell account__native-table-cell--center">
              <ElTag
                class="account-competition-registrations-admin__status-tag"
                :type="getRegistrationPaymentSummary(registration).tagType"
                effect="light"
                round
              >
                {{ getRegistrationPaymentSummary(registration).label }}
              </ElTag>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ElEmpty v-else description="Заявки не найдены." />

    <div v-if="registrationsPageCount > 1" class="account__pagination-wrap">
      <ElPagination
        background
        class="account-competition-registrations-admin__pagination"
        layout="prev, pager, next"
        :current-page="registrationsPage"
        :page-size="registrationsPageSize"
        :total="registrationsTotal"
        @current-change="handleRegistrationsPageChange"
      />
    </div>

    <AccountCompetitionRegistrationDetailsDialog
      :model-value="isDetailsDialogOpen"
      :registration="selectedRegistration"
      :stage-options="stageOptions"
      :can-edit-stage="false"
      :can-edit-registration-kind="false"
      :can-edit-status="true"
      :show-save-button="true"
      :show-withdraw-button="false"
      :status-options="selectedRegistrationStatusOptions"
      :status-tag-type="
        selectedRegistration
          ? competitionRegistrationRecordStatusType(selectedRegistration.status)
          : 'info'
      "
      :status-label="
        selectedRegistration
          ? formatCompetitionRegistrationRecordStatus(selectedRegistration.status)
          : ''
      "
      :lifecycle-label="selectedRegistrationLifecycleSummary?.label || ''"
      :lifecycle-description="selectedRegistrationLifecycleSummary?.description || ''"
      :lifecycle-next-action="selectedRegistrationLifecycleSummary?.nextAction || ''"
      :lifecycle-responsible-label="selectedRegistrationLifecycleSummary?.responsibleLabel || ''"
      :lifecycle-blocks-admission="Boolean(selectedRegistrationLifecycleSummary?.blocksAdmission)"
      :documents-status-tag-type="selectedRegistrationDocumentsStatus?.tagType || 'info'"
      :documents-status-label="selectedRegistrationDocumentsStatus?.label || ''"
      :documents-status-description="selectedRegistrationDocumentsStatus?.description || ''"
      :payment-status-tag-type="selectedRegistrationPaymentSummary?.tagType || 'info'"
      :payment-status-label="selectedRegistrationPaymentSummary?.label || 'Не требуется'"
      :payment-status-description="selectedRegistrationPaymentSummary?.description || ''"
      payment-mvp-notice="Реальная операция в ЮKassa не выполняется. Статус фиксируется в Smart Swim для проверки процесса."
      :show-mark-payment-succeeded-button="selectedRegistrationCanMarkPayment"
      :show-mark-payment-failed-button="selectedRegistrationCanMarkPayment"
      :show-resolve-refund-succeeded-button="selectedRegistrationCanResolveRefund"
      :show-resolve-refund-rejected-button="selectedRegistrationCanResolveRefund"
      :show-admit-button="selectedRegistrationCanAdmit"
      :action-loading="detailsActionLoading"
      show-account-link
      admit-button-label="Допустить"
      @close="closeDetailsDialog"
      @save="handleDetailsSave"
      @mark-payment-succeeded="handleMarkSelectedPaymentSucceeded"
      @mark-payment-failed="handleMarkSelectedPaymentFailed"
      @resolve-refund-succeeded="handleResolveSelectedRefund(refundSucceededStatus)"
      @resolve-refund-rejected="handleResolveSelectedRefund(refundRejectedStatus)"
      @admit="handleAdmitSelectedRegistrationWithLoading"
      @open-account="handleOpenSelectedAccount"
    />
  </ElCard>
</template>

<script setup>
import { ElCard, ElEmpty, ElOption, ElPagination, ElSelect, ElTag } from 'element-plus'
import { computed, ref, watch } from 'vue'
import {
  COMPETITION_REGISTRATIONS_PAGE_SIZE,
  COMPETITION_REGISTRATION_RECORD_STATUS_OPTIONS,
} from '@/pages/account/utils/accountConstants'
import { useAccountCompetitionRegistrationsAdmin } from '@/pages/account/composables/useAccountCompetitionRegistrationsAdmin'
import { useTriStateTextSort } from '@/pages/account/composables/useTriStateTextSort'
import AccountCompetitionRegistrationDetailsDialog from '@/pages/account/components/competition-registrations/AccountCompetitionRegistrationDetailsDialog.vue'
import {
  COMPETITION_PAYMENT_STATUS_OPTIONS,
  COMPETITION_REFUND_STATUS,
  getCompetitionRefundStatusMeta,
  getPaymentSortRank,
} from '@/domains/payments/paymentLifecycle'

const emit = defineEmits(['open-account'])

const {
  search,
  statusFilter,
  paymentStatusFilter,
  registrationsTotal,
  registrationsPage,
  registrationsPageCount,
  filteredRegistrations,
  summary,
  activeRefundRequests,
  isRegistrationsLoading,
  registrationsError,
  stageOptions,
  selectedRegistration,
  isDetailsDialogOpen,
  openDetailsDialog,
  closeDetailsDialog,
  selectedRegistrationDocumentsStatus,
  selectedRegistrationStatusOptions,
  getRegistrationPayment,
  getRegistrationRefund,
  getRegistrationPaymentSummary,
  getRegistrationCompetitionDateSortValue,
  handleMarkPaymentSucceeded,
  handleMarkPaymentFailed,
  handleResolveRefund,
  handleAdmitSelectedRegistration,
  competitionRegistrationRecordStatusType,
  formatCompetitionRegistrationRecordStatus,
  handleRegistrationSave,
  handleRegistrationsPageChange,
} = useAccountCompetitionRegistrationsAdmin()

const registrationStatusOptions = COMPETITION_REGISTRATION_RECORD_STATUS_OPTIONS
const paymentStatusOptions = COMPETITION_PAYMENT_STATUS_OPTIONS
const refundSucceededStatus = COMPETITION_REFUND_STATUS.SUCCEEDED
const refundRejectedStatus = COMPETITION_REFUND_STATUS.REJECTED
const registrationsPageSize = COMPETITION_REGISTRATIONS_PAGE_SIZE
const detailsActionLoading = ref('')
const hasLoadedRegistrations = ref(false)
const { sortKey, toggleSort, getSortState, sortItems } =
  useTriStateTextSort('participantName')
const showSkeleton = computed(
  () => isRegistrationsLoading.value && !hasLoadedRegistrations.value,
)

const selectedRegistrationPaymentSummary = computed(() =>
  selectedRegistration.value ? getRegistrationPaymentSummary(selectedRegistration.value) : null,
)

const selectedRegistrationCanMarkPayment = computed(() => {
  const payment = getRegistrationPayment(selectedRegistration.value)

  return Boolean(payment && ['pending', 'provider_unavailable'].includes(payment.status))
})

const selectedRegistrationCanResolveRefund = computed(() => {
  const refund = getRegistrationRefund(selectedRegistration.value)

  return Boolean(refund && ['requested', 'processing'].includes(refund.status))
})

const selectedRegistrationCanAdmit = computed(() => {
  const paymentSummary = selectedRegistration.value
    ? getRegistrationPaymentSummary(selectedRegistration.value)
    : null
  const refund = getRegistrationRefund(selectedRegistration.value)

  return Boolean(
    selectedRegistration.value?.status === 'paid' &&
      selectedRegistrationDocumentsStatus.value?.status === 'admitted' &&
      paymentSummary?.applicationStatus === 'paid' &&
      !(refund && ['requested', 'processing'].includes(refund.status)),
  )
})

const sortedRegistrations = computed(() =>
  sortItems(filteredRegistrations.value, {
    participantName: (registration) => registration.participantName || '',
    competitionDate: (registration) =>
      [getRegistrationCompetitionDateSortValue(registration), registration.competitionName || ''].join(' '),
    paymentStatus: (registration) => {
      const summary = getRegistrationPaymentSummary(registration)

      return `${getPaymentSortRank(summary.applicationStatus)} ${summary.label}`
    },
  }),
)

function getRefundStatusLabel(refund) {
  return getCompetitionRefundStatusMeta(refund?.status).label
}

function getRefundStatusTagType(refund) {
  return getCompetitionRefundStatusMeta(refund?.status).tagType
}

async function runDetailsAction(action, callback) {
  if (detailsActionLoading.value) {
    return
  }

  detailsActionLoading.value = action

  try {
    await callback()
  } finally {
    detailsActionLoading.value = ''
  }
}

function getRefundActionKey(refundId, status) {
  return `refund:${refundId}:${status}`
}

function isRefundActionLoading(refundId, status = '') {
  const prefix = `refund:${refundId}:`

  if (!detailsActionLoading.value.startsWith(prefix)) {
    return false
  }

  return status ? detailsActionLoading.value === getRefundActionKey(refundId, status) : true
}

async function handleResolveRefundWithLoading(refundId, status) {
  await runDetailsAction(getRefundActionKey(refundId, status), () =>
    handleResolveRefund(refundId, status),
  )
}

async function handleDetailsSave(payload) {
  await runDetailsAction('save', () => handleRegistrationSave(payload))
}

async function handleMarkSelectedPaymentSucceeded() {
  if (!selectedRegistration.value?.id) {
    return
  }

  await runDetailsAction('mark-payment-succeeded', () =>
    handleMarkPaymentSucceeded(selectedRegistration.value.id),
  )
}

async function handleMarkSelectedPaymentFailed() {
  if (!selectedRegistration.value?.id) {
    return
  }

  await runDetailsAction('mark-payment-failed', () =>
    handleMarkPaymentFailed(selectedRegistration.value.id),
  )
}

async function handleResolveSelectedRefund(status) {
  const refund = getRegistrationRefund(selectedRegistration.value)

  if (!refund?.id) {
    return
  }

  const action =
    status === refundSucceededStatus ? 'resolve-refund-succeeded' : 'resolve-refund-rejected'

  await runDetailsAction(action, () => handleResolveRefund(refund.id, status))
}

async function handleAdmitSelectedRegistrationWithLoading() {
  await runDetailsAction('admit', () => handleAdmitSelectedRegistration())
}

function handleOpenSelectedAccount(accountKey) {
  emit('open-account', accountKey)
}

function getSortIndicator(columnKey) {
  const state = getSortState(columnKey)

  if (!state.isActive) {
    return 'none'
  }

  return state.direction === 'desc' ? 'desc' : 'asc'
}

function getSortDirection(columnKey) {
  return getSortIndicator(columnKey)
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

watch(
  () => isRegistrationsLoading.value,
  (loading) => {
    if (!loading) {
      hasLoadedRegistrations.value = true
    }
  },
)
</script>

<style scoped>
.account-competition-registrations-admin__header {
  display: grid;
  gap: 18px;
  padding: 0 0 18px;
  border-bottom: 1px solid color-mix(in srgb, var(--aqua) 14%, transparent);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(247, 250, 255, 0.72));
}

.account-competition-registrations-admin__header .account__panel-actions {
  margin-left: auto;
}

.account-competition-registrations-admin__filters {
  display: grid;
  gap: 12px;
  align-items: end;
}

.account-competition-registrations-admin__filters .account__field {
  min-width: 0;
}

.account-competition-registrations-admin__filter-row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: end;
}

.account-competition-registrations-admin__search-field {
  min-width: 0;
}

.account-competition-registrations-admin__row--withdrawn {
  background: transparent;
}

.account-competition-registrations-admin__row--withdrawn .account__native-table-cell {
  color: #8b4d38;
}

.account-competition-registrations-admin__nowrap {
  white-space: nowrap;
}

.account-competition-registrations-admin__notice {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--cyan) 16%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.9);
  color: #31526b;
  font-weight: 800;
}

.account-competition-registrations-admin__notice--error {
  border-color: color-mix(in srgb, #d7502f 24%, white);
  color: #9f341f;
}

.account-competition-registrations-admin__skeleton {
  margin-top: 18px;
}

.account-competition-registrations-admin__table-row--skeleton {
  background: transparent;
}

.account-competition-registrations-admin__table-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.account-competition-registrations-admin__table-row:hover,
.account-competition-registrations-admin__table-row:focus-visible,
.account-competition-registrations-admin__table-row:hover .account__native-table-cell,
.account-competition-registrations-admin__table-row:focus-visible .account__native-table-cell {
  background: #f2f5f8;
  outline: none;
}

.account-competition-registrations-admin__skeleton-line {
  position: relative;
  display: block;
  overflow: hidden;
  height: 14px;
  margin: 0 auto;
  border-radius: 999px;
  background: color-mix(in srgb, var(--light-blue) 36%, white);
}

.account-competition-registrations-admin__skeleton-line::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.72), transparent);
  animation: account-competition-registrations-admin-skeleton 1.2s ease-in-out infinite;
}

.account-competition-registrations-admin__skeleton-line--title {
  width: min(180px, 82%);
  height: 16px;
  margin-left: 0;
}

.account-competition-registrations-admin__skeleton-line--wide {
  width: min(240px, 88%);
  height: 16px;
  margin-left: 0;
}

.account-competition-registrations-admin__skeleton-line--status {
  width: 90px;
  height: 24px;
}

.account-competition-registrations-admin__refunds {
  display: grid;
  gap: 12px;
  margin-top: 18px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--orange) 18%, white);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.94), rgb(255 248 244 / 0.86)),
    color-mix(in srgb, var(--orange) 6%, white);
}

.account-competition-registrations-admin__refunds-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 14px;
}

.account-competition-registrations-admin__refunds-note {
  max-width: 560px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.4;
  color: #8b4d38;
  text-align: right;
}

.account-competition-registrations-admin__refund-list {
  display: grid;
  gap: 10px;
}

.account-competition-registrations-admin__refund-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--cyan) 14%, white);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.86);
}

.account-competition-registrations-admin__refund-title,
.account-competition-registrations-admin__refund-meta {
  display: block;
}

.account-competition-registrations-admin__refund-title {
  font-weight: 900;
  line-height: 1.25;
  color: var(--black);
}

.account-competition-registrations-admin__refund-meta {
  margin-top: 3px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
  color: #64748b;
}

.account-competition-registrations-admin__refund-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.account-competition-registrations-admin__status-tag {
  min-height: 24px;
}

.account__native-table--competition-admin-registrations {
  min-width: 100%;
}

.account__native-table--competition-admin-registrations th:not(:first-child),
.account__native-table--competition-admin-registrations td:not(:first-child) {
  text-align: center;
}

.account-competition-registrations-admin .account__native-table-wrap {
  background: transparent;
}

.account-competition-registrations-admin__table-wrap .account__native-table-row,
.account-competition-registrations-admin__table-wrap .account__native-table-row:nth-child(even),
.account-competition-registrations-admin__table-wrap .account__native-table-row:nth-child(odd) {
  background: #fff;
}

.account-competition-registrations-admin__table-wrap .account__native-table-cell {
  background: #fff;
}

.account-competition-registrations-admin :deep(.el-tag.is-round) {
  border-radius: 5px;
}

@media (max-width: 1180px) {
  .account-competition-registrations-admin__filter-row {
    grid-template-columns: 1fr;
  }

  .account-competition-registrations-admin__refunds-head,
  .account-competition-registrations-admin__refund-card {
    grid-template-columns: 1fr;
  }

  .account-competition-registrations-admin__refunds-head {
    display: grid;
  }

  .account-competition-registrations-admin__refunds-note {
    max-width: none;
    text-align: left;
  }

  .account-competition-registrations-admin__refund-actions {
    justify-content: flex-start;
  }
}

@keyframes account-competition-registrations-admin-skeleton {
  100% {
    transform: translateX(100%);
  }
}
</style>

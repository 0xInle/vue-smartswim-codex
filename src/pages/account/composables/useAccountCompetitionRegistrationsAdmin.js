import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { buildAccountCompetitionStages } from '@/pages/account/accountCompetitionStages.data'
import {
  loadAllCompetitionRegistrationsForAdmin,
  patchCompetitionRegistrationByUserKey,
  subscribeToCompetitionRegistrationChanges,
} from '@/pages/account/utils/accountCompetitionRegistrations'
import {
  loadAllAccountUsersForAdmin,
  subscribeToAccountUsersChanges,
} from '@/domains/account-users/accountUsersRepository'
import { subscribeToAccountProfileAthleteChanges } from '@/domains/account-data/accountDataRepository'
import { subscribeToAccountDocumentChanges } from '@/domains/account-documents/documentRepository'
import { subscribeToAccountAdmissionWorkflowChanges } from '@/domains/account-admissions/accountAdmissionRepository'
import {
  COMPETITION_REGISTRATION_RECORD_STATUS,
  isCompetitionRegistrationActiveStatus,
} from '@/pages/account/utils/accountConstants'
import {
  getAccountDocumentsAdmissionStatus,
  competitionRegistrationRecordStatusType,
  formatCompetitionRegistrationRecordStatus,
  formatCompactDateTime,
  resolveCompetitionRegistrationLifecycleSummary,
} from '@/pages/account/utils/accountFormatters'
import { getApplicationTransitionOptions } from '@/domains/competition-applications/applicationLifecycle'
import { resolveCompetitionRegistrationState } from '@/utils/competitionRegistration'
import { formatCompetitionDateLabel } from '@/utils/competitionRegistration'
import { showToast } from '@/utils/toast'
import {
  loadAllPaymentsForAdmin,
  loadAllRefundsForAdmin,
  markCompetitionPaymentFailed,
  markCompetitionPaymentSucceeded,
  resolveCompetitionRefundForAdmin,
  subscribeToCompetitionPaymentChanges,
  subscribeToCompetitionRefundChanges,
} from '@/domains/payments/paymentRepository'
import {
  COMPETITION_REFUND_STATUS,
  getApplicationPaymentStatusMeta,
  getCompetitionPaymentStatusMeta,
  getCompetitionRefundStatusMeta,
  hasActiveRefund,
} from '@/domains/payments/paymentLifecycle'
import { createQueuedEmailMessageForAdmin } from '@/domains/account-email/emailRepository'

function normalizeSearchValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function formatStageOptionLabel(stage) {
  const stageLabel = `Этап ${stage.stage}`
  const dateLabel = formatCompetitionDateLabel(stage.date)

  return `${stage.competitionName} · ${stageLabel} · ${dateLabel}`
}

function resolveCompetitionWindowLabel(stage) {
  const state = resolveCompetitionRegistrationState(stage.registration)

  if (state.mode === 'open') {
    return `Открыта до ${state.closeDateLabel}`
  }

  return `${state.openDateLabel} - ${state.closeDateLabel}`
}

function buildStagePatch(stage) {
  return {
    competitionSlug: stage.competitionSlug || '',
    competitionName: stage.competitionName || '',
    stageId: stage.id || '',
    stageLabel: `Этап ${stage.stage}`,
    competitionDateLabel: formatCompetitionDateLabel(stage.date),
    competitionWindowLabel: resolveCompetitionWindowLabel(stage),
  }
}

export function useAccountCompetitionRegistrationsAdmin() {
  const registrations = ref([])
  const payments = ref([])
  const refunds = ref([])
  const search = ref('')
  const statusFilter = ref('all')
  const paymentStatusFilter = ref('all')
  const selectedRegistrationId = ref('')
  const isDetailsDialogOpen = ref(false)
  const isRegistrationsLoading = ref(false)
  const registrationsError = ref('')
  const accountUsers = ref([])
  let loadRequestId = 0
  let unsubscribeFromCompetitionApplications = null
  let unsubscribeFromUsers = null
  let unsubscribeFromAccountData = null
  let unsubscribeFromDocuments = null
  let unsubscribeFromAdmissions = null
  let unsubscribeFromPayments = null
  let unsubscribeFromRefunds = null

  async function loadRegistrations() {
    const requestId = loadRequestId + 1
    loadRequestId = requestId
    isRegistrationsLoading.value = true
    registrationsError.value = ''

    try {
      const nextRegistrations = await loadAllCompetitionRegistrationsForAdmin()

      if (requestId === loadRequestId) {
        registrations.value = nextRegistrations
      }
    } catch (error) {
      if (requestId === loadRequestId) {
        registrationsError.value =
          error instanceof Error ? error.message : 'Не удалось загрузить заявки.'
      }
    } finally {
      if (requestId === loadRequestId) {
        isRegistrationsLoading.value = false
      }
    }
  }

  async function loadAccountUsersLookup() {
    try {
      accountUsers.value = await loadAllAccountUsersForAdmin()
    } catch {
      accountUsers.value = []
    }
  }

  async function loadPaymentRecords() {
    try {
      const [nextPayments, nextRefunds] = await Promise.all([
        loadAllPaymentsForAdmin(),
        loadAllRefundsForAdmin(),
      ])

      payments.value = nextPayments
      refunds.value = nextRefunds
    } catch (error) {
      registrationsError.value =
        error instanceof Error ? error.message : 'Не удалось загрузить оплаты.'
    }
  }

  const stageOptions = computed(() =>
    buildAccountCompetitionStages()
      .slice()
      .sort((left, right) => {
        const leftCompetition = normalizeSearchValue(left.competitionName)
        const rightCompetition = normalizeSearchValue(right.competitionName)

        if (leftCompetition === rightCompetition) {
          return Number(left.stage) - Number(right.stage)
        }

        return leftCompetition.localeCompare(rightCompetition)
      })
      .map((stage) => ({
        value: stage.id,
        label: formatStageOptionLabel(stage),
      })),
  )

  const selectedRegistration = computed(
    () => registrations.value.find((item) => item.id === selectedRegistrationId.value) || null,
  )

  const selectedRegistrationDocumentsStatus = computed(() => {
    const registration = selectedRegistration.value

    if (!registration?.sourceUserKey) {
      return null
    }

    const sourceUser = accountUsers.value.find(
      (item) => item.id === registration.sourceUserKey || item.email === registration.sourceUserKey,
    )

    if (!sourceUser) {
      return {
        status: 'unknown',
        label: 'Нет данных',
        description: 'Проверьте документы в карточке пользователя.',
        tagType: 'info',
      }
    }

    if (registration.participantKind === 'athlete') {
      const athlete = (sourceUser.athletes || []).find(
        (item) => item.id === registration.participantId,
      )

      if (athlete) {
        return getAccountDocumentsAdmissionStatus(athlete.documents || [])
      }

      return {
        status: 'unknown',
        label: 'Нет данных',
        description: 'Проверьте документы в карточке пользователя.',
        tagType: 'info',
      }
    }

    const documents = sourceUser.documents || []

    if (!documents.length) {
      return {
        status: 'unknown',
        label: 'Нет данных',
        description: 'Проверьте документы в карточке пользователя.',
        tagType: 'info',
      }
    }

    return getAccountDocumentsAdmissionStatus(documents)
  })

  const selectedRegistrationLifecycleSummary = computed(() =>
    getRegistrationLifecycleSummary(selectedRegistration.value),
  )

  const selectedRegistrationStatusOptions = computed(() =>
    getApplicationTransitionOptions(selectedRegistration.value?.status, { includeCurrent: true }),
  )

  const filteredRegistrations = computed(() => {
    const normalizedSearch = normalizeSearchValue(search.value)

    return registrations.value
      .filter((registration) => {
        if (statusFilter.value !== 'all' && registration.status !== statusFilter.value) {
          return false
        }

        if (
          paymentStatusFilter.value !== 'all' &&
          getRegistrationPaymentSummary(registration).applicationStatus !== paymentStatusFilter.value
        ) {
          return false
        }

        if (!normalizedSearch) {
          return true
        }

        const haystack = [
          registration.competitionName,
          registration.stageLabel,
          registration.participantName,
          registration.ownerName,
          registration.ownerEmail,
          registration.comment,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(normalizedSearch)
      })
      .sort((left, right) => {
        const leftTime = Date.parse(left.updatedAt || left.statusChangedAt || left.createdAt || 0) || 0
        const rightTime = Date.parse(right.updatedAt || right.statusChangedAt || right.createdAt || 0) || 0

        return rightTime - leftTime
      })
  })

  const summary = computed(() => ({
    total: registrations.value.length,
    active: registrations.value.filter((registration) => isCompetitionRegistrationActiveStatus(registration.status)).length,
    withdrawn: registrations.value.filter(
      (registration) => registration.status === COMPETITION_REGISTRATION_RECORD_STATUS.WITHDRAWN,
    ).length,
    refunds: refunds.value.filter((refund) => hasActiveRefund(refund)).length,
  }))

  function openDetailsDialog(registration) {
    if (!registration) {
      return
    }

    selectedRegistrationId.value = registration.id
    isDetailsDialogOpen.value = true
  }

  function getRegistrationLifecycleSummary(registration) {
    return resolveCompetitionRegistrationLifecycleSummary(registration, {
      audience: 'admin',
      documentsStatus:
        registration?.id === selectedRegistration.value?.id
          ? selectedRegistrationDocumentsStatus.value
          : null,
    })
  }

  function closeDetailsDialog() {
    isDetailsDialogOpen.value = false
  }

  async function updateSelectedRegistration(
    patch = {},
    { closeDialog = false, toastMessage = 'Заявка обновлена' } = {},
  ) {
    const registration = selectedRegistration.value

    if (!registration?.sourceUserKey) {
      return null
    }

    let updatedRegistration = null

    try {
      updatedRegistration = await patchCompetitionRegistrationByUserKey(
        registration.sourceUserKey,
        registration.id,
        patch,
        { statusChangedBy: 'admin' },
      )
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось обновить заявку', {
        type: 'error',
      })
      return null
    }

    if (!updatedRegistration) {
      return null
    }

    await loadRegistrations()

    if (closeDialog) {
      closeDetailsDialog()
    }

    if (toastMessage) {
      showToast(toastMessage)
    }

    return updatedRegistration
  }

  async function handleRegistrationSave(payload) {
    const stageId = typeof payload === 'string' ? payload : payload?.stageId
    const registrationKind = typeof payload === 'object' && payload ? payload.registrationKind : ''
    const status = typeof payload === 'object' && payload ? payload.status : ''
    const patch = {}

    if (status === COMPETITION_REGISTRATION_RECORD_STATUS.ADMITTED) {
      await handleAdmitSelectedRegistration()
      return
    }

    if (stageId) {
      const stage = buildAccountCompetitionStages().find((item) => item.id === stageId)

      if (stage) {
        Object.assign(patch, buildStagePatch(stage))
      }
    }

    if (registrationKind) {
      patch.registrationKind = registrationKind
    }

    if (status) {
      patch.status = status
    }

    if (!Object.keys(patch).length) {
      return
    }

    await updateSelectedRegistration(patch, {
      closeDialog: true,
      toastMessage: 'Заявка обновлена',
    })
  }

  function getRegistrationPayment(registration) {
    if (!registration?.id) {
      return null
    }

    return (
      payments.value.find(
        (payment) =>
          payment.applicationId === registration.id &&
          !['failed', 'canceled'].includes(payment.status),
      ) ||
      payments.value.find((payment) => payment.applicationId === registration.id) ||
      null
    )
  }

  function getRegistrationRefund(registration) {
    const payment = getRegistrationPayment(registration)

    if (!payment?.id) {
      return null
    }

    return (
      refunds.value.find((refund) => refund.paymentId === payment.id && hasActiveRefund(refund)) ||
      refunds.value.find((refund) => refund.paymentId === payment.id) ||
      null
    )
  }

  function getRegistrationPaymentSummary(registration) {
    const payment = getRegistrationPayment(registration)
    const refund = getRegistrationRefund(registration)

    if (refund) {
      const refundMeta = getCompetitionRefundStatusMeta(refund.status)

      return {
        applicationStatus: refund.status === COMPETITION_REFUND_STATUS.SUCCEEDED ? 'refunded' : 'paid',
        status: refund.status,
        label: refundMeta.label,
        description: refundMeta.description,
        tagType: refundMeta.tagType,
        payment,
        refund,
      }
    }

    if (payment) {
      const paymentMeta = getCompetitionPaymentStatusMeta(payment.status)

      return {
        applicationStatus: payment.status === 'succeeded' ? 'paid' : registration?.paymentStatus || 'pending',
        status: payment.status,
        label: paymentMeta.label,
        description: paymentMeta.description,
        tagType: paymentMeta.tagType,
        payment,
        refund: null,
      }
    }

    const applicationPaymentMeta = getApplicationPaymentStatusMeta(registration?.paymentStatus)

    return {
      applicationStatus: registration?.paymentStatus || 'not_required',
      status: registration?.paymentStatus || 'not_required',
      label: applicationPaymentMeta.label,
      description: applicationPaymentMeta.description,
      tagType: applicationPaymentMeta.tagType,
      payment: null,
      refund: null,
    }
  }

  function getRegistrationCompetitionDateSortValue(registration) {
    const stage = buildAccountCompetitionStages().find((item) => item.id === registration?.stageId)

    return stage?.date || registration?.competitionDateLabel || ''
  }

  const activeRefundRequests = computed(() =>
    refunds.value
      .filter((refund) => hasActiveRefund(refund))
      .map((refund) => ({
        refund,
        payment: payments.value.find((payment) => payment.id === refund.paymentId) || null,
        registration:
          registrations.value.find((registration) => registration.id === refund.applicationId) || null,
      }))
      .sort((left, right) => {
        const leftTime = Date.parse(left.refund.updatedAt || left.refund.requestedAt || 0) || 0
        const rightTime = Date.parse(right.refund.updatedAt || right.refund.requestedAt || 0) || 0

        return rightTime - leftTime
      }),
  )

  async function handleMarkPaymentSucceeded(registrationId) {
    const registration = registrations.value.find((item) => item.id === registrationId)
    const payment = getRegistrationPayment(registration)

    if (!payment?.id) {
      showToast('Платеж по заявке не найден', { type: 'error' })
      return null
    }

    try {
      const updatedPayment = await markCompetitionPaymentSucceeded(payment.id, 'admin')
      await Promise.all([loadPaymentRecords(), loadRegistrations()])
      showToast('Оплата отмечена как успешная')
      return updatedPayment
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось обновить оплату', {
        type: 'error',
      })
      return null
    }
  }

  async function handleMarkPaymentFailed(registrationId) {
    const registration = registrations.value.find((item) => item.id === registrationId)
    const payment = getRegistrationPayment(registration)

    if (!payment?.id) {
      showToast('Платеж по заявке не найден', { type: 'error' })
      return null
    }

    try {
      const updatedPayment = await markCompetitionPaymentFailed(payment.id, 'admin')
      await Promise.all([loadPaymentRecords(), loadRegistrations()])
      showToast('Оплата отмечена как ошибка')
      return updatedPayment
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось обновить оплату', {
        type: 'error',
      })
      return null
    }
  }

  async function handleResolveRefund(refundId, status) {
    if (!refundId || !status) {
      return null
    }

    try {
      const updatedRefund = await resolveCompetitionRefundForAdmin(refundId, {
        status,
        adminNote:
          status === COMPETITION_REFUND_STATUS.SUCCEEDED
            ? 'Возврат отмечен вручную в MVP'
            : 'Запрос возврата отклонен вручную в MVP',
      })
      await Promise.all([loadPaymentRecords(), loadRegistrations()])
      showToast(
        status === COMPETITION_REFUND_STATUS.SUCCEEDED
          ? 'Возврат отмечен как выполненный'
          : 'Возврат отклонен',
      )
      return updatedRefund
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось обновить возврат', {
        type: 'error',
      })
      return null
    }
  }

  async function queueAdmissionEmail(registration) {
    const recipientEmail = registration?.ownerEmail || registration?.participantEmail || ''

    if (!recipientEmail) {
      showToast('Допуск сохранен, но письмо не создано: у пользователя не указана почта.', {
        type: 'error',
      })
      return
    }

    try {
      await createQueuedEmailMessageForAdmin({
        audienceType: 'single_user',
        contextType: 'admission',
        contextId: registration.id,
        subject: `Допуск к старту: ${registration.competitionName || 'Smart Swim'}`,
        body: [
          `Здравствуйте, ${registration.ownerName || registration.participantName || 'участник'}!`,
          '',
          `Участник ${registration.participantName || 'без имени'} допущен к старту.`,
          `Соревнование: ${registration.competitionName || 'не указано'}.`,
          `Этап: ${registration.stageLabel || 'не указан'}.`,
          `Дата: ${registration.competitionDateLabel || 'будет уточнена'}.`,
          '',
          'Это письмо поставлено в очередь Smart Swim. Production-отправка будет доступна после подключения email-провайдера.',
        ].join('\n'),
        recipients: [
          {
            ownerUserId: registration.sourceUserKey,
            email: recipientEmail,
            name: registration.ownerName || registration.participantName,
            recipientType: 'participant',
          },
        ],
      })
      showToast('Письмо о допуске поставлено в очередь')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось создать письмо о допуске', {
        type: 'error',
      })
    }
  }

  async function handleAdmitSelectedRegistration() {
    const registration = selectedRegistration.value
    const documentsStatus = selectedRegistrationDocumentsStatus.value
    const paymentSummary = getRegistrationPaymentSummary(registration)
    const refund = getRegistrationRefund(registration)

    if (!registration) {
      return null
    }

    if (documentsStatus?.status !== 'admitted') {
      showToast('Допуск невозможен: документы еще не одобрены.', { type: 'error' })
      return null
    }

    if (paymentSummary.applicationStatus !== 'paid') {
      showToast('Допуск невозможен: оплата еще не подтверждена.', { type: 'error' })
      return null
    }

    if (refund && hasActiveRefund(refund)) {
      showToast('Допуск невозможен: по заявке есть активный запрос возврата.', { type: 'error' })
      return null
    }

    const updatedRegistration = await updateSelectedRegistration(
      { status: COMPETITION_REGISTRATION_RECORD_STATUS.ADMITTED },
      { closeDialog: true, toastMessage: 'Участник допущен к старту' },
    )

    if (updatedRegistration) {
      await queueAdmissionEmail(updatedRegistration)
    }

    return updatedRegistration
  }

  function handleWithdrawSelectedRegistration() {
    const registration = selectedRegistration.value

    if (!registration) {
      return
    }

    if (registration.status !== COMPETITION_REGISTRATION_RECORD_STATUS.SUBMITTED) {
      return
    }

    void ElMessageBox.confirm(
      'Снять участника с соревнований? Заявка останется в истории.',
      'Подтверждение снятия',
      {
        customClass: 'account__confirm-messagebox',
        confirmButtonText: 'Снять',
        cancelButtonText: 'Отмена',
        confirmButtonClass: 'account__submit btn-reset',
        cancelButtonClass: 'account__table-action account__table-action--ghost btn-reset',
        type: 'warning',
        autofocus: false,
        closeOnClickModal: false,
        closeOnPressEscape: true,
      },
    )
      .then(() => {
        void updateSelectedRegistration(
          { status: COMPETITION_REGISTRATION_RECORD_STATUS.WITHDRAWN },
          { closeDialog: true, toastMessage: '' },
        ).then((updatedRegistration) => {
          if (updatedRegistration) {
            showToast('Участник снят с соревнований')
          }
        })
      })
      .catch(() => {})
  }

  onMounted(() => {
    void loadRegistrations()
    void loadAccountUsersLookup()
    void loadPaymentRecords()

    unsubscribeFromCompetitionApplications = subscribeToCompetitionRegistrationChanges(() => {
      void loadRegistrations()
    })
    unsubscribeFromUsers = subscribeToAccountUsersChanges(() => {
      void loadAccountUsersLookup()
    })
    unsubscribeFromAccountData = subscribeToAccountProfileAthleteChanges(() => {
      void loadAccountUsersLookup()
    })
    unsubscribeFromDocuments = subscribeToAccountDocumentChanges(() => {
      void loadAccountUsersLookup()
    })
    unsubscribeFromAdmissions = subscribeToAccountAdmissionWorkflowChanges(() => {
      void loadAccountUsersLookup()
    })
    unsubscribeFromPayments = subscribeToCompetitionPaymentChanges(() => {
      void loadPaymentRecords()
      void loadRegistrations()
    })
    unsubscribeFromRefunds = subscribeToCompetitionRefundChanges(() => {
      void loadPaymentRecords()
      void loadRegistrations()
    })
  })

  onBeforeUnmount(() => {
    if (unsubscribeFromCompetitionApplications) {
      unsubscribeFromCompetitionApplications()
      unsubscribeFromCompetitionApplications = null
    }

    if (unsubscribeFromUsers) {
      unsubscribeFromUsers()
      unsubscribeFromUsers = null
    }

    if (unsubscribeFromAccountData) {
      unsubscribeFromAccountData()
      unsubscribeFromAccountData = null
    }

    if (unsubscribeFromDocuments) {
      unsubscribeFromDocuments()
      unsubscribeFromDocuments = null
    }

    if (unsubscribeFromAdmissions) {
      unsubscribeFromAdmissions()
      unsubscribeFromAdmissions = null
    }

    if (unsubscribeFromPayments) {
      unsubscribeFromPayments()
      unsubscribeFromPayments = null
    }

    if (unsubscribeFromRefunds) {
      unsubscribeFromRefunds()
      unsubscribeFromRefunds = null
    }
  })

  return {
    registrations,
    search,
    statusFilter,
    paymentStatusFilter,
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
    selectedRegistrationLifecycleSummary,
    selectedRegistrationStatusOptions,
    getRegistrationLifecycleSummary,
    getRegistrationPayment,
    getRegistrationRefund,
    getRegistrationPaymentSummary,
    getRegistrationCompetitionDateSortValue,
    handleRegistrationSave,
    handleWithdrawSelectedRegistration,
    handleMarkPaymentSucceeded,
    handleMarkPaymentFailed,
    handleResolveRefund,
    handleAdmitSelectedRegistration,
    competitionRegistrationRecordStatusType,
    formatCompetitionRegistrationRecordStatus,
    formatCompactDateTime,
  }
}

import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { CRM_ROLE } from '@/utils/crmRoles'
import {
  getAccountDocumentReviewRecordId,
  readAccountDocumentReviewRecords,
  upsertAccountDocumentReviewRecord,
} from '@/pages/account/utils/accountDocumentRegistry'
import { DOCUMENT_REVIEW_STATUS_OPTIONS } from '@/pages/account/utils/accountConstants'
import { readAccountUsersSnapshot } from '@/pages/account/utils/accountUsersStorage'
import {
  readAccountAthleteSnapshots,
  readAccountProfileSnapshots,
} from '@/pages/account/utils/accountLocalStorage'
import {
  formatAccountDocumentDate,
  formatCompactDateTime,
  getAccountDocumentDisplayStatus,
  getAccountDocumentsAdmissionStatus,
  isAccountDocumentExpired,
} from '@/pages/account/utils/accountFormatters'
import {
  ACCOUNT_DOCUMENT_STATUS,
  normalizeAccountDocumentsState,
} from '@/pages/account/utils/accountDocumentTypes'
import {
  createAccountAdmission,
  resolveAccountAdmissionStatus,
} from '@/pages/account/utils/accountAdmissions'
import { showToast } from '@/utils/toast'

function normalizeSearchValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function resolveReviewerName(currentUser) {
  return currentUser?.value?.name || currentUser?.name || 'Администратор'
}

export function useAccountDocumentReviews({ currentUser }) {
  const records = ref([])
  const users = ref([])
  const profileSnapshots = ref([])
  const athleteSnapshots = ref([])
  const search = ref('')
  const statusFilter = ref('all')
  const isLoading = ref(false)
  const reviewDialogError = ref('')
  const reviewDialogState = reactive({
    isOpen: false,
    recordId: '',
    action: '',
    reason: '',
  })

  function loadRecords() {
    isLoading.value = true

    try {
      records.value = readAccountDocumentReviewRecords()
      users.value = readAccountUsersSnapshot().filter((user) => user?.role === CRM_ROLE.USER)
      profileSnapshots.value = readAccountProfileSnapshots()
      athleteSnapshots.value = readAccountAthleteSnapshots()
    } finally {
      isLoading.value = false
    }
  }

  function getUserKey(user) {
    return user?.id || user?.email || 'anonymous'
  }

  function createBaseUserDocumentRecord({ user, document }) {
    const ownerUserKey = getUserKey(user)
    const scope = 'user'
    const scopeId = user?.id || ownerUserKey

    return {
      id: getAccountDocumentReviewRecordId({
        ownerUserKey,
        scope,
        scopeId,
        documentType: document.type,
      }),
      ownerUserKey,
      ownerName: user?.name || 'Не указан',
      ownerEmail: user?.email || '',
      ownerPhone: user?.phone || '',
      scope,
      scopeId,
      participantName: user?.name || '',
      participantBirthDate: '',
      participantClub: '',
      participantKind: 'owner',
      documentType: document.type,
      documentLabel: document.label,
      documentHint: document.hint,
      status: document.status || ACCOUNT_DOCUMENT_STATUS.MISSING,
      fileName: document.fileName || '',
      fileSize: document.fileSize || 0,
      fileType: document.fileType || '',
      fileDataUrl: document.fileDataUrl || '',
      uploadedAt: document.uploadedAt || '',
      expiresAt: document.expiresAt || '',
      verifiedAt: document.verifiedAt || '',
      verifiedBy: document.verifiedBy || '',
      rejectionReason: document.rejectionReason || '',
      reviewedAt: document.reviewedAt || '',
      reviewedBy: document.reviewedBy || '',
    }
  }

  function normalizeReviewRecord(record) {
    return {
      ...record,
      type: record.documentType,
      label: record.documentLabel,
      hint: record.documentHint,
    }
  }

  function normalizeReviewDocuments(documents) {
    return normalizeAccountDocumentsState(documents).map((document) => ({
      ...document,
      documentType: document.type,
      documentLabel: document.label,
      documentHint: document.hint,
    }))
  }

  function createBaseProfileDocumentRecord({ profile, document }) {
    const ownerUserKey = profile.userKey || profile.email || 'anonymous'
    const scope = 'profile'
    const scopeId = 'profile'

    return {
      id: getAccountDocumentReviewRecordId({
        ownerUserKey,
        scope,
        scopeId,
        documentType: document.type,
      }),
      ownerUserKey,
      ownerName: profile.fullName || 'Не указан',
      ownerEmail: profile.email || '',
      ownerPhone: profile.phone || '',
      scope,
      scopeId,
      participantName: profile.fullName || '',
      participantBirthDate: profile.birthDate || '',
      participantClub: profile.club || '',
      participantKind: 'owner',
      documentType: document.type,
      documentLabel: document.label,
      documentHint: document.hint,
      status: document.status || ACCOUNT_DOCUMENT_STATUS.MISSING,
      fileName: document.fileName || '',
      fileSize: document.fileSize || 0,
      fileType: document.fileType || '',
      fileDataUrl: document.fileDataUrl || '',
      uploadedAt: document.uploadedAt || '',
      expiresAt: document.expiresAt || '',
      verifiedAt: document.verifiedAt || '',
      verifiedBy: document.verifiedBy || '',
      rejectionReason: document.rejectionReason || '',
      reviewedAt: document.reviewedAt || document.uploadedAt || '',
      reviewedBy: document.reviewedBy || document.verifiedBy || '',
    }
  }

  const groupedRows = computed(() => {
    const grouped = new Map()
    const recordsByGroup = new Map()
    const normalizedSearch = normalizeSearchValue(search.value)

    records.value.forEach((record) => {
      const groupId = getGroupId(record)
      const groupRecords = recordsByGroup.get(groupId) || []

      groupRecords.push(normalizeReviewRecord(record))
      recordsByGroup.set(groupId, groupRecords)
    })

    users.value.forEach((user) => {
      const ownerUserKey = getUserKey(user)
      const scopeId = user?.id || ownerUserKey
      const documentById = new Map()

      normalizeAccountDocumentsState(user.documents).forEach((document) => {
        const baseRecord = createBaseUserDocumentRecord({ user, document })
        documentById.set(baseRecord.id, normalizeReviewRecord(baseRecord))
      })

      ;(recordsByGroup.get(getGroupId({ ownerUserKey, scope: 'user', scopeId })) || []).forEach((record) => {
        documentById.set(record.id, {
          ...documentById.get(record.id),
          ...record,
          type: record.documentType,
          label: record.documentLabel || documentById.get(record.id)?.label || '',
          hint: record.documentHint || documentById.get(record.id)?.hint || '',
        })
      })

      grouped.set(getGroupId({ ownerUserKey, scope: 'user', scopeId }), {
        id: getGroupId({ ownerUserKey, scope: 'user', scopeId }),
        ownerUserKey,
        ownerName: user?.name || 'Не указан',
        ownerEmail: user?.email || '',
        scope: 'user',
        scopeId,
        participantName: user?.name || 'Без имени',
        participantBirthDate: '',
        participantClub: '',
        participantKind: 'owner',
        documents: Array.from(documentById.values()),
      })
    })

    profileSnapshots.value.forEach((profile) => {
      const ownerUserKey = profile.userKey || profile.email || 'anonymous'
      const documentById = new Map()

      normalizeAccountDocumentsState(profile.documents).forEach((document) => {
        const baseRecord = createBaseProfileDocumentRecord({ profile, document })
        documentById.set(baseRecord.id, normalizeReviewRecord(baseRecord))
      })

      ;(recordsByGroup.get(getGroupId({ ownerUserKey, scope: 'profile', scopeId: 'profile' })) || []).forEach((record) => {
        documentById.set(record.id, {
          ...documentById.get(record.id),
          ...record,
          type: record.documentType,
          label: record.documentLabel || documentById.get(record.id)?.label || '',
          hint: record.documentHint || documentById.get(record.id)?.hint || '',
        })
      })

      grouped.set(getGroupId({ ownerUserKey, scope: 'profile', scopeId: 'profile' }), {
        id: getGroupId({ ownerUserKey, scope: 'profile', scopeId: 'profile' }),
        ownerUserKey,
        ownerName: profile.fullName || 'Не указан',
        ownerEmail: profile.email || '',
        scope: 'profile',
        scopeId: 'profile',
        participantName: profile.fullName || 'Без имени',
        participantBirthDate: profile.birthDate || '',
        participantClub: profile.club || '',
        participantKind: 'owner',
        documents: Array.from(documentById.values()),
      })
    })

    athleteSnapshots.value.forEach((athlete) => {
      const ownerUserKey = athlete.ownerUserKey || 'anonymous'
      const scope = 'athlete'
      const scopeId = athlete.id
      const documentById = new Map()

      normalizeAccountDocumentsState(athlete.documents).forEach((document) => {
        const normalizedDocument = normalizeReviewRecord({
          ...document,
          id: getAccountDocumentReviewRecordId({
            ownerUserKey,
            scope,
            scopeId,
            documentType: document.type,
          }),
          ownerUserKey,
          ownerName: athlete.ownerName || 'Не указан',
          ownerEmail: athlete.ownerEmail || '',
          ownerPhone: athlete.ownerPhone || '',
          scope,
          scopeId,
          participantName: athlete.fullName || '',
          participantBirthDate: athlete.birthDate || '',
          participantClub: athlete.club || '',
          participantKind: 'athlete',
          documentType: document.type,
          documentLabel: document.label,
          documentHint: document.hint,
        })
        documentById.set(normalizedDocument.id, normalizedDocument)
      })

      ;(recordsByGroup.get(getGroupId({ ownerUserKey, scope, scopeId })) || []).forEach((record) => {
        documentById.set(record.id, {
          ...documentById.get(record.id),
          ...record,
          type: record.documentType,
          label: record.documentLabel || documentById.get(record.id)?.label || '',
          hint: record.documentHint || documentById.get(record.id)?.hint || '',
        })
      })

      grouped.set(getGroupId({ ownerUserKey, scope, scopeId }), {
        id: getGroupId({ ownerUserKey, scope, scopeId }),
        ownerUserKey,
        ownerName: athlete.ownerName || 'Не указан',
        ownerEmail: athlete.ownerEmail || '',
        scope,
        scopeId,
        participantName: athlete.fullName || 'Без имени',
        participantBirthDate: athlete.birthDate || '',
        participantClub: athlete.club || '',
        participantKind: 'athlete',
        documents: Array.from(documentById.values()),
      })
    })

    records.value.forEach((record) => {
      const groupId = getGroupId(record)

      if (grouped.has(groupId)) {
        return
      }

      const group = grouped.get(groupId) || {
        id: groupId,
        ownerUserKey: record.ownerUserKey || 'anonymous',
        ownerName: record.ownerName || 'Не указан',
        ownerEmail: record.ownerEmail || '',
        scope: record.scope || 'profile',
        scopeId: record.scopeId || 'profile',
        participantName: record.participantName || record.ownerName || 'Без имени',
        participantBirthDate: record.participantBirthDate || '',
        participantClub: record.participantClub || '',
        participantKind: record.participantKind || 'owner',
        documents: [],
      }

      group.documents.push(normalizeReviewRecord(record))
      grouped.set(groupId, group)
    })

    return Array.from(grouped.values())
      .map((group) => {
        const documents = normalizeReviewDocuments(group.documents).sort((left, right) => {
          const leftTime = Date.parse(left.reviewedAt || left.uploadedAt || 0) || 0
          const rightTime = Date.parse(right.reviewedAt || right.uploadedAt || 0) || 0

          return rightTime - leftTime
        })
        const statusMeta = resolveAccountAdmissionStatus({
          ownerUserKey: group.ownerUserKey,
          scope: group.scope,
          scopeId: group.scopeId,
          documents,
        })
        const haystack = [
          group.ownerName,
          group.ownerEmail,
          group.participantName,
          ...documents.flatMap((document) => [
            document.documentLabel,
            document.documentType,
            document.fileName,
            document.rejectionReason,
            document.status,
          ]),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return {
          ...group,
          documents,
          statusMeta,
          documentCount: documents.length,
          haystack,
        }
      })
      .filter((group) => {
        if (statusFilter.value !== 'all' && group.statusMeta.status !== statusFilter.value) {
          return false
        }

        if (!normalizedSearch) {
          return true
        }

        return group.haystack.includes(normalizedSearch)
      })
      .sort((left, right) => {
        const leftTime = left.documents.reduce((max, document) => {
          const candidate = Date.parse(document.reviewedAt || document.uploadedAt || 0) || 0
          return Math.max(max, candidate)
        }, 0)
        const rightTime = right.documents.reduce((max, document) => {
          const candidate = Date.parse(document.reviewedAt || document.uploadedAt || 0) || 0
          return Math.max(max, candidate)
        }, 0)

        return rightTime - leftTime
      })
  })

  const groupedDocuments = computed(() => groupedRows.value.flatMap((group) => group.documents))

  const filteredRecords = computed(() => {
    const normalizedSearch = normalizeSearchValue(search.value)

    return records.value
      .filter((record) => {
        if (statusFilter.value !== 'all' && record.status !== statusFilter.value) {
          return false
        }

        if (!normalizedSearch) {
          return true
        }

        const haystack = [
          record.ownerName,
          record.ownerEmail,
          record.ownerPhone,
          record.participantName,
          record.participantBirthDate,
          record.participantClub,
          record.documentLabel,
          record.documentType,
          record.fileName,
          record.rejectionReason,
          record.verifiedBy,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(normalizedSearch)
      })
      .sort((left, right) => {
        const leftTime = Date.parse(left.reviewedAt || left.uploadedAt || 0) || 0
        const rightTime = Date.parse(right.reviewedAt || right.uploadedAt || 0) || 0

        return rightTime - leftTime
      })
  })

  const summary = computed(() => {
    const documents = groupedDocuments.value
    const usersWithDocuments = groupedRows.value.filter((group) =>
      group.documents.some((document) => document.status !== ACCOUNT_DOCUMENT_STATUS.MISSING),
    ).length
    const pending = documents.filter(
      (record) =>
        [
          ACCOUNT_DOCUMENT_STATUS.UPLOADED,
          ACCOUNT_DOCUMENT_STATUS.REJECTED,
          ACCOUNT_DOCUMENT_STATUS.NEEDS_REUPLOAD,
        ].includes(record.status),
    ).length
    const verified = documents.filter(
      (record) => record.status === ACCOUNT_DOCUMENT_STATUS.VERIFIED,
    ).length
    const expired = documents.filter((record) => isAccountDocumentExpired(record)).length

    return {
      totalUsers: users.value.length,
      usersWithDocuments,
      totalDocuments: documents.length,
      pending,
      verified,
      expired,
    }
  })

  const reviewRecord = computed(
    () => records.value.find((record) => record.id === reviewDialogState.recordId) || null,
  )

  const reviewDialogTitle = computed(() => {
    if (reviewDialogState.action === 'reject') {
      return 'Отклонить документ'
    }

    if (reviewDialogState.action === 'needs_reupload') {
      return 'Запросить повторную загрузку'
    }

    return 'Проверка документа'
  })

  const reviewDialogHint = computed(() => {
    if (reviewDialogState.action === 'reject') {
      return 'Опишите причину отклонения. Пользователь увидит этот комментарий в личном кабинете.'
    }

    if (reviewDialogState.action === 'needs_reupload') {
      return 'Укажите, что именно нужно исправить. Это отобразится у пользователя как запрос на повторную загрузку.'
    }

    return 'Подтвердите документ, если он соответствует требованиям.'
  })

  function closeReviewDialog() {
    reviewDialogState.isOpen = false
    reviewDialogState.recordId = ''
    reviewDialogState.action = ''
    reviewDialogState.reason = ''
    reviewDialogError.value = ''
  }

  function openReviewDialog(record, action) {
    if (!record || !action) {
      return
    }

    reviewDialogState.recordId = record.id
    reviewDialogState.action = action
    reviewDialogState.reason = record.rejectionReason || ''
    reviewDialogState.isOpen = true
    reviewDialogError.value = ''
  }

  function applyReviewAction({ record, status, reason = '' }) {
    if (!record) {
      return
    }

    const reviewerName = resolveReviewerName(currentUser)
    const nextRecord = {
      ...record,
      status,
      rejectionReason:
        status === ACCOUNT_DOCUMENT_STATUS.VERIFIED ? '' : String(reason || '').trim(),
      verifiedAt: status === ACCOUNT_DOCUMENT_STATUS.VERIFIED ? new Date().toISOString() : '',
      verifiedBy: status === ACCOUNT_DOCUMENT_STATUS.VERIFIED ? reviewerName : '',
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerName,
    }

    upsertAccountDocumentReviewRecord(nextRecord)
    loadRecords()
  }

  function handleApprove(record) {
    applyReviewAction({ record, status: ACCOUNT_DOCUMENT_STATUS.VERIFIED })
  }

  function handleAdmit(group) {
    if (!group || group.statusMeta.status !== 'ready') {
      return
    }

    createAccountAdmission({
      ownerUserKey: group.ownerUserKey,
      ownerName: group.ownerName,
      ownerEmail: group.ownerEmail,
      scope: group.scope,
      scopeId: group.scopeId,
      participantName: group.participantName,
      participantBirthDate: group.participantBirthDate,
      participantClub: group.participantClub,
      participantKind: group.participantKind,
      admittedBy: resolveReviewerName(currentUser),
    })
    showToast('Спортсмен допущен. Email-уведомление подготовлено к отправке.')
    loadRecords()
  }

  function submitReviewDialog() {
    if (!reviewRecord.value || !reviewDialogState.action) {
      return
    }

    const nextReason = String(reviewDialogState.reason || '').trim()

    if (reviewDialogState.action !== 'verified' && !nextReason) {
      reviewDialogError.value = 'Укажите причину, чтобы пользователь увидел комментарий.'
      return
    }

    const nextStatus =
      reviewDialogState.action === 'reject'
        ? ACCOUNT_DOCUMENT_STATUS.REJECTED
        : ACCOUNT_DOCUMENT_STATUS.NEEDS_REUPLOAD

    applyReviewAction({
      record: reviewRecord.value,
      status: nextStatus,
      reason: nextReason,
    })

    closeReviewDialog()
  }

  function refresh() {
    loadRecords()
  }

  function handleStorageChange(event) {
    const storageKeyValue = String(event?.key || '')

    if (
      !storageKeyValue.includes('account-document-reviews') &&
      !storageKeyValue.includes('account-users') &&
      !storageKeyValue.includes('account-documents') &&
      !storageKeyValue.includes('account-athletes') &&
      !storageKeyValue.includes('account-profile')
    ) {
      return
    }

    loadRecords()
  }

  watch(
    currentUser,
    () => {
      loadRecords()
    },
    { immediate: true },
  )

  onMounted(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('storage', handleStorageChange)
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.removeEventListener('storage', handleStorageChange)
  })

  return {
    records,
    groupedRows,
    filteredRecords,
    summary,
    search,
    statusFilter,
    isLoading,
    statusOptions: DOCUMENT_REVIEW_STATUS_OPTIONS,
    reviewDialogState,
    reviewDialogError,
    reviewRecord,
    reviewDialogTitle,
    reviewDialogHint,
    closeReviewDialog,
    openReviewDialog,
    handleApprove,
    handleAdmit,
    submitReviewDialog,
    refresh,
    formatAccountDocumentDate,
    formatCompactDateTime,
    getAccountDocumentDisplayStatus,
    getAccountDocumentsAdmissionStatus,
  }
}

function getGroupId({ ownerUserKey, scope, scopeId }) {
  return [ownerUserKey || 'anonymous', scope || 'profile', scopeId || 'profile'].join(':')
}

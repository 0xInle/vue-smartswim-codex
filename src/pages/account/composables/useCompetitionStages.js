import { computed, onBeforeUnmount, ref, unref, watch } from 'vue'
import {
  buildAccountCompetitionStages,
  buildCompetitionSeriesOptions,
} from '@/pages/account/accountCompetitionStages.data'
import {
  loadCompetitionRegistrationStageRefsForAdmin,
  subscribeToCompetitionRegistrationChanges,
  updateCompetitionRegistrationsByStageIdFromSource,
} from '@/pages/account/utils/accountCompetitionRegistrations'
import { isCompetitionRegistrationActiveStatus } from '@/pages/account/utils/accountConstants'
import {
  competitionDirections,
  deleteCompetitionStageFromSource,
  ensureCompetitionDirectionsLoaded,
  patchCompetitionStageInSource,
  saveCompetitionDirectionTitleToSource,
  saveCompetitionDirectionToSource,
  saveCompetitionStageDistancesToSource,
  saveCompetitionStageToSource,
  startCompetitionDirectionsRealtime,
  stopCompetitionDirectionsRealtime,
} from '@/pages/competitions/competitionData'
import { publicAsset } from '@/utils/publicAsset'
import { showToast } from '@/utils/toast'
import {
  buildCompetitionRegistrationWindow,
  formatCompetitionDateLabel,
  formatCompetitionDateShortLabel,
  toCompetitionDateTime,
} from '@/utils/competitionRegistration'
import { resolveCompetitionRegistrationState } from '@/utils/competitionRegistration'

const DEFAULT_REGISTRATION_NOTE =
  'Регистрация открывается за 21 день и закрывается за 3 дня до этапа.'
const STAGE_COUNTS_REFRESH_DEBOUNCE_MS = 300

function hasDatePayload(value) {
  return value !== undefined && String(value || '').trim() !== ''
}

function buildSlug(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || `competition-${Date.now()}`
}

function createStageRow({
  competitionName,
  competitionSlug,
  stage,
  date,
  protocolUrl = '',
  photoUrl = '',
  certificateUrl = '',
  memoUrl = '',
  registrationLimit = 0,
  registration = null,
}) {
  return {
    id: `${competitionSlug}-stage-${stage}`,
    competitionName,
    competitionSlug,
    stage,
    date,
    protocolUrl,
    photoUrl,
    certificateUrl,
    memoUrl,
    registrationLimit,
    distanceSummary: 'Программа этапа будет уточняться.',
    registration: {
      ...buildCompetitionRegistrationWindow(date),
      competitionDateLabel: formatCompetitionDateLabel(date),
      closeNote: DEFAULT_REGISTRATION_NOTE,
      participantLimit: registrationLimit ?? 0,
      ...(registration || {}),
    },
  }
}

function createCompetitionDirection({ competitionName, competitionSlug, card }) {
  return {
    slug: competitionSlug,
    badge: 'Соревнования по плаванию',
    title: competitionName,
    subtitle: '',
    summary: 'Календарь соревнований.',
    description: 'Соревнование добавлено через админ-панель.',
    location: '',
    season: 'Сезон 2026',
    registration: {
      documentsRoute: '/documents',
    },
    image: publicAsset('/images/04-img.webp'),
    imageAlt: competitionName,
    cards: [card],
    faqSections: [],
  }
}

const ROMAN_STAGE_VALUES = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
}

function getCardStageNumber(card) {
  const title = String(card?.title || '')
    .trim()
    .toUpperCase()
  const numericTitle = Number(title)

  if (Number.isFinite(numericTitle)) {
    return numericTitle
  }

  return ROMAN_STAGE_VALUES[title] || null
}

function getDirectionCardIndex(direction, stage, stageId = '') {
  if (stageId) {
    const cardIndexById = direction?.cards?.findIndex((card) => card.id === stageId)

    if (cardIndexById !== undefined && cardIndexById !== -1) {
      return cardIndexById
    }
  }

  const normalizedStage = Number(stage)
  const cardIndex = direction?.cards?.findIndex(
    (card) => Number(card.stage) === normalizedStage || getCardStageNumber(card) === normalizedStage,
  )

  if (cardIndex !== undefined && cardIndex !== -1) {
    return cardIndex
  }

  return normalizedStage - 4
}

function findDirectionByName(name) {
  return competitionDirections.find((item) => item.title === name)
}

function findDirectionBySlug(slug) {
  return competitionDirections.find((item) => item.slug === slug)
}

function resolveCompetitionWindowLabel(registration) {
  const state = resolveCompetitionRegistrationState(registration)

  if (state.mode === 'open') {
    return `Открыта до ${state.closeDateLabel}`
  }

  return `${state.openDateLabel} - ${state.closeDateLabel}`
}

function isCompetitionStageArchived(stage, now = Date.now()) {
  const archiveTimestamp = Date.parse(toCompetitionDateTime(stage?.date, { endOfDay: true }))

  return Number.isFinite(archiveTimestamp) ? now >= archiveTimestamp : false
}

function getRegistrationStageNumber(registration = {}) {
  const stageIdMatch = String(registration.stageId || '').match(/stage-(\d+)$/)

  if (stageIdMatch) {
    return Number(stageIdMatch[1]) || null
  }

  const stageLabelMatch = String(registration.stageLabel || '').match(/\d+/)

  return stageLabelMatch ? Number(stageLabelMatch[0]) || null : null
}

function isSameDateTimePayload(nextDate, currentDateTime = '', { endOfDay = false } = {}) {
  if (!hasDatePayload(nextDate)) {
    return true
  }

  return toCompetitionDateTime(nextDate, { endOfDay }) === String(currentDateTime || '')
}

function isSameDatePayload(nextDate, currentDate = '') {
  if (!hasDatePayload(nextDate)) {
    return true
  }

  return toCompetitionDateTime(nextDate) === toCompetitionDateTime(currentDate)
}

function isSameOptionalTextPayload(nextValue, currentValue = '') {
  return nextValue === undefined || String(nextValue || '') === String(currentValue || '')
}

export function useCompetitionStages({ isEnabled = true } = {}) {
  function buildCompetitionStageRows() {
    return buildAccountCompetitionStages().map((stage) => ({
      ...stage,
      registrationLimit: Number(stage.registrationLimit ?? stage.registration?.participantLimit ?? 0),
      registration: {
        ...stage.registration,
        participantLimit: Number(stage.registrationLimit ?? stage.registration?.participantLimit ?? 0),
      },
      protocolUrl: stage.protocolUrl || '',
      photoUrl: stage.photoUrl || '',
      certificateUrl: stage.certificateUrl || '',
      memoUrl: stage.memoUrl || '',
    }))
  }

  const competitionStages = ref(buildCompetitionStageRows())
  const competitionFilter = ref('all')
  const competitionViewFilter = ref('active')
  const stageActiveRegistrationCounts = ref({})
  const isCompetitionStagesLoading = ref(Boolean(unref(isEnabled)))
  let unsubscribeFromCompetitionApplications = null
  let stageRegistrationCountsRefreshTimer = null
  let stageRegistrationCountsRefreshPromise = null
  let isInitialCompetitionDirectionsLoading = false

  function isCompetitionStagesEnabled() {
    return Boolean(unref(isEnabled))
  }

  const filteredCompetitionSeriesStages = computed(() =>
    competitionStages.value.filter((stage) =>
      competitionFilter.value === 'all' ? true : stage.competitionName === competitionFilter.value,
    ),
  )

  const filteredCompetitionStages = computed(() => {
    const seriesStages = filteredCompetitionSeriesStages.value

    return seriesStages.filter((stage) =>
      competitionViewFilter.value === 'archived'
        ? isCompetitionStageArchived(stage)
        : !isCompetitionStageArchived(stage),
    )
  })

  const filteredCompetitionStagesTotal = computed(() => filteredCompetitionStages.value.length)

  const activeCompetitionStagesCount = computed(
    () =>
      filteredCompetitionSeriesStages.value.filter((stage) => !isCompetitionStageArchived(stage))
        .length,
  )

  const archivedCompetitionStagesCount = computed(
    () =>
      filteredCompetitionSeriesStages.value.filter((stage) => isCompetitionStageArchived(stage))
        .length,
  )

  const filteredOpenCompetitionRegistrationsCount = computed(
    () =>
      filteredCompetitionSeriesStages.value.filter(
        (stage) => resolveCompetitionRegistrationState(stage.registration).mode === 'open',
      ).length,
  )

  const openCompetitionRegistrationsCount = computed(() => {
    return competitionStages.value.filter(
      (stage) => resolveCompetitionRegistrationState(stage.registration).mode === 'open',
    ).length
  })

  function applyStageRegistrationCounts(registrations = []) {
    const nextCounts = {}

    registrations.forEach((registration) => {
      if (!registration.stageId || !isCompetitionRegistrationActiveStatus(registration.status)) {
        return
      }

      const targetStage = competitionStages.value.find((stage) =>
        registrationMatchesStage(registration, stage),
      )
      const countKey = targetStage?.id || registration.stageId

      nextCounts[countKey] = (nextCounts[countKey] || 0) + 1
    })

    stageActiveRegistrationCounts.value = nextCounts
  }

  function registrationMatchesStage(registration = {}, stage = {}) {
    if (!registration.stageId || !stage.id) {
      return false
    }

    if (registration.stageId === stage.id) {
      return true
    }

    if (registration.competitionName !== stage.competitionName) {
      return false
    }

    return getRegistrationStageNumber(registration) === Number(stage.stage)
  }

  async function refreshStageRegistrationCounts() {
    if (!isCompetitionStagesEnabled()) {
      stageActiveRegistrationCounts.value = {}
      return
    }

    if (stageRegistrationCountsRefreshPromise) {
      return stageRegistrationCountsRefreshPromise
    }

    stageRegistrationCountsRefreshPromise = (async () => {
      try {
        const registrations = await loadCompetitionRegistrationStageRefsForAdmin()
        applyStageRegistrationCounts(registrations)
      } catch {
        stageActiveRegistrationCounts.value = {}
      } finally {
        stageRegistrationCountsRefreshPromise = null
      }
    })()

    return stageRegistrationCountsRefreshPromise
  }

  async function countActiveRegistrationsForStage(stage) {
    if (!isCompetitionStagesEnabled()) {
      return stageActiveRegistrationCounts.value[stage?.id] || 0
    }

    await refreshStageRegistrationCounts()

    return stageActiveRegistrationCounts.value[stage?.id] || 0
  }

  function scheduleStageRegistrationCountsRefresh() {
    if (!isCompetitionStagesEnabled() || stageRegistrationCountsRefreshTimer) {
      return
    }

    stageRegistrationCountsRefreshTimer = window.setTimeout(() => {
      stageRegistrationCountsRefreshTimer = null
      void refreshStageRegistrationCounts()
    }, STAGE_COUNTS_REFRESH_DEBOUNCE_MS)
  }

  function cancelStageRegistrationCountsRefresh() {
    if (stageRegistrationCountsRefreshTimer) {
      clearTimeout(stageRegistrationCountsRefreshTimer)
      stageRegistrationCountsRefreshTimer = null
    }
  }

  function startCompetitionApplicationSubscription() {
    if (!isCompetitionStagesEnabled() || unsubscribeFromCompetitionApplications) {
      return
    }

    isInitialCompetitionDirectionsLoading = true
    isCompetitionStagesLoading.value = true
    void ensureCompetitionDirectionsLoaded().finally(() => {
      isInitialCompetitionDirectionsLoading = false
      isCompetitionStagesLoading.value = false
      void refreshStageRegistrationCounts()
    })
    startCompetitionDirectionsRealtime()

    unsubscribeFromCompetitionApplications = subscribeToCompetitionRegistrationChanges(() => {
      scheduleStageRegistrationCountsRefresh()
    })
  }

  function stopCompetitionApplicationSubscription() {
    cancelStageRegistrationCountsRefresh()
    isInitialCompetitionDirectionsLoading = false

    if (unsubscribeFromCompetitionApplications) {
      unsubscribeFromCompetitionApplications()
      unsubscribeFromCompetitionApplications = null
    }

    stopCompetitionDirectionsRealtime()
  }

  async function updateCompetitionStage(
    stageId,
    {
      competitionName,
      stage,
      date,
      openAt,
      closeAt,
      protocolUrl,
      photoUrl,
      certificateUrl,
      memoUrl,
      registrationLimit,
    } = {},
  ) {
    const targetStage = competitionStages.value.find((stage) => stage.id === stageId)

    if (!targetStage) {
      throw new Error('Этап не найден')
    }

    const competitionSlug = targetStage.competitionSlug
    const previousCompetitionName = targetStage.competitionName
    const nextCompetitionName = competitionName || targetStage.competitionName
    const previousStageNumber = Number(targetStage.stage)
    const nextStageNumber = stage !== undefined ? Number(stage) : Number(targetStage.stage)
    const hasStageNumberChanged =
      stage !== undefined &&
      Number.isFinite(nextStageNumber) &&
      nextStageNumber >= 0 &&
      nextStageNumber !== previousStageNumber
    const currentLimit = Number(
      targetStage.registrationLimit ?? targetStage.registration?.participantLimit ?? 0,
    )
    const nextLimit = registrationLimit !== undefined ? Number(registrationLimit ?? 0) || 0 : currentLimit
    const isStageUpdateNoop =
      nextLimit === currentLimit &&
      nextCompetitionName === targetStage.competitionName &&
      !hasStageNumberChanged &&
      isSameDatePayload(date, targetStage.date) &&
      isSameDateTimePayload(openAt, targetStage.registration?.openAt) &&
      isSameDateTimePayload(closeAt, targetStage.registration?.closeAt, { endOfDay: true }) &&
      isSameOptionalTextPayload(protocolUrl, targetStage.protocolUrl) &&
      isSameOptionalTextPayload(photoUrl, targetStage.photoUrl) &&
      isSameOptionalTextPayload(certificateUrl, targetStage.certificateUrl) &&
      isSameOptionalTextPayload(memoUrl, targetStage.memoUrl)
    const isRegistrationLimitOnlyUpdate =
      registrationLimit !== undefined &&
      nextLimit !== currentLimit &&
      nextCompetitionName === targetStage.competitionName &&
      !hasStageNumberChanged &&
      isSameDatePayload(date, targetStage.date) &&
      isSameDateTimePayload(openAt, targetStage.registration?.openAt) &&
      isSameDateTimePayload(closeAt, targetStage.registration?.closeAt, { endOfDay: true }) &&
      isSameOptionalTextPayload(protocolUrl, targetStage.protocolUrl) &&
      isSameOptionalTextPayload(photoUrl, targetStage.photoUrl) &&
      isSameOptionalTextPayload(certificateUrl, targetStage.certificateUrl) &&
      isSameOptionalTextPayload(memoUrl, targetStage.memoUrl)

    if (hasStageNumberChanged) {
      const stageAlreadyExists = competitionStages.value.some(
        (item) =>
          item.id !== targetStage.id &&
          item.competitionSlug === competitionSlug &&
          Number(item.stage) === nextStageNumber,
      )

      if (stageAlreadyExists) {
        showToast('Такой этап уже есть в этом соревновании', { type: 'error' })
        throw new Error('Такой этап уже есть в этом соревновании')
      }
    }

    if (isStageUpdateNoop) {
      return
    }

    if (isRegistrationLimitOnlyUpdate) {
      targetStage.registrationLimit = nextLimit
      targetStage.registration = {
        ...targetStage.registration,
        participantLimit: nextLimit,
      }

      await patchCompetitionStageInSource(
        targetStage.id,
        { registration_limit: nextLimit },
        { refresh: false },
      ).catch(() => {
        showToast('Не удалось сохранить лимит мест', { type: 'error' })
        throw new Error('Не удалось сохранить лимит мест')
      })

      const direction = findDirectionBySlug(competitionSlug)
      const directionCardIndex = getDirectionCardIndex(direction, targetStage.stage, targetStage.id)

      if (directionCardIndex >= 0 && direction?.cards?.[directionCardIndex]) {
        direction.cards[directionCardIndex].registrationLimit = nextLimit
        direction.cards[directionCardIndex].registration = {
          ...direction.cards[directionCardIndex].registration,
          participantLimit: nextLimit,
        }
      }

      return
    }

    if (competitionSlug) {
      competitionStages.value
        .filter((stage) => stage.competitionSlug === competitionSlug)
        .forEach((stage) => {
          stage.competitionName = nextCompetitionName
        })
    } else if (competitionName) {
      targetStage.competitionName = competitionName
    }

    if (
      competitionName &&
      previousCompetitionName !== nextCompetitionName &&
      competitionFilter.value === previousCompetitionName
    ) {
      competitionFilter.value = nextCompetitionName
    }

    if (hasDatePayload(date)) {
      targetStage.date = date
    }

    if (hasStageNumberChanged) {
      targetStage.stage = nextStageNumber
      targetStage.title = String(nextStageNumber)
      targetStage.sortOrder = nextStageNumber
    }

    const nextRegistration = {
      ...targetStage.registration,
      competitionDateLabel: formatCompetitionDateLabel(targetStage.date),
    }

    if (registrationLimit !== undefined) {
      const nextLimit = Number(registrationLimit ?? 0) || 0
      targetStage.registrationLimit = nextLimit
      nextRegistration.participantLimit = nextLimit
    }

    if (hasDatePayload(openAt)) {
      nextRegistration.openAt = openAt ? toCompetitionDateTime(openAt) : ''
      nextRegistration.openDateLabel = openAt ? formatCompetitionDateShortLabel(openAt) : ''
    }

    if (hasDatePayload(closeAt)) {
      nextRegistration.closeAt = closeAt ? toCompetitionDateTime(closeAt, { endOfDay: true }) : ''
      nextRegistration.closeDateLabel = closeAt ? formatCompetitionDateShortLabel(closeAt) : ''
    }

    targetStage.registration = {
      ...nextRegistration,
    }

    if (protocolUrl !== undefined) {
      targetStage.protocolUrl = protocolUrl
    }

    if (photoUrl !== undefined) {
      targetStage.photoUrl = photoUrl
    }

    if (certificateUrl !== undefined) {
      targetStage.certificateUrl = certificateUrl
    }

    if (memoUrl !== undefined) {
      targetStage.memoUrl = memoUrl
    }

    await saveCompetitionStageToSource(targetStage).catch(() => {
      showToast('Не удалось сохранить этап соревнования', { type: 'error' })
      throw new Error('Не удалось сохранить этап соревнования')
    })

    await updateCompetitionRegistrationsByStageIdFromSource(
      targetStage.id,
      {
        competitionName: targetStage.competitionName,
        competitionDateLabel: formatCompetitionDateLabel(targetStage.date),
        competitionWindowLabel: resolveCompetitionWindowLabel(targetStage.registration),
      },
    )
      .then(() => refreshStageRegistrationCounts())
      .catch(() => {
        showToast('Не удалось обновить связанные заявки этапа', { type: 'error' })
        throw new Error('Не удалось обновить связанные заявки этапа')
      })

    const direction = findDirectionBySlug(competitionSlug)

    if (!direction) {
      return
    }

    direction.title = nextCompetitionName

    if (competitionName && previousCompetitionName !== nextCompetitionName) {
      await saveCompetitionDirectionTitleToSource(competitionSlug, nextCompetitionName).catch(() => {
        showToast('Не удалось сохранить название соревнования', { type: 'error' })
        throw new Error('Не удалось сохранить название соревнования')
      })
    }

    const directionCardIndex = getDirectionCardIndex(direction, targetStage.stage, targetStage.id)

    if (directionCardIndex < 0 || !direction.cards?.[directionCardIndex]) {
      return
    }

    if (hasDatePayload(date)) {
      direction.cards[directionCardIndex].date = date
    }

    if (hasStageNumberChanged) {
      direction.cards[directionCardIndex].stage = nextStageNumber
      direction.cards[directionCardIndex].title = String(nextStageNumber)
      direction.cards[directionCardIndex].sortOrder = nextStageNumber
    }

    if (protocolUrl !== undefined) {
      direction.cards[directionCardIndex].protocolUrl = protocolUrl
    }

    if (photoUrl !== undefined) {
      direction.cards[directionCardIndex].photoUrl = photoUrl
    }

    if (certificateUrl !== undefined) {
      direction.cards[directionCardIndex].certificateUrl = certificateUrl
    }

    if (memoUrl !== undefined) {
      direction.cards[directionCardIndex].memoUrl = memoUrl
    }

    const nextCardRegistration = {
      ...direction.cards[directionCardIndex].registration,
      competitionDateLabel: formatCompetitionDateLabel(direction.cards[directionCardIndex].date),
    }

    if (registrationLimit !== undefined) {
      const nextLimit = Number(registrationLimit ?? 0) || 0
      direction.cards[directionCardIndex].registrationLimit = nextLimit
      nextCardRegistration.participantLimit = nextLimit
    }

    if (hasDatePayload(openAt)) {
      nextCardRegistration.openAt = openAt ? toCompetitionDateTime(openAt) : ''
      nextCardRegistration.openDateLabel = openAt ? formatCompetitionDateShortLabel(openAt) : ''
    }

    if (hasDatePayload(closeAt)) {
      nextCardRegistration.closeAt = closeAt
        ? toCompetitionDateTime(closeAt, { endOfDay: true })
        : ''
      nextCardRegistration.closeDateLabel = closeAt ? formatCompetitionDateShortLabel(closeAt) : ''
    }

    direction.cards[directionCardIndex].registration = {
      ...nextCardRegistration,
    }
  }

  function updateCompetitionStageLinks(
    stageId,
    { protocolUrl, photoUrl, certificateUrl, memoUrl } = {},
  ) {
    return updateCompetitionStage(stageId, { protocolUrl, photoUrl, certificateUrl, memoUrl })
  }

  async function deleteCompetitionStage(stageId) {
    const targetStage = competitionStages.value.find((stage) => stage.id === stageId)

    if (!targetStage) {
      return
    }

    let activeRegistrationsCount = 0

    try {
      activeRegistrationsCount = await countActiveRegistrationsForStage(targetStage)
    } catch {
      showToast('Не удалось проверить заявки этапа. Этап не удалён.', { type: 'error' })
      throw new Error('Не удалось проверить заявки этапа')
    }

    if (activeRegistrationsCount > 0) {
      showToast('Нельзя удалить этап: на него есть активные заявки', { type: 'error' })
      stageActiveRegistrationCounts.value = {
        ...stageActiveRegistrationCounts.value,
        [stageId]: activeRegistrationsCount,
      }
      throw new Error('На этап есть активные заявки')
    }

    competitionStages.value = competitionStages.value.filter((stage) => stage.id !== stageId)
    await deleteCompetitionStageFromSource(stageId).catch(() => {
      showToast('Не удалось удалить этап соревнования', { type: 'error' })
      throw new Error('Не удалось удалить этап соревнования')
    })

    const direction = findDirectionBySlug(targetStage.competitionSlug)

    if (!direction) {
      return
    }

    const directionCardIndex = getDirectionCardIndex(direction, targetStage.stage, targetStage.id)

    if (directionCardIndex < 0 || !direction.cards?.[directionCardIndex]) {
      return
    }

    direction.cards.splice(directionCardIndex, 1)
    await refreshStageRegistrationCounts()
  }

  function getStageActiveRegistrationsCount(stageId) {
    return stageActiveRegistrationCounts.value[stageId] || 0
  }

  async function updateCompetitionStageDistances(stageId, description = '') {
    const targetStage = competitionStages.value.find((stage) => stage.id === stageId)

    if (!targetStage) {
      return
    }

    const nextDescription = String(description || '').trim()
    targetStage.distanceSummary = nextDescription
    await saveCompetitionStageDistancesToSource(stageId, nextDescription).catch(() => {
      showToast('Не удалось сохранить дистанции этапа', { type: 'error' })
      throw new Error('Не удалось сохранить дистанции этапа')
    })

    const direction = findDirectionBySlug(targetStage.competitionSlug)

    if (!direction) {
      return
    }

    const directionCardIndex = getDirectionCardIndex(direction, targetStage.stage, targetStage.id)

    if (directionCardIndex < 0 || !direction.cards?.[directionCardIndex]) {
      return
    }

    direction.cards[directionCardIndex].description = nextDescription
  }

  function getCompetitionStageDescription(stageId) {
    const targetStage = competitionStages.value.find((stage) => stage.id === stageId)

    if (!targetStage) {
      return ''
    }

    const direction = findDirectionBySlug(targetStage.competitionSlug)

    if (!direction) {
      return targetStage.distanceSummary || ''
    }

    const directionCardIndex = getDirectionCardIndex(direction, targetStage.stage, targetStage.id)

    return direction.cards?.[directionCardIndex]?.description || targetStage.distanceSummary || ''
  }

  async function persistCreatedCompetitionStage({ direction, row, isNewDirection }) {
    if (isNewDirection) {
      await saveCompetitionDirectionToSource(direction)
    }

    await saveCompetitionStageToSource(row)
  }

  async function createCompetitionStage({
    competitionName,
    stage,
    date,
    openAt,
    closeAt,
    protocolUrl = '',
    photoUrl = '',
    certificateUrl = '',
    memoUrl = '',
  } = {}) {
    const normalizedName = String(competitionName || '').trim()
    const normalizedDate = String(date || '').trim()
    const normalizedStage = Number(stage)

    if (!normalizedName || !normalizedDate || !Number.isFinite(normalizedStage)) {
      showToast('Заполните название, этап и дату соревнования', { type: 'error' })
      throw new Error('Заполните название, этап и дату соревнования')
    }

    let direction = findDirectionByName(normalizedName)
    const competitionSlug = direction?.slug || buildSlug(normalizedName)

    const stageAlreadyExists = competitionStages.value.some(
      (item) => item.competitionSlug === competitionSlug && Number(item.stage) === normalizedStage,
    )

    if (stageAlreadyExists) {
      showToast('Такой этап уже есть в календаре', { type: 'error' })
      throw new Error('Такой этап уже есть в календаре')
    }

    const registration = {
      openAt: openAt ? toCompetitionDateTime(openAt) : '',
      closeAt: closeAt ? toCompetitionDateTime(closeAt, { endOfDay: true }) : '',
      openDateLabel: openAt ? formatCompetitionDateShortLabel(openAt) : '',
      closeDateLabel: closeAt ? formatCompetitionDateShortLabel(closeAt) : '',
      competitionDateLabel: formatCompetitionDateLabel(normalizedDate),
      closeNote: DEFAULT_REGISTRATION_NOTE,
      status: undefined,
    }
    const row = createStageRow({
      competitionName: normalizedName,
      competitionSlug,
      stage: normalizedStage,
      title: String(normalizedStage),
      date: normalizedDate,
      protocolUrl,
      photoUrl,
      certificateUrl,
      memoUrl,
      registration,
    })
    const card = {
      id: row.id,
      stage: normalizedStage,
      title: String(normalizedStage),
      sortOrder: normalizedStage,
      date: normalizedDate,
      place: '',
      meta: 'Этап сезона',
      description: 'Программа этапа будет уточняться.',
      status: 'Этап сезона',
      protocolUrl,
      photoUrl,
      certificateUrl,
      memoUrl,
      registrationLimit: 0,
      registration: {
        ...registration,
      },
    }

    const isNewDirection = !direction

    if (isNewDirection) {
      direction = createCompetitionDirection({
        competitionName: normalizedName,
        competitionSlug,
        card,
      })
      competitionDirections.push(direction)
    } else {
      direction.cards.push(card)
    }

    competitionStages.value.push(row)
    await persistCreatedCompetitionStage({
      direction,
      row,
      isNewDirection,
    }).catch((error) => {
      showToast('Не удалось сохранить этап соревнования', { type: 'error' })
      throw error
    })
  }

  watch(
    () => isCompetitionStagesEnabled(),
    (enabled) => {
      if (enabled) {
        startCompetitionApplicationSubscription()
        return
      }

      stageActiveRegistrationCounts.value = {}
      isCompetitionStagesLoading.value = false
      stopCompetitionApplicationSubscription()
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    stopCompetitionApplicationSubscription()
  })

  watch(
    competitionDirections,
    () => {
      competitionStages.value = buildCompetitionStageRows()
      if (isCompetitionStagesEnabled() && !isInitialCompetitionDirectionsLoading) {
        void refreshStageRegistrationCounts()
      }
    },
    { deep: true },
  )

  return {
    competitionStages,
    competitionFilter,
    competitionViewFilter,
    competitionOptions: computed(() => buildCompetitionSeriesOptions()),
    filteredCompetitionStages,
    filteredCompetitionStagesTotal,
    activeCompetitionStagesCount,
    archivedCompetitionStagesCount,
    filteredOpenCompetitionRegistrationsCount,
    openCompetitionRegistrationsCount,
    updateCompetitionStage,
    updateCompetitionStageLinks,
    updateCompetitionStageDistances,
    getCompetitionStageDescription,
    deleteCompetitionStage,
    getStageActiveRegistrationsCount,
    createCompetitionStage,
    isCompetitionStagesLoading,
  }
}

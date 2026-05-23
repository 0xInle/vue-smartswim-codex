import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  buildAccountCompetitionStages,
  buildCompetitionSeriesOptions,
} from '@/pages/account/accountCompetitionStages.data'
import {
  loadAllCompetitionRegistrationsForAdmin,
  subscribeToCompetitionRegistrationChanges,
  updateCompetitionRegistrationsByStageIdFromSource,
} from '@/pages/account/utils/accountCompetitionRegistrations'
import { isCompetitionRegistrationActiveStatus } from '@/pages/account/utils/accountConstants'
import { competitionDirections } from '@/pages/competitions/competitionData'
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
    distanceSummary: 'Программа этапа будет уточняться.',
    registration: {
      ...buildCompetitionRegistrationWindow(date),
      competitionDateLabel: formatCompetitionDateLabel(date),
      closeNote: DEFAULT_REGISTRATION_NOTE,
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

function getDirectionCardIndex(direction, stage) {
  const normalizedStage = Number(stage)
  const cardIndex = direction?.cards?.findIndex(
    (card) => getCardStageNumber(card) === normalizedStage,
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

export function useCompetitionStages() {
  const competitionStages = ref(
    buildAccountCompetitionStages().map((stage) => ({
      ...stage,
      registration: { ...stage.registration },
      protocolUrl: stage.protocolUrl || '',
      photoUrl: stage.photoUrl || '',
    })),
  )
  const competitionFilter = ref('all')
  const competitionViewFilter = ref('active')
  const stageActiveRegistrationCounts = ref({})
  let unsubscribeFromCompetitionApplications = null

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
    try {
      applyStageRegistrationCounts(await loadAllCompetitionRegistrationsForAdmin())
    } catch {
      stageActiveRegistrationCounts.value = {}
    }
  }

  async function countActiveRegistrationsForStage(stage) {
    const registrations = await loadAllCompetitionRegistrationsForAdmin()
    applyStageRegistrationCounts(registrations)

    return registrations.filter(
      (registration) =>
        registrationMatchesStage(registration, stage) &&
        isCompetitionRegistrationActiveStatus(registration.status),
    ).length
  }

  async function updateCompetitionStage(
    stageId,
    { competitionName, date, openAt, closeAt, protocolUrl, photoUrl } = {},
  ) {
    const targetStage = competitionStages.value.find((stage) => stage.id === stageId)

    if (!targetStage) {
      return
    }

    const competitionSlug = targetStage.competitionSlug
    const previousCompetitionName = targetStage.competitionName
    const nextCompetitionName = competitionName || targetStage.competitionName

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

    if (date !== undefined) {
      targetStage.date = date
    }

    const nextRegistration = {
      ...targetStage.registration,
      competitionDateLabel: formatCompetitionDateLabel(targetStage.date),
    }

    if (openAt !== undefined) {
      nextRegistration.openAt = openAt ? toCompetitionDateTime(openAt) : ''
      nextRegistration.openDateLabel = openAt ? formatCompetitionDateShortLabel(openAt) : ''
    }

    if (closeAt !== undefined) {
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

    void updateCompetitionRegistrationsByStageIdFromSource(
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
      })

    const direction = findDirectionBySlug(competitionSlug)

    if (!direction) {
      return
    }

    direction.title = nextCompetitionName

    const directionCardIndex = getDirectionCardIndex(direction, targetStage.stage)

    if (directionCardIndex < 0 || !direction.cards?.[directionCardIndex]) {
      return
    }

    if (date !== undefined) {
      direction.cards[directionCardIndex].date = date
    }

    if (protocolUrl !== undefined) {
      direction.cards[directionCardIndex].protocolUrl = protocolUrl
    }

    if (photoUrl !== undefined) {
      direction.cards[directionCardIndex].photoUrl = photoUrl
    }

    const nextCardRegistration = {
      ...direction.cards[directionCardIndex].registration,
      competitionDateLabel: formatCompetitionDateLabel(direction.cards[directionCardIndex].date),
    }

    if (openAt !== undefined) {
      nextCardRegistration.openAt = openAt ? toCompetitionDateTime(openAt) : ''
      nextCardRegistration.openDateLabel = openAt ? formatCompetitionDateShortLabel(openAt) : ''
    }

    if (closeAt !== undefined) {
      nextCardRegistration.closeAt = closeAt
        ? toCompetitionDateTime(closeAt, { endOfDay: true })
        : ''
      nextCardRegistration.closeDateLabel = closeAt ? formatCompetitionDateShortLabel(closeAt) : ''
    }

    direction.cards[directionCardIndex].registration = {
      ...nextCardRegistration,
    }
  }

  function updateCompetitionStageLinks(stageId, { protocolUrl, photoUrl } = {}) {
    void updateCompetitionStage(stageId, { protocolUrl, photoUrl })
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
      return
    }

    if (activeRegistrationsCount > 0) {
      showToast('Нельзя удалить этап: на него есть активные заявки', { type: 'error' })
      stageActiveRegistrationCounts.value = {
        ...stageActiveRegistrationCounts.value,
        [stageId]: activeRegistrationsCount,
      }
      return
    }

    competitionStages.value = competitionStages.value.filter((stage) => stage.id !== stageId)

    const direction = findDirectionBySlug(targetStage.competitionSlug)

    if (!direction) {
      return
    }

    const directionCardIndex = getDirectionCardIndex(direction, targetStage.stage)

    if (directionCardIndex < 0 || !direction.cards?.[directionCardIndex]) {
      return
    }

    direction.cards.splice(directionCardIndex, 1)
    void refreshStageRegistrationCounts()
  }

  function getStageActiveRegistrationsCount(stageId) {
    return stageActiveRegistrationCounts.value[stageId] || 0
  }

  function updateCompetitionStageDistances(stageId, description = '') {
    const targetStage = competitionStages.value.find((stage) => stage.id === stageId)

    if (!targetStage) {
      return
    }

    const nextDescription = String(description || '').trim()
    targetStage.distanceSummary = nextDescription

    const direction = findDirectionBySlug(targetStage.competitionSlug)

    if (!direction) {
      return
    }

    const directionCardIndex = getDirectionCardIndex(direction, targetStage.stage)

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

    const directionCardIndex = getDirectionCardIndex(direction, targetStage.stage)

    return direction.cards?.[directionCardIndex]?.description || targetStage.distanceSummary || ''
  }

  function createCompetitionStage({
    competitionName,
    stage,
    date,
    openAt,
    closeAt,
    protocolUrl = '',
    photoUrl = '',
  } = {}) {
    const normalizedName = String(competitionName || '').trim()
    const normalizedDate = String(date || '').trim()
    const normalizedStage = Number(stage)

    if (!normalizedName || !normalizedDate || !Number.isFinite(normalizedStage)) {
      showToast('Заполните название, этап и дату соревнования', { type: 'error' })
      return
    }

    let direction = findDirectionByName(normalizedName)
    const competitionSlug = direction?.slug || buildSlug(normalizedName)

    const stageAlreadyExists = competitionStages.value.some(
      (item) => item.competitionSlug === competitionSlug && Number(item.stage) === normalizedStage,
    )

    if (stageAlreadyExists) {
      showToast('Такой этап уже есть в календаре', { type: 'error' })
      return
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
      date: normalizedDate,
      protocolUrl,
      photoUrl,
      registration,
    })
    const card = {
      title: String(normalizedStage),
      date: normalizedDate,
      place: '',
      meta: 'Этап сезона',
      description: 'Программа этапа будет уточняться.',
      status: 'Этап сезона',
      protocolUrl,
      photoUrl,
      registration: {
        ...registration,
      },
    }

    if (!direction) {
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
  }

  onMounted(() => {
    void refreshStageRegistrationCounts()

    unsubscribeFromCompetitionApplications = subscribeToCompetitionRegistrationChanges(() => {
      void refreshStageRegistrationCounts()
    })
  })

  onBeforeUnmount(() => {
    if (unsubscribeFromCompetitionApplications) {
      unsubscribeFromCompetitionApplications()
      unsubscribeFromCompetitionApplications = null
    }
  })

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
  }
}

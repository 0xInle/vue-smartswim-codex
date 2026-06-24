import { competitionDirections } from '@/pages/competitions/competitionData'
import {
  buildCompetitionRegistrationWindow,
  formatCompetitionDateLabel,
  formatCompetitionDateShortLabel,
} from '@/utils/competitionRegistration'

const DEFAULT_REGISTRATION_NOTE = 'Регистрация открывается за 21 день и закрывается за 3 дня до этапа.'

const PRESEASON_STAGE_DATES = [
  { stage: 1, date: '2026-01-25' },
  { stage: 2, date: '2026-02-22' },
  { stage: 3, date: '2026-03-29' },
]

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
}

function getCardStageNumber(card, fallbackStage) {
  const explicitStage = Number(card?.stage)

  if (Number.isFinite(explicitStage) && explicitStage >= 0) {
    return explicitStage
  }

  const title = String(card?.title || '').trim().toUpperCase()
  const numericTitle = Number(title)

  if (Number.isFinite(numericTitle) && numericTitle >= 0) {
    return numericTitle
  }

  if (ROMAN_STAGE_VALUES[title]) {
    return ROMAN_STAGE_VALUES[title]
  }

  const idMatch = String(card?.id || '').match(/stage-(\d+)$/)

  if (idMatch) {
    return Number(idMatch[1]) || fallbackStage
  }

  return fallbackStage
}

function createCompetitionStageRow({
  id = '',
  competitionName,
  competitionSlug,
  stage,
  title = String(stage),
  sortOrder = stage,
  date,
  protocolUrl = '',
  photoUrl = '',
  certificateUrl = '',
  memoUrl = '',
  distanceSummary = '',
  registrationLimit = 0,
  registrationNote = DEFAULT_REGISTRATION_NOTE,
  registration = null,
}) {
  return {
    id: id || `${competitionSlug}-stage-${stage}`,
    competitionName,
    competitionSlug,
    stage,
    title,
    sortOrder,
    date,
    protocolUrl,
    photoUrl,
    certificateUrl,
    memoUrl,
    distanceSummary,
    registrationLimit,
    registration: {
      ...buildCompetitionRegistrationWindow(date),
      competitionDateLabel: formatCompetitionDateLabel(date),
      closeNote: registrationNote,
      participantLimit: registrationLimit,
      ...registration,
    },
  }
}

function buildCompetitionSeriesStages(direction) {
  const competitionName = direction.title
  const competitionSlug = direction.slug
  const cardStageNumbers = new Set(
    direction.cards
      .map((card, index) => getCardStageNumber(card, index + 4))
      .filter((stage) => Number.isFinite(stage)),
  )
  const stageRows = PRESEASON_STAGE_DATES.filter((item) => !cardStageNumbers.has(item.stage)).map(
    (item) =>
      createCompetitionStageRow({
        competitionName,
        competitionSlug,
        stage: item.stage,
        sortOrder: item.stage - 4,
        date: item.date,
        distanceSummary: 'Программа этапа будет уточняться.',
      }),
  )

  direction.cards.forEach((card, index) => {
    const stage = getCardStageNumber(card, index + 4)
    const registrationWindow = buildCompetitionRegistrationWindow(card.date)
    const nextRegistration = {
      ...registrationWindow,
      ...card.registration,
      competitionDateLabel: card.registration?.competitionDateLabel || formatCompetitionDateLabel(card.date),
      closeNote: card.registration?.closeNote || DEFAULT_REGISTRATION_NOTE,
    }

    if (nextRegistration.openAt && !card.registration?.openDateLabel) {
      nextRegistration.openDateLabel = formatCompetitionDateShortLabel(nextRegistration.openAt)
    }

    if (nextRegistration.closeAt && !card.registration?.closeDateLabel) {
      nextRegistration.closeDateLabel = formatCompetitionDateShortLabel(nextRegistration.closeAt)
    }

    stageRows.push(
      createCompetitionStageRow({
        id: card.id || '',
        competitionName,
        competitionSlug,
        stage,
        title: card.title || String(stage),
        sortOrder: Number(card.sortOrder ?? index + 1),
        date: card.date,
        protocolUrl: card.protocolUrl || '',
        photoUrl: card.photoUrl || '',
        certificateUrl: card.certificateUrl || '',
        memoUrl: card.memoUrl || '',
        registrationLimit: Number(card.registrationLimit ?? card.registration?.participantLimit ?? 0),
        distanceSummary: card.description || 'Программа этапа будет уточняться.',
        registration: nextRegistration,
      }),
    )
  })

  return stageRows
}

export function buildAccountCompetitionStages() {
  return competitionDirections.flatMap((direction) => buildCompetitionSeriesStages(direction))
}

export function buildCompetitionSeriesOptions() {
  return [
    { value: 'all', label: 'Все соревнования' },
    ...competitionDirections.map((direction) => ({
      value: direction.title,
      label: direction.title,
    })),
  ]
}

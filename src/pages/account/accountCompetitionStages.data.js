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

function createCompetitionStageRow({
  competitionName,
  competitionSlug,
  stage,
  title = String(stage),
  date,
  protocolUrl = '',
  photoUrl = '',
  distanceSummary = '',
  registrationNote = DEFAULT_REGISTRATION_NOTE,
  registration = null,
}) {
  return {
    id: `${competitionSlug}-stage-${stage}`,
    competitionName,
    competitionSlug,
    stage,
    title,
    date,
    protocolUrl,
    photoUrl,
    distanceSummary,
    registration: {
      ...buildCompetitionRegistrationWindow(date),
      competitionDateLabel: formatCompetitionDateLabel(date),
      closeNote: registrationNote,
      ...(registration || {}),
    },
  }
}

function buildCompetitionSeriesStages(direction) {
  const competitionName = direction.title
  const competitionSlug = direction.slug
  const stageRows = PRESEASON_STAGE_DATES.map((item) =>
    createCompetitionStageRow({
      competitionName,
      competitionSlug,
      stage: item.stage,
      date: item.date,
      distanceSummary: 'Программа этапа будет уточняться.',
    }),
  )

  direction.cards.forEach((card, index) => {
    const stage = index + 4
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
        competitionName,
        competitionSlug,
        stage,
        title: card.title || String(stage),
        date: card.date,
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

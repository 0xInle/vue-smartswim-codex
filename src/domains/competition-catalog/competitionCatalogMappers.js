import { publicAsset } from '@/utils/publicAsset'

const DEFAULT_DOCUMENTS_ROUTE = '/documents'
const DEFAULT_REGISTRATION_NOTE =
  'Регистрация открывается за 21 день и закрывается за 3 дня до этапа.'

function toPublicAssetPath(value) {
  const path = String(value || '').trim()

  if (!path || /^(https?:)?\/\//i.test(path)) {
    return path
  }

  return path.startsWith('/') ? publicAsset(path) : path
}

function normalizeSortNumber(value, fallback = 0) {
  const numericValue = Number(value)

  return Number.isFinite(numericValue) ? numericValue : fallback
}

function mapRegistrationOption(row = {}) {
  return {
    id: row.option_key || row.id || '',
    title: row.title || '',
    dateLabel: row.date_label || '',
    priceLabel: row.price_label || '',
    actionLabel: row.action_label || '',
  }
}

function mapFaqSection(row = {}, items = []) {
  return {
    title: row.title || '',
    items: items
      .slice()
      .sort((left, right) => normalizeSortNumber(left.sort_order) - normalizeSortNumber(right.sort_order))
      .map((item) => ({
        question: item.question || '',
        answer: item.answer || '',
      })),
  }
}

function mapStageRegistration(row = {}) {
  const registration = {
    competitionDateLabel: row.registration_competition_date_label || row.date_label || '',
    closeNote: row.registration_close_note || DEFAULT_REGISTRATION_NOTE,
  }

  if (row.registration_status) {
    registration.status = row.registration_status
  }

  if (row.registration_open_at) {
    registration.openAt = row.registration_open_at
  }

  if (row.registration_close_at) {
    registration.closeAt = row.registration_close_at
  }

  if (row.registration_open_date_label) {
    registration.openDateLabel = row.registration_open_date_label
  }

  if (row.registration_close_date_label) {
    registration.closeDateLabel = row.registration_close_date_label
  }

  if (row.registration_closed_title) {
    registration.closedTitle = row.registration_closed_title
  }

  if (row.registration_closed_text) {
    registration.closedText = row.registration_closed_text
  }

  return registration
}

function mapStageDescription(row = {}, distances = []) {
  if (row.description) {
    return row.description
  }

  return distances
    .slice()
    .sort((left, right) => normalizeSortNumber(left.sort_order) - normalizeSortNumber(right.sort_order))
    .map((distance) => distance.raw_text || [distance.distance_label, distance.stroke_label].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(', ')
}

function mapCompetitionRegistration(row = {}, options = [], registrationFaqSections = []) {
  const registration = {
    documentsRoute: row.documents_route || DEFAULT_DOCUMENTS_ROUTE,
    options: options
      .slice()
      .sort((left, right) => normalizeSortNumber(left.sort_order) - normalizeSortNumber(right.sort_order))
      .map(mapRegistrationOption),
    faqSections: registrationFaqSections,
  }

  if (row.registration_status) {
    registration.status = row.registration_status
  }

  if (row.registration_closed_title) {
    registration.closedTitle = row.registration_closed_title
  }

  if (row.registration_closed_text) {
    registration.closedText = row.registration_closed_text
  }

  if (row.position_url) {
    registration.positionUrl = toPublicAssetPath(row.position_url)
  }

  return registration
}

function groupBy(source = [], getKey) {
  return source.reduce((acc, item) => {
    const key = getKey(item)

    if (!acc.has(key)) {
      acc.set(key, [])
    }

    acc.get(key).push(item)
    return acc
  }, new Map())
}

function getFaqSections({ competitionId, placement, sectionsByCompetitionPlacement, itemsBySection }) {
  const key = `${competitionId}:${placement}`

  return (sectionsByCompetitionPlacement.get(key) || [])
    .slice()
    .sort((left, right) => normalizeSortNumber(left.sort_order) - normalizeSortNumber(right.sort_order))
    .map((section) => mapFaqSection(section, itemsBySection.get(section.id) || []))
}

export function mapNormalizedCompetitionCatalog({
  competitions = [],
  stages = [],
  distances = [],
  options = [],
  faqSections = [],
  faqItems = [],
} = {}) {
  const stagesByCompetition = groupBy(stages, (stage) => stage.competition_id || '')
  const distancesByStage = groupBy(distances, (distance) => distance.stage_id || '')
  const optionsByCompetition = groupBy(options, (option) => option.competition_id || '')
  const faqSectionsByCompetitionPlacement = groupBy(
    faqSections,
    (section) => `${section.competition_id || ''}:${section.placement || 'detail'}`,
  )
  const faqItemsBySection = groupBy(faqItems, (item) => item.section_id || '')

  return competitions
    .slice()
    .sort((left, right) => normalizeSortNumber(left.sort_order) - normalizeSortNumber(right.sort_order))
    .map((competition) => {
      const competitionId = competition.id || competition.slug || ''
      const detailFaqSections = getFaqSections({
        competitionId,
        placement: 'detail',
        sectionsByCompetitionPlacement: faqSectionsByCompetitionPlacement,
        itemsBySection: faqItemsBySection,
      })
      const registrationFaqSections = getFaqSections({
        competitionId,
        placement: 'registration',
        sectionsByCompetitionPlacement: faqSectionsByCompetitionPlacement,
        itemsBySection: faqItemsBySection,
      })

      return {
        slug: competition.slug || competitionId,
        badge: competition.badge || '',
        title: competition.title || '',
        subtitle: competition.subtitle || '',
        summary: competition.summary || '',
        description: competition.description || '',
        location: competition.location || '',
        season: competition.season || '',
        registration: mapCompetitionRegistration(
          competition,
          optionsByCompetition.get(competitionId) || [],
          registrationFaqSections,
        ),
        image: toPublicAssetPath(competition.image_url),
        imageAlt: competition.image_alt || competition.title || '',
        cards: (stagesByCompetition.get(competitionId) || [])
          .filter((stage) => stage.is_public !== false)
          .slice()
          .sort((left, right) => normalizeSortNumber(left.sort_order) - normalizeSortNumber(right.sort_order))
          .map((stage) => ({
            id: stage.id || '',
            title: stage.title || String(stage.stage_number || ''),
            date: stage.date_label || stage.stage_date || '',
            place: stage.place || '',
            meta: stage.meta || '',
            description: mapStageDescription(stage, distancesByStage.get(stage.id) || []),
            status: stage.status || '',
            protocolUrl: stage.protocol_url || '',
            photoUrl: stage.photo_url || '',
            registration: mapStageRegistration(stage),
          })),
        faqSections: detailFaqSections,
      }
    })
}

export function mapCompetitionUpsertPayload(competition = {}) {
  const registration = competition.registration || {}
  const slug = competition.slug || competition.id || ''

  return {
    id: slug,
    slug,
    badge: competition.badge || 'Соревнования по плаванию',
    title: competition.title || '',
    subtitle: competition.subtitle || '',
    summary: competition.summary || 'Календарь соревнований.',
    description: competition.description || 'Соревнование добавлено через админ-панель.',
    location: competition.location || '',
    season: competition.season || 'Сезон 2026',
    image_url: competition.image || '/images/04-img.webp',
    image_alt: competition.imageAlt || competition.title || '',
    registration_status: registration.status || null,
    registration_closed_title: registration.closedTitle || null,
    registration_closed_text: registration.closedText || null,
    position_url: registration.positionUrl || null,
    documents_route: registration.documentsRoute || DEFAULT_DOCUMENTS_ROUTE,
    sort_order: normalizeSortNumber(competition.sortOrder),
  }
}

export function mapStageUpsertPayload(stage = {}) {
  const registration = stage.registration || {}

  return {
    id: stage.id || '',
    competition_id: stage.competitionSlug || stage.competitionId || '',
    stage_number: normalizeSortNumber(stage.stage),
    title: stage.title || String(stage.stage || ''),
    date_label: stage.date || '',
    stage_date: /^\d{4}-\d{2}-\d{2}$/.test(String(stage.date || '')) ? stage.date : null,
    place: stage.place || '',
    meta: stage.meta || '',
    description: stage.distanceSummary || stage.description || '',
    status: stage.status || 'Этап сезона',
    protocol_url: stage.protocolUrl || '',
    photo_url: stage.photoUrl || '',
    registration_status: registration.status || null,
    registration_open_at: registration.openAt || null,
    registration_close_at: registration.closeAt || null,
    registration_open_date_label: registration.openDateLabel || null,
    registration_close_date_label: registration.closeDateLabel || null,
    registration_competition_date_label: registration.competitionDateLabel || null,
    registration_close_note: registration.closeNote || DEFAULT_REGISTRATION_NOTE,
    registration_closed_title: registration.closedTitle || null,
    registration_closed_text: registration.closedText || null,
    is_public: stage.isPublic !== false,
    sort_order: normalizeSortNumber(stage.sortOrder, normalizeSortNumber(stage.stage)),
  }
}

export function splitStageDescriptionToDistanceRows(stageId, description = '') {
  return String(description || '')
    .split(',')
    .map((item) => item.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .map((rawText, index) => {
      const match = rawText.match(/^(\d+\s*м)\s+(.+)$/i)
      const sortOrder = index + 1

      return {
        id: `${stageId}-distance-${sortOrder}`,
        stage_id: stageId,
        distance_label: match?.[1] || rawText,
        stroke_label: match?.[2] || '',
        raw_text: rawText,
        sort_order: sortOrder,
      }
    })
}

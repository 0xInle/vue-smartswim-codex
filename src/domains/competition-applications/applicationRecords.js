import {
  APPLICATION_STATUS,
  normalizeApplicationStatus,
} from './applicationLifecycle.js'

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

export function createCompetitionApplicationId() {
  return `registration-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getCompetitionApplicationStageNumber(card) {
  const title = String(card?.title || '')
    .trim()
    .toUpperCase()
  const numericTitle = Number(title)

  if (Number.isFinite(numericTitle)) {
    return numericTitle
  }

  return ROMAN_STAGE_VALUES[title] || null
}

export function resolveCompetitionApplicationStageId(competitionSlug, card) {
  const stageNumber = getCompetitionApplicationStageNumber(card)

  if (!competitionSlug || !Number.isFinite(stageNumber)) {
    return ''
  }

  return `${competitionSlug}-stage-${stageNumber}`
}

export function normalizeCompetitionApplicationRecord(item = {}, sourceUserKey = '') {
  const createdAt = item.createdAt || new Date().toISOString()
  const status = normalizeApplicationStatus(item.status)
  const statusChangedAt = item.statusChangedAt || createdAt
  const updatedAt = item.updatedAt || statusChangedAt

  return {
    id: item.id || createCompetitionApplicationId(),
    competitionSlug: item.competitionSlug || '',
    competitionName: item.competitionName || '',
    stageId: item.stageId || '',
    stageLabel: item.stageLabel || '',
    competitionDateLabel: item.competitionDateLabel || '',
    competitionWindowLabel: item.competitionWindowLabel || '',
    participantKind: item.participantKind || 'owner',
    participantId: item.participantId || 'owner',
    participantName: item.participantName || '',
    participantBirthDate: item.participantBirthDate || '',
    participantClub: item.participantClub || '',
    participantPhone: item.participantPhone || '',
    participantEmail: item.participantEmail || '',
    ownerName: item.ownerName || '',
    ownerEmail: item.ownerEmail || '',
    ownerPhone: item.ownerPhone || '',
    registrationKind: item.registrationKind || 'individual',
    paymentOptionId: item.paymentOptionId || '',
    paymentOptionTitle: item.paymentOptionTitle || '',
    teamName: item.teamName || '',
    seedTime: item.seedTime || '',
    comment: item.comment || '',
    status,
    createdAt,
    statusChangedAt,
    updatedAt,
    statusChangedBy: item.statusChangedBy || '',
    sourceUserKey,
  }
}

export function createCompetitionApplicationRecord(payload = {}) {
  const createdAt = payload.createdAt || new Date().toISOString()

  return {
    id: createCompetitionApplicationId(),
    competitionSlug: payload.competitionSlug || '',
    competitionName: payload.competitionName || '',
    stageId: payload.stageId || '',
    stageLabel: payload.stageLabel || '',
    competitionDateLabel: payload.competitionDateLabel || '',
    competitionWindowLabel: payload.competitionWindowLabel || '',
    participantKind: payload.participantKind || 'owner',
    participantId: payload.participantId || 'owner',
    participantName: payload.participantName || '',
    participantBirthDate: payload.participantBirthDate || '',
    participantClub: payload.participantClub || '',
    participantPhone: payload.participantPhone || '',
    participantEmail: payload.participantEmail || '',
    ownerName: payload.ownerName || '',
    ownerEmail: payload.ownerEmail || '',
    ownerPhone: payload.ownerPhone || '',
    registrationKind: payload.registrationKind || 'individual',
    paymentOptionId: payload.paymentOptionId || '',
    paymentOptionTitle: payload.paymentOptionTitle || '',
    teamName: payload.teamName || '',
    seedTime: payload.seedTime || '',
    comment: payload.comment || '',
    status: normalizeApplicationStatus(payload.status || APPLICATION_STATUS.SUBMITTED),
    createdAt,
    statusChangedAt: payload.statusChangedAt || createdAt,
    updatedAt: payload.updatedAt || payload.statusChangedAt || createdAt,
    statusChangedBy: payload.statusChangedBy || 'user',
  }
}

export function applyCompetitionApplicationPatch(
  application,
  patch = {},
  { statusChangedBy = 'user' } = {},
) {
  const normalizedApplication = normalizeCompetitionApplicationRecord(
    application,
    application?.sourceUserKey || '',
  )
  const hasStatusPatch = Object.prototype.hasOwnProperty.call(patch, 'status')
  const nextStatus = hasStatusPatch
    ? normalizeApplicationStatus(patch.status)
    : normalizedApplication.status
  const nextCreatedAt = patch.createdAt || normalizedApplication.createdAt || new Date().toISOString()
  const now = new Date().toISOString()
  const nextStatusChangedAt =
    hasStatusPatch && nextStatus !== normalizedApplication.status
      ? patch.statusChangedAt || now
      : normalizedApplication.statusChangedAt
  const nextUpdatedAt = patch.updatedAt || now

  return {
    ...normalizedApplication,
    ...patch,
    status: nextStatus,
    createdAt: nextCreatedAt,
    statusChangedAt: nextStatusChangedAt,
    updatedAt: nextUpdatedAt,
    statusChangedBy: patch.statusChangedBy || statusChangedBy,
    sourceUserKey: patch.sourceUserKey || normalizedApplication.sourceUserKey,
  }
}

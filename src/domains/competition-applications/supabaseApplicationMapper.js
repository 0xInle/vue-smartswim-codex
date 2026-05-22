import { normalizeCompetitionApplicationRecord } from './applicationRecords.js'

const INSERT_FIELD_MAP = Object.freeze({
  ownerEmail: 'owner_email',
  ownerName: 'owner_name',
  ownerPhone: 'owner_phone',
  participantKind: 'participant_kind',
  participantId: 'participant_id',
  competitionSlug: 'competition_slug',
  competitionName: 'competition_name',
  stageId: 'stage_id',
  stageLabel: 'stage_label',
  competitionDateLabel: 'competition_date_label',
  competitionWindowLabel: 'competition_window_label',
  registrationKind: 'registration_kind',
  paymentOptionId: 'payment_option_id',
  paymentOptionTitle: 'payment_option_title',
  teamName: 'team_name',
  seedTime: 'seed_time',
  comment: 'comment',
  status: 'status',
  statusChangedBy: 'status_changed_by',
})

const UPDATE_FIELD_MAP = Object.freeze({
  competitionSlug: 'competition_slug',
  competitionName: 'competition_name',
  stageId: 'stage_id',
  stageLabel: 'stage_label',
  competitionDateLabel: 'competition_date_label',
  competitionWindowLabel: 'competition_window_label',
  registrationKind: 'registration_kind',
  paymentOptionId: 'payment_option_id',
  paymentOptionTitle: 'payment_option_title',
  teamName: 'team_name',
  seedTime: 'seed_time',
  comment: 'comment',
  status: 'status',
  statusChangedBy: 'status_changed_by',
})

function readSnapshotValue(snapshot, keys, fallback = '') {
  if (!snapshot || typeof snapshot !== 'object') {
    return fallback
  }

  const foundKey = keys.find((key) => snapshot[key] !== undefined && snapshot[key] !== null)

  return foundKey ? snapshot[foundKey] : fallback
}

function buildParticipantSnapshot(application = {}) {
  return {
    name: application.participantName || '',
    birthDate: application.participantBirthDate || '',
    club: application.participantClub || '',
    phone: application.participantPhone || '',
    email: application.participantEmail || '',
  }
}

function assignMappedFields(target, source, fieldMap) {
  Object.entries(fieldMap).forEach(([sourceKey, targetKey]) => {
    if (Object.prototype.hasOwnProperty.call(source, sourceKey)) {
      target[targetKey] = source[sourceKey] ?? ''
    }
  })

  return target
}

export function mapSupabaseCompetitionApplicationRow(row = {}) {
  const participantSnapshot = row.participant_snapshot || {}
  const application = normalizeCompetitionApplicationRecord(
    {
      id: row.id,
      competitionSlug: row.competition_slug,
      competitionName: row.competition_name,
      stageId: row.stage_id,
      stageLabel: row.stage_label,
      competitionDateLabel: row.competition_date_label,
      competitionWindowLabel: row.competition_window_label,
      participantKind: row.participant_kind,
      participantId: row.participant_id,
      participantName: readSnapshotValue(participantSnapshot, ['name', 'fullName']),
      participantBirthDate: readSnapshotValue(participantSnapshot, ['birthDate', 'birth_date']),
      participantClub: readSnapshotValue(participantSnapshot, ['club']),
      participantPhone: readSnapshotValue(participantSnapshot, ['phone']),
      participantEmail: readSnapshotValue(participantSnapshot, ['email']),
      ownerName: row.owner_name,
      ownerEmail: row.owner_email,
      ownerPhone: row.owner_phone,
      registrationKind: row.registration_kind,
      paymentOptionId: row.payment_option_id,
      paymentOptionTitle: row.payment_option_title,
      teamName: row.team_name,
      seedTime: row.seed_time,
      comment: row.comment,
      status: row.status,
      createdAt: row.created_at,
      statusChangedAt: row.status_changed_at,
      updatedAt: row.updated_at,
      statusChangedBy: row.status_changed_by,
    },
    row.owner_user_id || '',
  )

  return application
}

export function mapCompetitionApplicationInsertPayload(
  application = {},
  { ownerUserId = '' } = {},
) {
  const normalizedApplication = normalizeCompetitionApplicationRecord(
    application,
    ownerUserId || application.sourceUserKey || '',
  )
  const payload = assignMappedFields({}, normalizedApplication, INSERT_FIELD_MAP)

  payload.owner_user_id = ownerUserId || normalizedApplication.sourceUserKey || null
  payload.participant_snapshot = buildParticipantSnapshot(normalizedApplication)

  return payload
}

export function mapCompetitionApplicationUpdatePayload(patch = {}) {
  const payload = assignMappedFields({}, patch, UPDATE_FIELD_MAP)
  const participantSnapshotKeys = [
    'participantName',
    'participantBirthDate',
    'participantClub',
    'participantPhone',
    'participantEmail',
  ]
  const hasCompleteParticipantSnapshot = participantSnapshotKeys.every((key) =>
    Object.prototype.hasOwnProperty.call(patch, key),
  )

  if (hasCompleteParticipantSnapshot) {
    payload.participant_snapshot = buildParticipantSnapshot(patch)
  }

  return payload
}

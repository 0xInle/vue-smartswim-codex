import {
  ATHLETE_APPLICATION_STATUS,
  CONSULTATION_STATUS,
} from '@/pages/account/utils/accountConstants'
import { formatDateForInput, formatDateForSupabase } from '@/domains/account-data/accountDataMappers'

const ALLOWED_WORKFLOW_STATUSES = new Set([
  ...Object.values(ATHLETE_APPLICATION_STATUS),
  ...Object.values(CONSULTATION_STATUS),
])

export function getAccountWorkflowId({ ownerUserKey, scope, scopeId }) {
  return [ownerUserKey || 'anonymous', scope || 'profile', scopeId || 'profile'].join(':')
}

export function normalizeAccountWorkflowStatus(status) {
  return ALLOWED_WORKFLOW_STATUSES.has(status) ? status : CONSULTATION_STATUS.NEW
}

function normalizeBaseWorkflowRecord(record = {}) {
  const ownerUserKey = record.ownerUserKey || record.ownerUserId || ''
  const scope = record.scope || 'profile'
  const scopeId = record.scopeId || 'profile'

  return {
    id: record.id || getAccountWorkflowId({ ownerUserKey, scope, scopeId }),
    ownerUserId: record.ownerUserId || ownerUserKey,
    ownerUserKey,
    ownerName: record.ownerName || '',
    ownerEmail: record.ownerEmail || '',
    ownerPhone: record.ownerPhone || '',
    scope,
    scopeId,
    participantName: record.participantName || '',
    participantBirthDate: record.participantBirthDate || '',
    participantClub: record.participantClub || '',
    participantKind: record.participantKind || (scope === 'athlete' ? 'athlete' : 'owner'),
    status: normalizeAccountWorkflowStatus(record.status),
    note: record.note || '',
    createdAt: record.createdAt || record.updatedAt || '',
    updatedAt: record.updatedAt || record.createdAt || '',
  }
}

export function mapSupabaseAthleteApplicationRow(row = {}) {
  return {
    ...normalizeBaseWorkflowRecord({
      id: row.id,
      ownerUserId: row.owner_user_id || '',
      ownerUserKey: row.owner_user_id || '',
      ownerName: row.owner_name || '',
      ownerEmail: row.owner_email || '',
      ownerPhone: row.owner_phone || '',
      scope: row.scope || 'athlete',
      scopeId: row.scope_id || 'profile',
      participantName: row.participant_name || '',
      participantBirthDate: formatDateForInput(row.participant_birth_date),
      participantClub: row.participant_club || '',
      participantKind: row.participant_kind || 'athlete',
      status: row.status,
      note: row.note || '',
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || '',
    }),
    updatedBy: row.updated_by || '',
  }
}

export function mapAthleteApplicationUpsertPayload(record = {}, { ownerUserId = '' } = {}) {
  const normalizedRecord = normalizeBaseWorkflowRecord({
    ...record,
    ownerUserId: ownerUserId || record.ownerUserId || record.ownerUserKey,
    ownerUserKey: ownerUserId || record.ownerUserKey || record.ownerUserId,
  })

  return {
    id: normalizedRecord.id,
    owner_user_id: normalizedRecord.ownerUserId || ownerUserId || null,
    owner_email: normalizedRecord.ownerEmail || null,
    owner_name: normalizedRecord.ownerName || null,
    owner_phone: normalizedRecord.ownerPhone || null,
    scope: normalizedRecord.scope,
    scope_id: normalizedRecord.scopeId,
    participant_name: normalizedRecord.participantName || null,
    participant_birth_date: formatDateForSupabase(normalizedRecord.participantBirthDate),
    participant_club: normalizedRecord.participantClub || null,
    participant_kind: normalizedRecord.participantKind,
    status: normalizedRecord.status,
    note: normalizedRecord.note || null,
    updated_by: record.updatedBy || null,
  }
}

export function mapSupabaseAdmissionRow(row = {}) {
  return {
    ...normalizeBaseWorkflowRecord({
      id: row.id,
      ownerUserId: row.owner_user_id || '',
      ownerUserKey: row.owner_user_id || '',
      ownerName: row.owner_name || '',
      ownerEmail: row.owner_email || '',
      scope: row.scope || 'profile',
      scopeId: row.scope_id || 'profile',
      participantName: row.participant_name || '',
      participantBirthDate: formatDateForInput(row.participant_birth_date),
      participantClub: row.participant_club || '',
      participantKind: row.participant_kind || 'owner',
      status: row.status,
      note: row.note || '',
      createdAt: row.created_at || row.admitted_at || '',
      updatedAt: row.updated_at || row.admitted_at || '',
    }),
    admittedAt: row.admitted_at || '',
    admittedBy: row.admitted_by || '',
    emailNotificationStatus: row.email_notification_status || 'pending',
    emailNotificationAt: row.email_notification_at || '',
  }
}

export function mapAdmissionUpsertPayload(record = {}, { ownerUserId = '' } = {}) {
  const normalizedRecord = normalizeBaseWorkflowRecord({
    ...record,
    ownerUserId: ownerUserId || record.ownerUserId || record.ownerUserKey,
    ownerUserKey: ownerUserId || record.ownerUserKey || record.ownerUserId,
  })

  return {
    id: normalizedRecord.id,
    owner_user_id: normalizedRecord.ownerUserId || ownerUserId || null,
    owner_email: normalizedRecord.ownerEmail || null,
    owner_name: normalizedRecord.ownerName || null,
    scope: normalizedRecord.scope,
    scope_id: normalizedRecord.scopeId,
    participant_name: normalizedRecord.participantName || null,
    participant_birth_date: formatDateForSupabase(normalizedRecord.participantBirthDate),
    participant_club: normalizedRecord.participantClub || null,
    participant_kind: normalizedRecord.participantKind,
    status: normalizedRecord.status,
    note: normalizedRecord.note || null,
    admitted_at: record.admittedAt || null,
    admitted_by: record.admittedBy || null,
    email_notification_status: record.emailNotificationStatus || 'pending',
    email_notification_at: record.emailNotificationAt || null,
  }
}

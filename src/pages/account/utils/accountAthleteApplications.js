import {
  getAccountWorkflowId,
  normalizeAccountWorkflowStatus,
} from '@/domains/account-admissions/accountAdmissionMappers'
import {
  loadAccountAdmissionWorkflowForCurrentUser,
  loadAllAccountAdmissionWorkflowForStaff,
  removeAccountAthleteApplicationRecord,
  saveAccountAthleteApplication,
} from '@/domains/account-admissions/accountAdmissionRepository'

let cachedApplications = []

function resolveCurrentUser(currentUser) {
  return currentUser?.value || currentUser || null
}

function getCurrentUserKey(currentUser) {
  const resolvedUser = resolveCurrentUser(currentUser)

  if (typeof resolvedUser === 'string') {
    return resolvedUser || 'anonymous'
  }

  return resolvedUser?.id || resolvedUser?.email || 'anonymous'
}

function normalizeApplication(record) {
  if (!record || typeof record !== 'object') {
    return null
  }

  const createdAt = record.createdAt || record.updatedAt || new Date().toISOString()
  const ownerUserKey = record.ownerUserKey || record.ownerUserId || 'anonymous'
  const scope = record.scope || 'athlete'
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
    participantKind: record.participantKind || 'athlete',
    status: normalizeApplicationStatus(record.status),
    note: record.note || '',
    updatedAt: record.updatedAt || createdAt,
    updatedBy: record.updatedBy || '',
    createdAt,
  }
}

function replaceCachedApplication(record) {
  const normalizedRecord = normalizeApplication(record)

  if (!normalizedRecord) {
    return null
  }

  cachedApplications = [
    normalizedRecord,
    ...cachedApplications.filter((item) => item.id !== normalizedRecord.id),
  ]

  return normalizedRecord
}

export function getAccountAthleteApplicationId({ ownerUserKey, scope, scopeId }) {
  return getAccountWorkflowId({ ownerUserKey, scope, scopeId })
}

export function normalizeApplicationStatus(status) {
  return normalizeAccountWorkflowStatus(status)
}

export function setCachedAccountAthleteApplications(records = []) {
  cachedApplications = Array.isArray(records) ? records.map(normalizeApplication).filter(Boolean) : []
}

export async function refreshAccountAthleteApplicationsForCurrentUser() {
  const workflow = await loadAccountAdmissionWorkflowForCurrentUser()
  setCachedAccountAthleteApplications(workflow.applications)
  return readAccountAthleteApplications()
}

export async function refreshAllAccountAthleteApplicationsForStaff() {
  const workflow = await loadAllAccountAdmissionWorkflowForStaff()
  setCachedAccountAthleteApplications(workflow.applications)
  return readAccountAthleteApplications()
}

export function readAccountAthleteApplications() {
  return cachedApplications
}

export function readAccountAthleteApplication({ ownerUserKey, scope, scopeId }) {
  const applicationId = getAccountWorkflowId({ ownerUserKey, scope, scopeId })
  return cachedApplications.find((record) => record.id === applicationId) || null
}

export async function upsertAccountAthleteApplication(record) {
  const normalizedRecord = normalizeApplication(record)

  if (!normalizedRecord) {
    return null
  }

  const savedRecord = await saveAccountAthleteApplication(normalizedRecord)
  return replaceCachedApplication(savedRecord)
}

export async function removeAccountAthleteApplication({ ownerUserKey, scope, scopeId }) {
  const applicationId = getAccountWorkflowId({ ownerUserKey, scope, scopeId })
  await removeAccountAthleteApplicationRecord({ id: applicationId })
  cachedApplications = cachedApplications.filter((record) => record.id !== applicationId)
}

export async function updateAccountAthleteApplication(
  { ownerUserKey, scope, scopeId },
  patch = {},
  { currentUser = null, updatedBy = '' } = {},
) {
  const existingRecord = readAccountAthleteApplication({ ownerUserKey, scope, scopeId })
  const resolvedUser = resolveCurrentUser(currentUser)
  const nextRecord = {
    ...existingRecord,
    ownerUserId: ownerUserKey,
    ownerUserKey,
    ownerName: patch.ownerName || existingRecord?.ownerName || resolvedUser?.name || '',
    ownerEmail: patch.ownerEmail || existingRecord?.ownerEmail || resolvedUser?.email || '',
    ownerPhone: patch.ownerPhone || existingRecord?.ownerPhone || resolvedUser?.phone || '',
    scope,
    scopeId,
    ...patch,
    updatedAt: new Date().toISOString(),
    updatedBy: patch.updatedBy || updatedBy || existingRecord?.updatedBy || '',
  }

  return upsertAccountAthleteApplication(nextRecord)
}

export { getCurrentUserKey }

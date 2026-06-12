import {
  deleteAthleteApplication,
  fetchAccountAdmissionWorkflowForOwnerForStaff,
  fetchAccountAdmissionWorkflowForCurrentUser,
  fetchAllAccountAdmissionWorkflowForStaff,
  subscribeToAccountAdmissionWorkflow,
  upsertAdmission,
  upsertAthleteApplication,
} from './supabaseAdmissionAdapter.js'

export async function loadAccountAdmissionWorkflowForCurrentUser() {
  return fetchAccountAdmissionWorkflowForCurrentUser()
}

export async function loadAllAccountAdmissionWorkflowForStaff() {
  return fetchAllAccountAdmissionWorkflowForStaff()
}

export async function loadAccountAdmissionWorkflowForOwnerForStaff(ownerUserId) {
  return fetchAccountAdmissionWorkflowForOwnerForStaff(ownerUserId)
}

export async function saveAccountAthleteApplication(record = {}) {
  return upsertAthleteApplication(record)
}

export async function removeAccountAthleteApplicationRecord(params = {}) {
  return deleteAthleteApplication(params)
}

export async function saveAccountAdmission(record = {}) {
  return upsertAdmission(record)
}

export function subscribeToAccountAdmissionWorkflowChanges(callback) {
  return subscribeToAccountAdmissionWorkflow(callback)
}

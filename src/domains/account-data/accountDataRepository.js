import {
  deleteAccountAthleteForCurrentUser,
  fetchAllAccountAthletesForAdmin,
  fetchAllAccountProfilesForAdmin,
  fetchAccountAthletesForOwnerForAdmin,
  fetchAccountAthletesForOwnersForAdmin,
  fetchAccountAthletesForCurrentUser,
  fetchAccountProfileForOwnerForAdmin,
  fetchAccountProfilesForOwnersForAdmin,
  fetchAccountProfileForCurrentUser,
  subscribeToAccountDataChanges,
  upsertAccountAthleteForCurrentUser,
  upsertAccountProfileForCurrentUser,
} from './supabaseAccountDataAdapter.js'

export async function loadAccountProfileForCurrentUser(params = {}) {
  return fetchAccountProfileForCurrentUser(params)
}

export async function saveAccountProfileForCurrentUser(params = {}) {
  return upsertAccountProfileForCurrentUser(params)
}

export async function loadAccountAthletesForCurrentUser() {
  return fetchAccountAthletesForCurrentUser()
}

export async function loadAllAccountProfilesForAdmin() {
  return fetchAllAccountProfilesForAdmin()
}

export async function loadAccountProfilesForOwnersForAdmin(ownerUserIds = []) {
  return fetchAccountProfilesForOwnersForAdmin(ownerUserIds)
}

export async function loadAccountProfileForOwnerForAdmin(ownerUserId) {
  return fetchAccountProfileForOwnerForAdmin(ownerUserId)
}

export async function loadAllAccountAthletesForAdmin() {
  return fetchAllAccountAthletesForAdmin()
}

export async function loadAccountAthletesForOwnersForAdmin(ownerUserIds = []) {
  return fetchAccountAthletesForOwnersForAdmin(ownerUserIds)
}

export async function loadAccountAthletesForOwnerForAdmin(ownerUserId) {
  return fetchAccountAthletesForOwnerForAdmin(ownerUserId)
}

export async function saveAccountAthleteForCurrentUser(params = {}) {
  return upsertAccountAthleteForCurrentUser(params)
}

export async function removeAccountAthleteForCurrentUser(athleteId) {
  return deleteAccountAthleteForCurrentUser(athleteId)
}

export function subscribeToAccountProfileAthleteChanges(callback) {
  return subscribeToAccountDataChanges(callback)
}

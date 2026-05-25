import {
  deleteAccountAthleteForCurrentUser,
  fetchAllAccountAthletesForAdmin,
  fetchAllAccountProfilesForAdmin,
  fetchAccountAthletesForCurrentUser,
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

export async function loadAllAccountAthletesForAdmin() {
  return fetchAllAccountAthletesForAdmin()
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

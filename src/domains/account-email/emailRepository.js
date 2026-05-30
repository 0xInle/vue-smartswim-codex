import {
  fetchEmailMessagesForAdmin,
  fetchEmailMessagesForCurrentUser,
  insertQueuedEmailMessageForAdmin,
  subscribeToEmailChanges,
} from './supabaseEmailAdapter'

export async function loadEmailMessagesForAdmin() {
  return fetchEmailMessagesForAdmin()
}

export async function loadEmailMessagesForCurrentUser() {
  return fetchEmailMessagesForCurrentUser()
}

export async function createQueuedEmailMessageForAdmin(message = {}) {
  return insertQueuedEmailMessageForAdmin(message)
}

export function subscribeToAccountEmailChanges(callback) {
  return subscribeToEmailChanges(callback)
}

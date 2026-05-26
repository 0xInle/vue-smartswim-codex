import {
  fetchEmailMessagesForAdmin,
  insertQueuedEmailMessageForAdmin,
  subscribeToEmailChanges,
} from './supabaseEmailAdapter'

export async function loadEmailMessagesForAdmin() {
  return fetchEmailMessagesForAdmin()
}

export async function createQueuedEmailMessageForAdmin(message = {}) {
  return insertQueuedEmailMessageForAdmin(message)
}

export function subscribeToAccountEmailChanges(callback) {
  return subscribeToEmailChanges(callback)
}

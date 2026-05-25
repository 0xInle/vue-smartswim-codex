import {
  fetchAccountDocumentsForCurrentUser,
  fetchAllAccountDocumentReviewsForAdmin,
  subscribeToAccountDocuments,
  updateAccountDocumentReview,
  upsertAccountDocumentForCurrentUser,
} from './supabaseDocumentAdapter.js'

export async function loadAccountDocumentsForCurrentUser(params = {}) {
  return fetchAccountDocumentsForCurrentUser(params)
}

export async function saveAccountDocumentForCurrentUser(params = {}) {
  return upsertAccountDocumentForCurrentUser(params)
}

export async function loadAllAccountDocumentReviewsForAdmin() {
  return fetchAllAccountDocumentReviewsForAdmin()
}

export async function reviewAccountDocument(documentId, patch = {}) {
  return updateAccountDocumentReview(documentId, patch)
}

export function subscribeToAccountDocumentChanges(callback) {
  return subscribeToAccountDocuments(callback)
}

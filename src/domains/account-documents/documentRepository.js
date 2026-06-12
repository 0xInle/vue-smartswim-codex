import {
  fetchAccountDocumentsForCurrentUser,
  fetchAccountDocumentReviewForAdmin,
  fetchAccountDocumentReviewsForOwnerForAdmin,
  fetchAccountDocumentReviewsForOwnersForAdmin,
  fetchAllAccountDocumentReviewsForAdmin,
  fetchLatestAccountDocumentReviewsForAdmin,
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

export async function loadAccountDocumentReviewsForOwnerForAdmin(ownerUserId, options = {}) {
  return fetchAccountDocumentReviewsForOwnerForAdmin(ownerUserId, options)
}

export async function loadAccountDocumentReviewsForOwnersForAdmin(ownerUserIds = []) {
  return fetchAccountDocumentReviewsForOwnersForAdmin(ownerUserIds)
}

export async function loadLatestAccountDocumentReviewsForAdmin(params = {}) {
  return fetchLatestAccountDocumentReviewsForAdmin(params)
}

export async function loadAccountDocumentReviewForAdmin(documentId) {
  return fetchAccountDocumentReviewForAdmin(documentId)
}

export async function reviewAccountDocument(documentId, patch = {}) {
  return updateAccountDocumentReview(documentId, patch)
}

export function subscribeToAccountDocumentChanges(callback) {
  return subscribeToAccountDocuments(callback)
}

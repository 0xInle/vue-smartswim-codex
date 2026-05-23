import { isSupabaseAccountDocumentsSource } from './documentSource.js'
import {
  fetchAccountDocumentsForCurrentUser,
  fetchAllAccountDocumentReviewsForAdmin,
  subscribeToAccountDocuments,
  updateAccountDocumentReview,
  upsertAccountDocumentForCurrentUser,
} from './supabaseDocumentAdapter.js'

export {
  ACCOUNT_DOCUMENTS_SOURCE,
  getAccountDocumentsSource,
  isSupabaseAccountDocumentsSource,
} from './documentSource.js'

function assertSupabaseDocumentsSource() {
  if (!isSupabaseAccountDocumentsSource()) {
    throw new Error(
      'Документы аккаунта пока используют локальный источник. Для Supabase path установите VITE_ACCOUNT_DOCUMENTS_SOURCE=supabase.',
    )
  }
}

export async function loadAccountDocumentsForCurrentUser(params = {}) {
  assertSupabaseDocumentsSource()
  return fetchAccountDocumentsForCurrentUser(params)
}

export async function saveAccountDocumentForCurrentUser(params = {}) {
  assertSupabaseDocumentsSource()
  return upsertAccountDocumentForCurrentUser(params)
}

export async function loadAllAccountDocumentReviewsForAdmin() {
  assertSupabaseDocumentsSource()
  return fetchAllAccountDocumentReviewsForAdmin()
}

export async function reviewAccountDocument(documentId, patch = {}) {
  assertSupabaseDocumentsSource()
  return updateAccountDocumentReview(documentId, patch)
}

export function subscribeToAccountDocumentChanges(callback) {
  assertSupabaseDocumentsSource()
  return subscribeToAccountDocuments(callback)
}

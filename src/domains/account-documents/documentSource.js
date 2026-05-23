export const ACCOUNT_DOCUMENTS_SOURCE = Object.freeze({
  LOCAL: 'local',
  SUPABASE: 'supabase',
})

export function getAccountDocumentsSource() {
  return import.meta.env.VITE_ACCOUNT_DOCUMENTS_SOURCE === ACCOUNT_DOCUMENTS_SOURCE.SUPABASE
    ? ACCOUNT_DOCUMENTS_SOURCE.SUPABASE
    : ACCOUNT_DOCUMENTS_SOURCE.LOCAL
}

export function isSupabaseAccountDocumentsSource() {
  return getAccountDocumentsSource() === ACCOUNT_DOCUMENTS_SOURCE.SUPABASE
}

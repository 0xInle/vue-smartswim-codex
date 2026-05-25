import {
  mapAccountDocumentUpdatePayload,
  mapAccountDocumentUpsertPayload,
  mapSupabaseAccountDocumentRow,
} from './documentMappers.js'
import { getCurrentSession } from '@/utils/supabaseAuth'
import { getSupabaseClient } from '@/utils/supabaseClient'
import { getUserFacingErrorMessage } from '@/utils/userFacingErrors'

const ACCOUNT_DOCUMENTS_TABLE = 'account_documents'
const ACCOUNT_DOCUMENTS_SQL_PATH = 'supabase/account_documents.sql'
let accountDocumentsSubscriptionId = 0
const ACCOUNT_DOCUMENT_SELECT = [
  'id',
  'owner_user_id',
  'owner_email',
  'owner_name',
  'owner_phone',
  'participant_kind',
  'participant_id',
  'participant_snapshot',
  'scope',
  'scope_id',
  'document_type',
  'document_label',
  'document_hint',
  'status',
  'file_name',
  'file_size',
  'file_type',
  'file_url',
  'storage_path',
  'uploaded_at',
  'expires_at',
  'reviewed_at',
  'reviewed_by',
  'reviewed_by_name',
  'rejection_reason',
  'created_at',
  'updated_at',
].join(',')

function toMissingAccountDocumentsTableError() {
  return `Документы недоступны: таблица ${ACCOUNT_DOCUMENTS_TABLE} не найдена. Выполните SQL из файла ${ACCOUNT_DOCUMENTS_SQL_PATH} в Supabase SQL Editor.`
}

function isMissingAccountDocumentsTableError(error) {
  if (!error) {
    return false
  }

  return (
    error.code === '42P01' ||
    new RegExp(`relation .*${ACCOUNT_DOCUMENTS_TABLE}.* does not exist`, 'i').test(
      error.message || '',
    ) ||
    new RegExp(`table .*${ACCOUNT_DOCUMENTS_TABLE}.* not found`, 'i').test(error.message || '')
  )
}

function throwAccountDocumentError(error, fallback) {
  if (isMissingAccountDocumentsTableError(error)) {
    throw new Error(toMissingAccountDocumentsTableError())
  }

  throw new Error(getUserFacingErrorMessage(error, fallback))
}

async function requireCurrentSession(message) {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error(message)
  }

  return session
}

function resolveCurrentUser(currentUser) {
  return currentUser?.value || currentUser || null
}

export async function fetchAccountDocumentsForCurrentUser({ scope = 'profile', scopeId = 'profile' } = {}) {
  await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')

  let query = getSupabaseClient()
    .from(ACCOUNT_DOCUMENTS_TABLE)
    .select(ACCOUNT_DOCUMENT_SELECT)
    .order('updated_at', { ascending: false })

  if (scope) {
    query = query.eq('scope', scope)
  }

  if (scopeId) {
    query = query.eq('scope_id', scopeId)
  }

  const { data, error } = await query

  if (error) {
    throwAccountDocumentError(error, 'Не удалось загрузить документы.')
  }

  return (data ?? []).map(mapSupabaseAccountDocumentRow)
}

export async function upsertAccountDocumentForCurrentUser({
  currentUser,
  scope = 'profile',
  scopeId = 'profile',
  document,
} = {}) {
  const session = await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')
  const payload = mapAccountDocumentUpsertPayload(document, {
    ownerUserId: session.user.id,
    currentUser: resolveCurrentUser(currentUser),
    scope,
    scopeId,
  })

  const { data, error } = await getSupabaseClient()
    .from(ACCOUNT_DOCUMENTS_TABLE)
    .upsert(payload, {
      onConflict: 'owner_user_id,scope,scope_id,document_type',
    })
    .select(ACCOUNT_DOCUMENT_SELECT)
    .single()

  if (error) {
    throwAccountDocumentError(error, 'Не удалось сохранить документ.')
  }

  return mapSupabaseAccountDocumentRow(data)
}

export async function fetchAllAccountDocumentReviewsForAdmin() {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { data, error } = await getSupabaseClient()
    .from(ACCOUNT_DOCUMENTS_TABLE)
    .select(ACCOUNT_DOCUMENT_SELECT)
    .order('updated_at', { ascending: false })

  if (error) {
    throwAccountDocumentError(error, 'Не удалось загрузить документы для проверки.')
  }

  return (data ?? []).map(mapSupabaseAccountDocumentRow)
}

export async function updateAccountDocumentReview(
  documentId,
  { status, rejectionReason = '', reviewerName = 'Администратор' } = {},
) {
  const session = await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')
  const payload = mapAccountDocumentUpdatePayload({
    status,
    rejectionReason,
    reviewedAt: new Date().toISOString(),
    reviewedBy: session.user.id,
    reviewedByName: reviewerName,
  })

  const { data, error } = await getSupabaseClient()
    .from(ACCOUNT_DOCUMENTS_TABLE)
    .update(payload)
    .eq('id', documentId)
    .select(ACCOUNT_DOCUMENT_SELECT)
    .single()

  if (error) {
    throwAccountDocumentError(error, 'Не удалось обновить статус документа.')
  }

  return mapSupabaseAccountDocumentRow(data)
}

export function subscribeToAccountDocuments(callback) {
  const client = getSupabaseClient()
  accountDocumentsSubscriptionId += 1

  const channel = client
    .channel(`account-documents-feed-${accountDocumentsSubscriptionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: ACCOUNT_DOCUMENTS_TABLE,
      },
      callback,
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

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
const ACCOUNT_DOCUMENTS_STORAGE_BUCKET = 'account-documents'
const ACCOUNT_DOCUMENT_SIGNED_URL_TTL_SECONDS = 60 * 60
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
const ACCOUNT_DOCUMENT_META_SELECT = [
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

function hasUploadFile(document = {}) {
  return Boolean(document.file && typeof document.file === 'object')
}

function isDocumentRemoval(document = {}) {
  return (
    document.status === 'missing' &&
    !document.fileName &&
    !document.fileDataUrl &&
    !document.fileUrl &&
    !hasUploadFile(document)
  )
}

function sanitizeStorageSegment(value, fallback = 'item') {
  return (
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-zа-яё0-9._-]+/gi, '-')
      .replace(/^-+|-+$/g, '') || fallback
  )
}

function resolveStorageFileExtension(file = {}, fileName = '') {
  const sourceName = String(fileName || file.name || '').trim()
  const sourceExtension = sourceName.includes('.') ? sourceName.split('.').pop() : ''
  const normalizedExtension = sanitizeStorageSegment(sourceExtension, '')

  if (normalizedExtension) {
    return normalizedExtension.slice(0, 12)
  }

  if (file.type === 'application/pdf') {
    return 'pdf'
  }

  if (file.type === 'image/png') {
    return 'png'
  }

  if (['image/jpeg', 'image/jpg'].includes(file.type)) {
    return 'jpg'
  }

  return 'bin'
}

function resolveStorageContentType(file = {}, fileType = '') {
  const normalizedFileType = String(fileType || file.type || '').trim()

  if (normalizedFileType) {
    return normalizedFileType
  }

  const extension = resolveStorageFileExtension(file)

  if (extension === 'pdf') {
    return 'application/pdf'
  }

  if (extension === 'png') {
    return 'image/png'
  }

  if (['jpg', 'jpeg'].includes(extension)) {
    return 'image/jpeg'
  }

  return 'application/octet-stream'
}

function buildAccountDocumentStoragePath({ ownerUserId, scope, scopeId, documentType, file }) {
  const extension = resolveStorageFileExtension(file)
  const timestamp = Date.now()

  return [
    ownerUserId,
    sanitizeStorageSegment(scope, 'profile'),
    sanitizeStorageSegment(scopeId, 'profile'),
    `${sanitizeStorageSegment(documentType, 'document')}-${timestamp}.${extension}`,
  ].join('/')
}

async function fetchExistingAccountDocumentStoragePath({ ownerUserId, scope, scopeId, documentType }) {
  if (!ownerUserId || !documentType) {
    return ''
  }

  const { data } = await getSupabaseClient()
    .from(ACCOUNT_DOCUMENTS_TABLE)
    .select('storage_path')
    .eq('owner_user_id', ownerUserId)
    .eq('scope', scope || 'profile')
    .eq('scope_id', scopeId || 'profile')
    .eq('document_type', documentType)
    .maybeSingle()

  return data?.storage_path || ''
}

async function removeAccountDocumentStorageObject(storagePath) {
  if (!storagePath) {
    return
  }

  await getSupabaseClient().storage.from(ACCOUNT_DOCUMENTS_STORAGE_BUCKET).remove([storagePath])
}

async function uploadAccountDocumentStorageFile({ session, scope, scopeId, document }) {
  if (!hasUploadFile(document)) {
    return {
      uploadedStoragePath: document.storagePath || '',
      previousStoragePath: '',
    }
  }

  const documentType = document.documentType || document.type || ''
  const previousStoragePath = await fetchExistingAccountDocumentStoragePath({
    ownerUserId: session.user.id,
    scope,
    scopeId,
    documentType,
  })
  const uploadedStoragePath = buildAccountDocumentStoragePath({
    ownerUserId: session.user.id,
    scope,
    scopeId,
    documentType,
    file: document.file,
  })
  const { error } = await getSupabaseClient()
    .storage
    .from(ACCOUNT_DOCUMENTS_STORAGE_BUCKET)
    .upload(uploadedStoragePath, document.file, {
      contentType: resolveStorageContentType(document.file, document.fileType),
      upsert: false,
    })

  if (error) {
    throwAccountDocumentError(error, 'Не удалось загрузить файл документа.')
  }

  return {
    uploadedStoragePath,
    previousStoragePath,
  }
}

async function createAccountDocumentSignedUrl(storagePath) {
  if (!storagePath) {
    return ''
  }

  const { data, error } = await getSupabaseClient()
    .storage
    .from(ACCOUNT_DOCUMENTS_STORAGE_BUCKET)
    .createSignedUrl(storagePath, ACCOUNT_DOCUMENT_SIGNED_URL_TTL_SECONDS)

  if (error) {
    throwAccountDocumentError(error, 'Не удалось получить ссылку на документ.')
  }

  return data?.signedUrl || ''
}

async function mapSupabaseAccountDocumentRowWithSignedUrl(row) {
  const mappedDocument = mapSupabaseAccountDocumentRow(row)

  if (!mappedDocument.fileUrl && mappedDocument.storagePath) {
    return {
      ...mappedDocument,
      fileUrl: await createAccountDocumentSignedUrl(mappedDocument.storagePath),
    }
  }

  return mappedDocument
}

async function mapSupabaseAccountDocumentRowsWithSignedUrls(rows = []) {
  return Promise.all((rows ?? []).map(mapSupabaseAccountDocumentRowWithSignedUrl))
}

export async function fetchAccountDocumentsForCurrentUser({
  scope = 'profile',
  scopeId = 'profile',
  scopeIds = [],
  includeFile = false,
} = {}) {
  const session = await requireCurrentSession('Сессия истекла. Войдите в личный кабинет заново.')
  const normalizedScopeIds = Array.isArray(scopeIds)
    ? scopeIds.map((value) => String(value || '').trim()).filter(Boolean)
    : []

  let query = getSupabaseClient()
    .from(ACCOUNT_DOCUMENTS_TABLE)
    .select(includeFile ? ACCOUNT_DOCUMENT_SELECT : ACCOUNT_DOCUMENT_META_SELECT)
    .eq('owner_user_id', session.user.id)
    .order('updated_at', { ascending: false })

  if (scope) {
    query = query.eq('scope', scope)
  }

  if (normalizedScopeIds.length) {
    query = query.in('scope_id', normalizedScopeIds)
  } else if (scopeId) {
    query = query.eq('scope_id', scopeId)
  }

  const { data, error } = await query

  if (error) {
    throwAccountDocumentError(error, 'Не удалось загрузить документы.')
  }

  if (includeFile) {
    return mapSupabaseAccountDocumentRowsWithSignedUrls(data)
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
  const documentType = document?.documentType || document?.type || ''
  const { uploadedStoragePath, previousStoragePath } = await uploadAccountDocumentStorageFile({
    session,
    scope,
    scopeId,
    document,
  })
  const shouldRemoveExistingStorageObject = isDocumentRemoval(document)
  const storagePathToRemove = shouldRemoveExistingStorageObject
    ? await fetchExistingAccountDocumentStoragePath({
        ownerUserId: session.user.id,
        scope,
        scopeId,
        documentType,
      })
    : ''
  const preparedDocument = {
    ...document,
    fileUrl: '',
    fileDataUrl: '',
    storagePath: uploadedStoragePath || (shouldRemoveExistingStorageObject ? '' : document?.storagePath || ''),
  }
  const payload = mapAccountDocumentUpsertPayload(preparedDocument, {
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
    if (uploadedStoragePath) {
      void removeAccountDocumentStorageObject(uploadedStoragePath)
    }
    throwAccountDocumentError(error, 'Не удалось сохранить документ.')
  }

  if (previousStoragePath && previousStoragePath !== uploadedStoragePath) {
    void removeAccountDocumentStorageObject(previousStoragePath)
  }

  if (storagePathToRemove) {
    void removeAccountDocumentStorageObject(storagePathToRemove)
  }

  return mapSupabaseAccountDocumentRowWithSignedUrl(data)
}

export async function fetchAllAccountDocumentReviewsForAdmin({
  excludeMissing = false,
  participantKind = '',
} = {}) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  let query = getSupabaseClient()
    .from(ACCOUNT_DOCUMENTS_TABLE)
    .select(ACCOUNT_DOCUMENT_META_SELECT)
    .order('updated_at', { ascending: false })

  if (excludeMissing) {
    query = query.neq('status', 'missing')
  }

  if (participantKind) {
    query = query.eq('participant_kind', participantKind)
  }

  const { data, error } = await query

  if (error) {
    throwAccountDocumentError(error, 'Не удалось загрузить документы для проверки.')
  }

  return (data ?? []).map(mapSupabaseAccountDocumentRow)
}

export async function fetchAccountDocumentReviewsForOwnerForAdmin(
  ownerUserId,
  { includeFile = false } = {},
) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { data, error } = await getSupabaseClient()
    .from(ACCOUNT_DOCUMENTS_TABLE)
    .select(includeFile ? ACCOUNT_DOCUMENT_SELECT : ACCOUNT_DOCUMENT_META_SELECT)
    .eq('owner_user_id', ownerUserId)
    .order('updated_at', { ascending: false })

  if (error) {
    throwAccountDocumentError(error, 'Не удалось загрузить документы пользователя.')
  }

  if (includeFile) {
    return mapSupabaseAccountDocumentRowsWithSignedUrls(data)
  }

  return (data ?? []).map(mapSupabaseAccountDocumentRow)
}

export async function fetchAccountDocumentReviewsForOwnersForAdmin(ownerUserIds = []) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')
  const normalizedOwnerIds = Array.from(
    new Set(
      (Array.isArray(ownerUserIds) ? ownerUserIds : [])
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    ),
  )

  if (!normalizedOwnerIds.length) {
    return []
  }

  const { data, error } = await getSupabaseClient()
    .from(ACCOUNT_DOCUMENTS_TABLE)
    .select(ACCOUNT_DOCUMENT_META_SELECT)
    .in('owner_user_id', normalizedOwnerIds)
    .order('updated_at', { ascending: false })

  if (error) {
    throwAccountDocumentError(error, 'Не удалось загрузить документы пользователей.')
  }

  return (data ?? []).map(mapSupabaseAccountDocumentRow)
}

export async function fetchLatestAccountDocumentReviewsForAdmin({ limit = 4 } = {}) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { data, error } = await getSupabaseClient()
    .from(ACCOUNT_DOCUMENTS_TABLE)
    .select(ACCOUNT_DOCUMENT_META_SELECT)
    .neq('status', 'missing')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    throwAccountDocumentError(error, 'Не удалось загрузить последние документы.')
  }

  return (data ?? []).map(mapSupabaseAccountDocumentRow)
}

export async function fetchAccountDocumentReviewForAdmin(documentId) {
  await requireCurrentSession('Сессия истекла. Войдите в CRM заново.')

  const { data, error } = await getSupabaseClient()
    .from(ACCOUNT_DOCUMENTS_TABLE)
    .select(ACCOUNT_DOCUMENT_SELECT)
    .eq('id', documentId)
    .single()

  if (error) {
    throwAccountDocumentError(error, 'Не удалось загрузить документ для проверки.')
  }

  return mapSupabaseAccountDocumentRowWithSignedUrl(data)
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

  return mapSupabaseAccountDocumentRowWithSignedUrl(data)
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

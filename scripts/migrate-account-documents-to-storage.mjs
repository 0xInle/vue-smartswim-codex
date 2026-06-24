import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import { createClient } from '@supabase/supabase-js'

const ENV_PATH = resolve(process.cwd(), '.env.local')
const ACCOUNT_DOCUMENTS_BUCKET = 'account-documents'

function parseDotEnv(content) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((acc, line) => {
      const separatorIndex = line.indexOf('=')

      if (separatorIndex === -1) {
        return acc
      }

      const key = line.slice(0, separatorIndex).trim()
      const rawValue = line.slice(separatorIndex + 1).trim()
      acc[key] = rawValue.replace(/^['"]|['"]$/g, '')
      return acc
    }, {})
}

async function readLocalEnv() {
  try {
    return parseDotEnv(await readFile(ENV_PATH, 'utf8'))
  } catch {
    return {}
  }
}

function sanitizeStorageSegment(value, fallback = 'item') {
  return (
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/^-+|-+$/g, '') || fallback
  )
}

function resolveExtension({ fileName = '', mimeType = '' } = {}) {
  const sourceName = String(fileName || '').trim()
  const sourceExtension = sourceName.includes('.') ? sourceName.split('.').pop() : ''
  const normalizedExtension = sanitizeStorageSegment(sourceExtension, '')

  if (normalizedExtension) {
    return normalizedExtension.slice(0, 12)
  }

  if (mimeType === 'application/pdf') {
    return 'pdf'
  }

  if (mimeType === 'image/png') {
    return 'png'
  }

  if (['image/jpeg', 'image/jpg'].includes(mimeType)) {
    return 'jpg'
  }

  return 'bin'
}

function parseDataUrl(dataUrl = '') {
  const match = String(dataUrl).match(/^data:([^;,]+)?(?:;base64)?,(.*)$/s)

  if (!match) {
    return null
  }

  const mimeType = match[1] || 'application/octet-stream'
  const payload = match[2] || ''
  const isBase64 = dataUrl.slice(0, dataUrl.indexOf(',')).includes(';base64')
  const buffer = isBase64
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload), 'utf8')

  return {
    buffer,
    mimeType,
  }
}

function buildStoragePath(document, mimeType) {
  const extension = resolveExtension({
    fileName: document.file_name,
    mimeType,
  })

  return [
    document.owner_user_id,
    sanitizeStorageSegment(document.scope, 'profile'),
    sanitizeStorageSegment(document.scope_id, 'profile'),
    `${sanitizeStorageSegment(document.document_type, 'document')}-${document.id}.${extension}`,
  ].join('/')
}

async function getLegacyDocuments(client) {
  const { data, error } = await client
    .from('account_documents')
    .select('id,owner_user_id,scope,scope_id,document_type,file_name,file_url,storage_path')
    .not('file_url', 'is', null)
    .or('storage_path.is.null,storage_path.eq.')
    .order('updated_at', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

async function migrateDocument(client, document) {
  const parsedFile = parseDataUrl(document.file_url)

  if (!parsedFile?.buffer?.length) {
    return {
      id: document.id,
      status: 'skipped',
      reason: 'file_url is not a readable data URL',
    }
  }

  const storagePath = buildStoragePath(document, parsedFile.mimeType)
  const { error: uploadError } = await client.storage
    .from(ACCOUNT_DOCUMENTS_BUCKET)
    .upload(storagePath, parsedFile.buffer, {
      contentType: parsedFile.mimeType,
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Upload failed for ${document.id}: ${uploadError.message}`)
  }

  const { data: signedUrlData, error: signedUrlError } = await client.storage
    .from(ACCOUNT_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, 60)

  if (signedUrlError || !signedUrlData?.signedUrl) {
    await client.storage.from(ACCOUNT_DOCUMENTS_BUCKET).remove([storagePath])
    throw new Error(
      `Signed URL verification failed for ${document.id}: ${signedUrlError?.message || 'empty URL'}`,
    )
  }

  const { error: updateError } = await client
    .from('account_documents')
    .update({
      storage_path: storagePath,
      file_url: null,
    })
    .eq('id', document.id)

  if (updateError) {
    await client.storage.from(ACCOUNT_DOCUMENTS_BUCKET).remove([storagePath])
    throw new Error(`Database update failed for ${document.id}: ${updateError.message}`)
  }

  return {
    id: document.id,
    status: 'migrated',
    storagePath,
  }
}

async function main() {
  const localEnv = await readLocalEnv()
  const supabaseUrl = process.env.VITE_SUPABASE_URL || localEnv.VITE_SUPABASE_URL || ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Нужны VITE_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в окружении или .env.local.')
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  const legacyDocuments = await getLegacyDocuments(client)

  console.log(`Legacy documents to migrate: ${legacyDocuments.length}`)

  let migratedCount = 0
  let skippedCount = 0

  for (const document of legacyDocuments) {
    const result = await migrateDocument(client, document)

    if (result.status === 'migrated') {
      migratedCount += 1
      console.log(`Migrated document ${result.id} -> ${result.storagePath}`)
      continue
    }

    skippedCount += 1
    console.log(`Skipped document ${result.id}: ${result.reason}`)
  }

  console.log(`Migration complete. Migrated: ${migratedCount}. Skipped: ${skippedCount}.`)
}

await main()

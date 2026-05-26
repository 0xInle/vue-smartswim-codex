import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const ENV_PATH = resolve(process.cwd(), '.env.local')
const PROJECTS_API_BASE_URL = 'https://api.supabase.com/v1/projects'
const POSTGRES_IDENTIFIER_MAX_LENGTH = 63

const REQUIRED_OBJECTS = {
  table: ['public.trainer_bookings'],
  rls: ['public.trainer_bookings'],
  policy: [
    'Allow public insert trainer bookings',
    'Allow authenticated own read trainer bookings',
    'Allow selected trainer read trainer bookings',
    'Allow selected trainer update trainer booking status',
    'Allow admin read trainer bookings',
    'Allow admin update trainer bookings',
    'Allow admin delete trainer bookings',
    'Allow admin insert trainer bookings',
  ],
  constraint: [
    'trainer_bookings_pkey',
    'trainer_bookings_status_check',
    'trainer_bookings_format_check',
  ],
  trigger: ['trainer_bookings_prepare'],
  index: [
    'trainer_bookings_pkey',
    'trainer_bookings_created_at_idx',
    'trainer_bookings_client_email_normalized_idx',
    'trainer_bookings_client_user_id_idx',
  ],
  function: ['public.normalize_email', 'public.prepare_trainer_booking'],
  publication: ['public.trainer_bookings'],
}

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

function getProjectRef({ projectRef, supabaseUrl }) {
  if (projectRef) {
    return projectRef
  }

  if (!supabaseUrl) {
    return ''
  }

  try {
    return new URL(supabaseUrl).hostname.split('.')[0] || ''
  } catch {
    return ''
  }
}

function getEffectiveEnv(localEnv) {
  return {
    supabaseUrl: process.env.VITE_SUPABASE_URL || localEnv.VITE_SUPABASE_URL || '',
    projectRef: process.env.SUPABASE_PROJECT_REF || localEnv.SUPABASE_PROJECT_REF || '',
    accessToken: process.env.SUPABASE_ACCESS_TOKEN || localEnv.SUPABASE_ACCESS_TOKEN || '',
  }
}

function normalizePostgresIdentifier(identifier) {
  return identifier.slice(0, POSTGRES_IDENTIFIER_MAX_LENGTH)
}

function fail(message) {
  console.error(message)
  process.exitCode = 1
}

async function queryTrainerBookingsContract({ accessToken, projectRef }) {
  const response = await fetch(`${PROJECTS_API_BASE_URL}/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        with found_objects as (
          select
            'table' as object_type,
            table_schema || '.' || table_name as object_name
          from information_schema.tables
          where table_schema = 'public'
            and table_name = 'trainer_bookings'

          union all

          select
            'rls' as object_type,
            namespace.nspname || '.' || class.relname as object_name
          from pg_class as class
          join pg_namespace as namespace
            on namespace.oid = class.relnamespace
          where namespace.nspname = 'public'
            and class.relname = 'trainer_bookings'
            and class.relrowsecurity = true

          union all

          select
            'policy' as object_type,
            policy.policyname as object_name
          from pg_policies as policy
          where policy.schemaname = 'public'
            and policy.tablename = 'trainer_bookings'

          union all

          select
            'constraint' as object_type,
            constraint_info.conname as object_name
          from pg_constraint as constraint_info
          join pg_class as class
            on class.oid = constraint_info.conrelid
          join pg_namespace as namespace
            on namespace.oid = class.relnamespace
          where namespace.nspname = 'public'
            and class.relname = 'trainer_bookings'

          union all

          select
            'trigger' as object_type,
            trigger_info.tgname as object_name
          from pg_trigger as trigger_info
          join pg_class as class
            on class.oid = trigger_info.tgrelid
          join pg_namespace as namespace
            on namespace.oid = class.relnamespace
          where namespace.nspname = 'public'
            and class.relname = 'trainer_bookings'
            and trigger_info.tgisinternal = false

          union all

          select
            'index' as object_type,
            index_info.indexname as object_name
          from pg_indexes as index_info
          where index_info.schemaname = 'public'
            and index_info.tablename = 'trainer_bookings'

          union all

          select
            'function' as object_type,
            namespace.nspname || '.' || procedure.proname as object_name
          from pg_proc as procedure
          join pg_namespace as namespace
            on namespace.oid = procedure.pronamespace
          where namespace.nspname = 'public'
            and procedure.proname in ('normalize_email', 'prepare_trainer_booking')

          union all

          select
            'publication' as object_type,
            schemaname || '.' || tablename as object_name
          from pg_publication_tables
          where pubname = 'supabase_realtime'
            and schemaname = 'public'
            and tablename = 'trainer_bookings'
        )
        select object_type, object_name
        from found_objects
        order by object_type, object_name;
      `,
      read_only: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`Supabase Management API error ${response.status}: ${await response.text()}`)
  }

  return response.json()
}

function normalizeRows(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.result)) {
    return payload.result
  }

  if (Array.isArray(payload?.rows)) {
    return payload.rows
  }

  return []
}

function createFoundSet(rows) {
  return rows.reduce((acc, row) => {
    const objectType = row.object_type || row.objectType || ''
    const objectName = normalizePostgresIdentifier(row.object_name || row.objectName || '')

    if (!objectType || !objectName) {
      return acc
    }

    if (!acc.has(objectType)) {
      acc.set(objectType, new Set())
    }

    acc.get(objectType).add(objectName)
    return acc
  }, new Map())
}

function getMissingObjects(foundObjects) {
  return Object.entries(REQUIRED_OBJECTS).flatMap(([objectType, objectNames]) => {
    const foundNames = foundObjects.get(objectType) || new Set()

    return objectNames
      .filter((objectName) => !foundNames.has(normalizePostgresIdentifier(objectName)))
      .map((objectName) => `${objectType}: ${objectName}`)
  })
}

async function main() {
  const localEnv = await readLocalEnv()
  const { supabaseUrl, projectRef, accessToken } = getEffectiveEnv(localEnv)
  const resolvedProjectRef = getProjectRef({ projectRef, supabaseUrl })

  if (!accessToken) {
    fail(
      'Не найден SUPABASE_ACCESS_TOKEN. Publishable/anon key не подходит для проверки Supabase contract. Добавьте PAT в .env.local и повторите команду.',
    )
    return
  }

  if (!resolvedProjectRef) {
    fail(
      'Не удалось определить ref проекта. Заполните SUPABASE_PROJECT_REF или VITE_SUPABASE_URL в .env.local.',
    )
    return
  }

  try {
    const payload = await queryTrainerBookingsContract({
      accessToken,
      projectRef: resolvedProjectRef,
    })
    const missingObjects = getMissingObjects(createFoundSet(normalizeRows(payload)))

    if (missingObjects.length) {
      console.error('Trainer bookings contract is incomplete.')
      console.error('Missing:')
      missingObjects.forEach((objectName) => {
        console.error(`- ${objectName}`)
      })
      process.exitCode = 1
      return
    }

    console.log(`Trainer bookings contract is ready in project ${resolvedProjectRef}.`)
    console.log('Checked: tables, RLS, policies, constraints, functions, triggers, indexes, publication.')
  } catch (error) {
    fail(error instanceof Error ? error.message : 'Не удалось проверить Supabase contract для trainer bookings.')
  }
}

await main()

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const ENV_PATH = resolve(process.cwd(), '.env.local')
const PROJECTS_API_BASE_URL = 'https://api.supabase.com/v1/projects'
const POSTGRES_IDENTIFIER_MAX_LENGTH = 63

const REQUIRED_OBJECTS = {
  table: [
    'public.competition_applications',
    'public.competition_application_events',
  ],
  rls: [
    'public.competition_applications',
    'public.competition_application_events',
  ],
  policy: [
    'Allow authenticated users to insert own competition applications',
    'Allow authenticated users to read own competition applications',
    'Allow authenticated users to withdraw own competition applications',
    'Allow admin read competition applications',
    'Allow admin update competition applications',
    'Allow admin delete competition applications',
    'Allow authenticated users to read own competition application events',
    'Allow admin read competition application events',
  ],
  constraint: [
    'competition_applications_status_check',
    'competition_applications_participant_kind_check',
    'competition_applications_registration_kind_check',
    'competition_applications_admission_status_check',
    'competition_applications_payment_status_check',
    'competition_application_events_to_status_check',
    'competition_application_events_from_status_check',
  ],
  trigger: [
    'competition_applications_touch_updated_at',
    'competition_applications_log_status_event',
  ],
  index: [
    'competition_applications_owner_user_id_idx',
    'competition_applications_stage_id_idx',
    'competition_applications_status_idx',
    'competition_applications_updated_at_idx',
    'competition_applications_created_at_idx',
    'competition_application_events_application_id_idx',
  ],
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
      const value = rawValue.replace(/^['"]|['"]$/g, '')

      acc[key] = value
      return acc
    }, {})
}

async function readLocalEnv() {
  try {
    const content = await readFile(ENV_PATH, 'utf8')
    return parseDotEnv(content)
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
    const hostname = new URL(supabaseUrl).hostname
    return hostname.split('.')[0] || ''
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

function fail(message) {
  console.error(message)
  process.exitCode = 1
}

async function queryCompetitionApplicationContract({ accessToken, projectRef }) {
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
            and table_name in (
              'competition_applications',
              'competition_application_events'
            )

          union all

          select
            'rls' as object_type,
            namespace.nspname || '.' || class.relname as object_name
          from pg_class as class
          join pg_namespace as namespace
            on namespace.oid = class.relnamespace
          where namespace.nspname = 'public'
            and class.relname in (
              'competition_applications',
              'competition_application_events'
            )
            and class.relrowsecurity = true

          union all

          select
            'policy' as object_type,
            policy.policyname as object_name
          from pg_policies as policy
          where policy.schemaname = 'public'
            and policy.tablename in (
              'competition_applications',
              'competition_application_events'
            )

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
            and class.relname in (
              'competition_applications',
              'competition_application_events'
            )

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
            and class.relname = 'competition_applications'
            and trigger_info.tgisinternal = false

          union all

          select
            'index' as object_type,
            index_info.indexname as object_name
          from pg_indexes as index_info
          where index_info.schemaname = 'public'
            and index_info.tablename in (
              'competition_applications',
              'competition_application_events'
            )
        )
        select object_type, object_name
        from found_objects
        order by object_type, object_name;
      `,
      read_only: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Supabase Management API error ${response.status}: ${errorText}`)
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

function normalizePostgresIdentifier(identifier) {
  return identifier.slice(0, POSTGRES_IDENTIFIER_MAX_LENGTH)
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
    const payload = await queryCompetitionApplicationContract({
      accessToken,
      projectRef: resolvedProjectRef,
    })
    const rows = normalizeRows(payload)
    const missingObjects = getMissingObjects(createFoundSet(rows))

    if (missingObjects.length) {
      console.error('Competition applications contract is incomplete.')
      console.error('Missing:')
      missingObjects.forEach((objectName) => {
        console.error(`- ${objectName}`)
      })
      process.exitCode = 1
      return
    }

    console.log(`Competition applications contract is ready in project ${resolvedProjectRef}.`)
    console.log('Checked: tables, RLS, policies, constraints, triggers, indexes.')
  } catch (error) {
    fail(
      error instanceof Error
        ? error.message
        : 'Не удалось проверить Supabase contract для competition applications.',
    )
  }
}

await main()

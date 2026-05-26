import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const ENV_PATH = resolve(process.cwd(), '.env.local')
const PROJECTS_API_BASE_URL = 'https://api.supabase.com/v1/projects'
const POSTGRES_IDENTIFIER_MAX_LENGTH = 63

const REQUIRED_OBJECTS = {
  table: [
    'public.competition_payments',
    'public.competition_refunds',
    'public.payment_events',
  ],
  rls: [
    'public.competition_payments',
    'public.competition_refunds',
    'public.payment_events',
  ],
  policy: [
    'Allow authenticated users to read own competition payments',
    'Allow authenticated users to insert own competition payments',
    'Allow admin read competition payments',
    'Allow admin update competition payments',
    'Allow admin delete competition payments',
    'Allow authenticated users to read own competition refunds',
    'Allow authenticated users to insert own competition refunds',
    'Allow admin read competition refunds',
    'Allow admin update competition refunds',
    'Allow admin delete competition refunds',
    'Allow authenticated users to read own payment events',
    'Allow admin read payment events',
  ],
  constraint: [
    'competition_payments_pkey',
    'competition_payments_provider_check',
    'competition_payments_status_check',
    'competition_payments_amount_currency_check',
    'competition_payments_amount_value_check',
    'competition_payments_created_by_role_check',
    'competition_refunds_pkey',
    'competition_refunds_provider_check',
    'competition_refunds_status_check',
    'competition_refunds_amount_currency_check',
    'competition_refunds_amount_value_check',
    'payment_events_pkey',
    'payment_events_event_type_check',
  ],
  trigger: [
    'competition_payments_touch_updated_at',
    'competition_refunds_touch_updated_at',
    'competition_payments_sync_application_payment_status',
    'competition_refunds_sync_application_payment_status',
    'competition_payments_log_status_event',
    'competition_refunds_log_status_event',
  ],
  index: [
    'competition_payments_pkey',
    'competition_payments_application_id_idx',
    'competition_payments_owner_user_id_idx',
    'competition_payments_status_idx',
    'competition_payments_updated_at_idx',
    'competition_payments_active_application_unique_idx',
    'competition_refunds_pkey',
    'competition_refunds_payment_id_idx',
    'competition_refunds_application_id_idx',
    'competition_refunds_owner_user_id_idx',
    'competition_refunds_status_idx',
    'competition_refunds_updated_at_idx',
    'competition_refunds_active_payment_unique_idx',
    'payment_events_pkey',
    'payment_events_payment_id_idx',
    'payment_events_refund_id_idx',
    'payment_events_application_id_idx',
  ],
  publication: [
    'public.competition_payments',
    'public.competition_refunds',
    'public.payment_events',
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

async function queryCompetitionPaymentsContract({ accessToken, projectRef }) {
  const response = await fetch(`${PROJECTS_API_BASE_URL}/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        with target_tables as (
          select unnest(array[
            'competition_payments',
            'competition_refunds',
            'payment_events'
          ]) as table_name
        ),
        found_objects as (
          select
            'table' as object_type,
            table_schema || '.' || table_name as object_name
          from information_schema.tables
          where table_schema = 'public'
            and table_name in (select table_name from target_tables)

          union all

          select
            'rls' as object_type,
            namespace.nspname || '.' || class.relname as object_name
          from pg_class as class
          join pg_namespace as namespace
            on namespace.oid = class.relnamespace
          where namespace.nspname = 'public'
            and class.relname in (select table_name from target_tables)
            and class.relrowsecurity = true

          union all

          select
            'policy' as object_type,
            policy.policyname as object_name
          from pg_policies as policy
          where policy.schemaname = 'public'
            and policy.tablename in (select table_name from target_tables)

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
            and class.relname in (select table_name from target_tables)

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
            and class.relname in ('competition_payments', 'competition_refunds')
            and trigger_info.tgisinternal = false

          union all

          select
            'index' as object_type,
            index_info.indexname as object_name
          from pg_indexes as index_info
          where index_info.schemaname = 'public'
            and index_info.tablename in (select table_name from target_tables)

          union all

          select
            'publication' as object_type,
            schemaname || '.' || tablename as object_name
          from pg_publication_tables
          where pubname = 'supabase_realtime'
            and schemaname = 'public'
            and tablename in (select table_name from target_tables)
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
    const payload = await queryCompetitionPaymentsContract({
      accessToken,
      projectRef: resolvedProjectRef,
    })
    const rows = normalizeRows(payload)
    const missingObjects = getMissingObjects(createFoundSet(rows))

    if (missingObjects.length) {
      console.error('Competition payments contract is incomplete.')
      console.error('Missing:')
      missingObjects.forEach((objectName) => {
        console.error(`- ${objectName}`)
      })
      process.exitCode = 1
      return
    }

    console.log(`Competition payments contract is ready in project ${resolvedProjectRef}.`)
    console.log('Checked: tables, RLS, policies, constraints, triggers, indexes, publication.')
  } catch (error) {
    fail(
      error instanceof Error
        ? error.message
        : 'Не удалось проверить Supabase contract для competition payments.',
    )
  }
}

await main()

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const ENV_PATH = resolve(process.cwd(), '.env.local')
const PROJECTS_API_BASE_URL = 'https://api.supabase.com/v1/projects'
const POSTGRES_IDENTIFIER_MAX_LENGTH = 63

const REQUIRED_OBJECTS = {
  table: [
    'public.email_templates',
    'public.email_messages',
    'public.email_recipients',
    'public.email_events',
  ],
  rls: [
    'public.email_templates',
    'public.email_messages',
    'public.email_recipients',
    'public.email_events',
  ],
  policy: [
    'Allow admin read email templates',
    'Allow admin manage email templates',
    'Allow admin read email messages',
    'Allow authenticated users to read own email messages',
    'Allow admin insert email messages',
    'Allow admin update email messages',
    'Allow admin delete email messages',
    'Allow admin read email recipients',
    'Allow authenticated users to read own email recipients',
    'Allow admin insert email recipients',
    'Allow admin update email recipients',
    'Allow admin delete email recipients',
    'Allow admin read email events',
    'Allow admin insert email events',
  ],
  constraint: [
    'email_templates_pkey',
    'email_templates_key_key',
    'email_templates_key_check',
    'email_templates_category_check',
    'email_messages_pkey',
    'email_messages_audience_type_check',
    'email_messages_context_type_check',
    'email_messages_status_check',
    'email_messages_subject_check',
    'email_messages_body_check',
    'email_recipients_pkey',
    'email_recipients_recipient_type_check',
    'email_recipients_status_check',
    'email_recipients_email_check',
    'email_recipients_message_email_unique',
    'email_events_pkey',
    'email_events_event_type_check',
  ],
  trigger: [
    'email_templates_touch_updated_at',
    'email_messages_touch_updated_at',
    'email_recipients_touch_updated_at',
  ],
  index: [
    'email_templates_pkey',
    'email_templates_key_key',
    'email_templates_key_idx',
    'email_templates_category_idx',
    'email_messages_pkey',
    'email_messages_status_idx',
    'email_messages_context_idx',
    'email_messages_created_at_idx',
    'email_recipients_pkey',
    'email_recipients_message_id_idx',
    'email_recipients_owner_user_id_idx',
    'email_recipients_status_idx',
    'email_events_pkey',
    'email_events_message_id_idx',
    'email_events_recipient_id_idx',
  ],
  publication: [
    'public.email_templates',
    'public.email_messages',
    'public.email_recipients',
    'public.email_events',
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

function fail(message) {
  console.error(message)
  process.exitCode = 1
}

function normalizePostgresIdentifier(identifier) {
  return identifier.slice(0, POSTGRES_IDENTIFIER_MAX_LENGTH)
}

async function queryAccountEmailContract({ accessToken, projectRef }) {
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
            'email_templates',
            'email_messages',
            'email_recipients',
            'email_events'
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
            and class.relname in ('email_templates', 'email_messages', 'email_recipients')
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
    const payload = await queryAccountEmailContract({
      accessToken,
      projectRef: resolvedProjectRef,
    })
    const missingObjects = getMissingObjects(createFoundSet(normalizeRows(payload)))

    if (missingObjects.length) {
      console.error('Account email contract is incomplete.')
      console.error('Missing:')
      missingObjects.forEach((objectName) => {
        console.error(`- ${objectName}`)
      })
      process.exitCode = 1
      return
    }

    console.log(`Account email contract is ready in project ${resolvedProjectRef}.`)
    console.log('Checked: tables, RLS, policies, constraints, triggers, indexes, publication.')
  } catch (error) {
    fail(error instanceof Error ? error.message : 'Не удалось проверить Supabase contract для account email.')
  }
}

await main()

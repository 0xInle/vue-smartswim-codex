import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const ENV_PATH = resolve(process.cwd(), '.env.local')
const PROJECTS_API_BASE_URL = 'https://api.supabase.com/v1/projects'

const REQUIRED_OBJECTS = {
  table: [
    'public.competitions',
    'public.competition_stages',
    'public.competition_stage_distances',
    'public.competition_registration_options',
    'public.competition_faq_sections',
    'public.competition_faq_items',
  ],
  rls: [
    'public.competitions',
    'public.competition_stages',
    'public.competition_stage_distances',
    'public.competition_registration_options',
    'public.competition_faq_sections',
    'public.competition_faq_items',
  ],
  policy: [
    'Allow public read competitions',
    'Allow admin write competitions',
    'Allow public read competition stages',
    'Allow admin write competition stages',
    'Allow public read competition stage distances',
    'Allow admin write competition stage distances',
    'Allow public read competition registration options',
    'Allow admin write competition registration options',
    'Allow public read competition faq sections',
    'Allow admin write competition faq sections',
    'Allow public read competition faq items',
    'Allow admin write competition faq items',
  ],
  constraint: [
    'competitions_pkey',
    'competitions_slug_key',
    'competition_stages_pkey',
    'competition_stages_stage_number_check',
    'competition_stages_registration_limit_check',
    'competition_stages_unique_stage_number',
    'competition_stage_distances_pkey',
    'competition_registration_options_pkey',
    'competition_registration_options_unique_key',
    'competition_faq_sections_pkey',
    'competition_faq_sections_placement_check',
    'competition_faq_items_pkey',
    'competition_applications_stage_id_fkey',
  ],
  column: [
    'public.competition_stages.certificate_url',
    'public.competition_stages.memo_url',
    'public.competition_stages.registration_limit',
  ],
  trigger: [
    'competitions_touch_updated_at',
    'competition_stages_touch_updated_at',
  ],
  index: [
    'competitions_pkey',
    'competitions_slug_key',
    'competitions_sort_order_idx',
    'competition_stages_pkey',
    'competition_stages_unique_stage_number',
    'competition_stages_competition_sort_idx',
    'competition_stages_public_idx',
    'competition_stages_registration_limit_idx',
    'competition_stage_distances_pkey',
    'competition_stage_distances_stage_sort_idx',
    'competition_registration_options_pkey',
    'competition_registration_options_unique_key',
    'competition_registration_options_competition_sort_idx',
    'competition_faq_sections_pkey',
    'competition_faq_sections_competition_sort_idx',
    'competition_faq_items_pkey',
    'competition_faq_items_section_sort_idx',
  ],
  publication: [
    'public.competitions',
    'public.competition_stages',
    'public.competition_stage_distances',
    'public.competition_registration_options',
    'public.competition_faq_sections',
    'public.competition_faq_items',
  ],
  seed: [
    'competitions:min:2',
    'competition_stages:min:18',
    'competition_registration_options:min:4',
    'competition_faq_sections:min:4',
    'competition_faq_items:min:10',
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

async function queryContract({ accessToken, projectRef }) {
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
            'competitions',
            'competition_stages',
            'competition_stage_distances',
            'competition_registration_options',
            'competition_faq_sections',
            'competition_faq_items'
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
            and (
              class.relname in (select table_name from target_tables)
              or class.relname = 'competition_applications'
            )

          union all

          select
            'column' as object_type,
            table_schema || '.' || table_name || '.' || column_name as object_name
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'competition_stages'
            and column_name in ('certificate_url', 'memo_url', 'registration_limit')

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
            and class.relname in ('competitions', 'competition_stages')
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

          union all

          select 'seed' as object_type, 'competitions:min:' || count(*)::text as object_name
          from public.competitions

          union all

          select 'seed' as object_type, 'competition_stages:min:' || count(*)::text as object_name
          from public.competition_stages

          union all

          select 'seed' as object_type, 'competition_registration_options:min:' || count(*)::text as object_name
          from public.competition_registration_options

          union all

          select 'seed' as object_type, 'competition_faq_sections:min:' || count(*)::text as object_name
          from public.competition_faq_sections

          union all

          select 'seed' as object_type, 'competition_faq_items:min:' || count(*)::text as object_name
          from public.competition_faq_items
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
    const objectName = row.object_name || row.objectName || ''

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

function seedRequirementIsMet(foundNames, requirement) {
  const [tableName, marker, minimumValue] = requirement.split(':')
  const minimum = Number(minimumValue)

  if (marker !== 'min' || !Number.isFinite(minimum)) {
    return foundNames.has(requirement)
  }

  return Array.from(foundNames).some((foundName) => {
    const [foundTableName, foundMarker, foundValue] = foundName.split(':')

    return (
      foundTableName === tableName &&
      foundMarker === marker &&
      Number(foundValue) >= minimum
    )
  })
}

function getMissingObjects(foundObjects) {
  return Object.entries(REQUIRED_OBJECTS).flatMap(([objectType, objectNames]) => {
    const foundNames = foundObjects.get(objectType) || new Set()

    return objectNames
      .filter((objectName) =>
        objectType === 'seed'
          ? !seedRequirementIsMet(foundNames, objectName)
          : !foundNames.has(objectName),
      )
      .map((objectName) => `${objectType}: ${objectName}`)
  })
}

async function main() {
  const localEnv = await readLocalEnv()
  const { supabaseUrl, projectRef, accessToken } = getEffectiveEnv(localEnv)
  const resolvedProjectRef = getProjectRef({ projectRef, supabaseUrl })

  if (!accessToken) {
    fail('Не найден SUPABASE_ACCESS_TOKEN. Добавьте PAT в .env.local и повторите команду.')
    return
  }

  if (!resolvedProjectRef) {
    fail('Не удалось определить ref проекта. Заполните SUPABASE_PROJECT_REF или VITE_SUPABASE_URL.')
    return
  }

  try {
    const rows = normalizeRows(await queryContract({ accessToken, projectRef: resolvedProjectRef }))
    const missingObjects = getMissingObjects(createFoundSet(rows))

    if (missingObjects.length) {
      console.error('Normalized competition catalog contract is incomplete.')
      console.error('Missing:')
      missingObjects.forEach((objectName) => {
        console.error(`- ${objectName}`)
      })
      process.exitCode = 1
      return
    }

    console.log(`Normalized competition catalog contract is ready in project ${resolvedProjectRef}.`)
    console.log('Checked: tables, columns, RLS, policies, constraints, triggers, indexes, realtime publication, seed rows.')
  } catch (error) {
    fail(
      error instanceof Error
        ? error.message
        : 'Не удалось проверить Supabase contract для normalized competition catalog.',
    )
  }
}

await main()

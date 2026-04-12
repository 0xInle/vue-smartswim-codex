import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const ENV_PATH = resolve(process.cwd(), '.env.local')
const PROJECTS_API_BASE_URL = 'https://api.supabase.com/v1/projects'
const DEFAULT_EXCLUDED_SCHEMAS = ['information_schema', 'pg_catalog', 'pg_toast']

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

async function queryProjectTables({ accessToken, projectRef }) {
  const response = await fetch(`${PROJECTS_API_BASE_URL}/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        select
          table_schema,
          table_name
        from information_schema.tables
        where table_type = 'BASE TABLE'
          and table_schema not in (${DEFAULT_EXCLUDED_SCHEMAS.map((schema) => `'${schema}'`).join(', ')})
        order by table_schema, table_name;
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

async function main() {
  const localEnv = await readLocalEnv()
  const { supabaseUrl, projectRef, accessToken } = getEffectiveEnv(localEnv)
  const resolvedProjectRef = getProjectRef({ projectRef, supabaseUrl })

  if (!accessToken) {
    fail(
      'Не найден SUPABASE_ACCESS_TOKEN. Publishable/anon key не подходит для вывода схемы. Добавьте PAT в .env.local и повторите команду.',
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
    const payload = await queryProjectTables({
      accessToken,
      projectRef: resolvedProjectRef,
    })
    const rows = normalizeRows(payload)

    if (!rows.length) {
      console.log(`В проекте ${resolvedProjectRef} не найдено таблиц или API вернул пустой список.`)
      return
    }

    console.log(`Таблицы проекта ${resolvedProjectRef}:`)

    for (const row of rows) {
      console.log(`- ${row.table_schema}.${row.table_name}`)
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : 'Не удалось получить список таблиц Supabase.')
  }
}

await main()

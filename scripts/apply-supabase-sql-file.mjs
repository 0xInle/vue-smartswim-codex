import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const ENV_PATH = resolve(process.cwd(), '.env.local')
const PROJECTS_API_BASE_URL = 'https://api.supabase.com/v1/projects'

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

async function main() {
  const sqlPath = process.argv[2] || ''

  if (!sqlPath) {
    throw new Error('Usage: node scripts/apply-supabase-sql-file.mjs <path-to-sql>')
  }

  const localEnv = await readLocalEnv()
  const supabaseUrl = process.env.VITE_SUPABASE_URL || localEnv.VITE_SUPABASE_URL || ''
  const projectRef = getProjectRef({
    projectRef: process.env.SUPABASE_PROJECT_REF || localEnv.SUPABASE_PROJECT_REF || '',
    supabaseUrl,
  })
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN || localEnv.SUPABASE_ACCESS_TOKEN || ''

  if (!accessToken) {
    throw new Error('Не найден SUPABASE_ACCESS_TOKEN. Добавьте PAT в .env.local.')
  }

  if (!projectRef) {
    throw new Error('Не удалось определить Supabase project ref.')
  }

  const query = await readFile(resolve(process.cwd(), sqlPath), 'utf8')
  const response = await fetch(`${PROJECTS_API_BASE_URL}/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      read_only: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Supabase Management API error ${response.status}: ${await response.text()}`)
  }

  console.log(`Applied ${sqlPath} to project ${projectRef}.`)
}

await main()

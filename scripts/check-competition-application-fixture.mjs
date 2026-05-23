import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const ENV_PATH = resolve(process.cwd(), '.env.local')
const PROJECTS_API_BASE_URL = 'https://api.supabase.com/v1/projects'
const DEFAULT_FIXTURE_ID = '5e38dfd0-03f8-45f2-88ec-4e3d8f683d23'
const DEFAULT_FIXTURE_STATUS = 'reviewing'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const STATUS_PATTERN = /^[a-z_]+$/

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
    fixtureId:
      process.env.SUPABASE_COMPETITION_APPLICATION_FIXTURE_ID ||
      localEnv.SUPABASE_COMPETITION_APPLICATION_FIXTURE_ID ||
      DEFAULT_FIXTURE_ID,
    fixtureStatus:
      process.env.SUPABASE_COMPETITION_APPLICATION_FIXTURE_STATUS ||
      localEnv.SUPABASE_COMPETITION_APPLICATION_FIXTURE_STATUS ||
      DEFAULT_FIXTURE_STATUS,
  }
}

function fail(message) {
  console.error(message)
  process.exitCode = 1
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

async function queryCompetitionApplicationFixture({ accessToken, projectRef, fixtureId }) {
  const response = await fetch(`${PROJECTS_API_BASE_URL}/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        select
          id,
          owner_email,
          owner_name,
          participant_snapshot ->> 'name' as participant_name,
          competition_slug,
          competition_name,
          stage_id,
          status,
          created_at,
          updated_at
        from public.competition_applications
        where id = '${fixtureId}'::uuid
        limit 1;
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

async function main() {
  const localEnv = await readLocalEnv()
  const { supabaseUrl, projectRef, accessToken, fixtureId, fixtureStatus } =
    getEffectiveEnv(localEnv)
  const resolvedProjectRef = getProjectRef({ projectRef, supabaseUrl })

  if (!accessToken) {
    fail(
      'Не найден SUPABASE_ACCESS_TOKEN. Publishable/anon key не подходит для проверки fixture. Добавьте PAT в .env.local и повторите команду.',
    )
    return
  }

  if (!resolvedProjectRef) {
    fail(
      'Не удалось определить ref проекта. Заполните SUPABASE_PROJECT_REF или VITE_SUPABASE_URL в .env.local.',
    )
    return
  }

  if (!UUID_PATTERN.test(fixtureId)) {
    fail('SUPABASE_COMPETITION_APPLICATION_FIXTURE_ID должен быть валидным UUID.')
    return
  }

  if (!STATUS_PATTERN.test(fixtureStatus)) {
    fail('SUPABASE_COMPETITION_APPLICATION_FIXTURE_STATUS должен содержать только a-z и _.')
    return
  }

  try {
    const payload = await queryCompetitionApplicationFixture({
      accessToken,
      projectRef: resolvedProjectRef,
      fixtureId,
    })
    const [fixture] = normalizeRows(payload)

    if (!fixture) {
      fail(`Competition application fixture ${fixtureId} не найдена в проекте ${resolvedProjectRef}.`)
      return
    }

    if (fixture.status !== fixtureStatus) {
      fail(
        `Competition application fixture ${fixtureId} имеет status "${fixture.status}", ожидался "${fixtureStatus}".`,
      )
      return
    }

    console.log(`Competition application fixture is ready in project ${resolvedProjectRef}.`)
    console.log(
      [
        `id=${fixture.id}`,
        `status=${fixture.status}`,
        `owner=${fixture.owner_email || fixture.owner_name || 'unknown'}`,
        `participant=${fixture.participant_name || 'unknown'}`,
        `competition=${fixture.competition_name || fixture.competition_slug || 'unknown'}`,
        `stage=${fixture.stage_id || 'unknown'}`,
      ].join(' | '),
    )
  } catch (error) {
    fail(
      error instanceof Error
        ? error.message
        : 'Не удалось проверить Supabase fixture для competition applications.',
    )
  }
}

await main()

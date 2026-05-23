const APPLICATION_SOURCE_LOCAL = 'local'
const APPLICATION_SOURCE_SUPABASE = 'supabase'
const APPLICATION_SOURCE_VALUES = new Set([APPLICATION_SOURCE_LOCAL, APPLICATION_SOURCE_SUPABASE])

export const COMPETITION_APPLICATION_SOURCE = {
  LOCAL: APPLICATION_SOURCE_LOCAL,
  SUPABASE: APPLICATION_SOURCE_SUPABASE,
}

export function getCompetitionApplicationSource() {
  const source = String(import.meta.env.VITE_COMPETITION_APPLICATIONS_SOURCE || '')
    .trim()
    .toLowerCase()

  if (APPLICATION_SOURCE_VALUES.has(source)) {
    return source
  }

  return APPLICATION_SOURCE_SUPABASE
}

export function isSupabaseCompetitionApplicationSource() {
  return getCompetitionApplicationSource() === APPLICATION_SOURCE_SUPABASE
}

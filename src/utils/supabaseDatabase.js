const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function getSupabaseConfigError() {
  return 'Supabase не настроен. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.'
}

function getSupabaseRestHeaders() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(getSupabaseConfigError())
  }

  return {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  }
}

function getSupabaseRestUrl(pathname, search = '') {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(getSupabaseConfigError())
  }

  return `${supabaseUrl}/rest/v1/${pathname}${search}`
}

export async function fetchCrmUsers() {
  const searchParams = new URLSearchParams({
    select: 'id,email,name,registered_at',
    order: 'registered_at.desc',
  })

  const response = await fetch(getSupabaseRestUrl('crm_users', `?${searchParams.toString()}`), {
    method: 'GET',
    headers: getSupabaseRestHeaders(),
    cache: 'no-store',
  })

  const payload = await response.json().catch(() => [])

  if (!response.ok) {
    const message = Array.isArray(payload)
      ? 'Не удалось загрузить пользователей.'
      : payload?.message || payload?.hint || 'Не удалось загрузить пользователей.'

    if (typeof message === 'string' && /crm_users/i.test(message)) {
      throw new Error(
        'Таблица crm_users не найдена. Выполните SQL из файла supabase/crm_users.sql в Supabase SQL Editor.',
      )
    }

    throw new Error(message)
  }

  if (!Array.isArray(payload)) {
    return []
  }

  return payload.map((user) => ({
    id: user.id ?? null,
    email: user.email ?? '',
    name: user.name ?? '',
    registeredAt: user.registered_at ?? null,
  }))
}

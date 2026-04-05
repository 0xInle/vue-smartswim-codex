const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function getSupabaseHeaders() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase не настроен. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.')
  }

  return {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
  }
}

export async function signUpWithPassword({ email, password, name }) {
  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: getSupabaseHeaders(),
    body: JSON.stringify({
      email,
      password,
      data: {
        name,
      },
    }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = payload?.msg || payload?.message || 'Не удалось зарегистрироваться.'
    throw new Error(message)
  }

  return payload
}

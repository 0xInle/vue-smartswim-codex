import { getSupabaseClient, getSupabaseConfigError } from '@/utils/supabaseClient'

export const SUPABASE_MIN_PASSWORD_LENGTH = 6

function toError(message, fallback = 'Не удалось выполнить запрос к Supabase.') {
  return new Error(message || fallback)
}

export function normalizeAuthUser(user) {
  if (!user) {
    return null
  }

  return {
    id: user.id ?? null,
    name: user.user_metadata?.name || '',
    email: user.email || '',
    registeredAt: user.created_at || null,
  }
}

export async function signUpWithPassword({ email, password, name, emailRedirectTo }) {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        name,
      },
    },
  })

  if (error) {
    throw toError(error.message, 'Не удалось зарегистрироваться.')
  }

  return data
}

export async function signInWithPassword({ email, password }) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw toError(error.message, 'Не удалось войти в личный кабинет.')
  }

  return data
}

export async function requestPasswordReset({ email, redirectTo }) {
  const { data, error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    throw toError(error.message, 'Не удалось отправить письмо для восстановления пароля.')
  }

  return data
}

export async function updateCurrentUserPassword({ password }) {
  const { data, error } = await getSupabaseClient().auth.updateUser({
    password,
  })

  if (error) {
    throw toError(error.message, 'Не удалось обновить пароль.')
  }

  return data
}

export async function signOutCurrentUser() {
  const { error } = await getSupabaseClient().auth.signOut()

  if (error) {
    throw toError(error.message, 'Не удалось завершить сессию.')
  }
}

export async function getCurrentSession() {
  const { data, error } = await getSupabaseClient().auth.getSession()

  if (error) {
    throw toError(error.message, getSupabaseConfigError())
  }

  return data.session
}

export async function getCurrentUser() {
  const { data, error } = await getSupabaseClient().auth.getUser()

  if (error) {
    throw toError(error.message, 'Не удалось получить данные пользователя.')
  }

  return data.user
}

export function subscribeToAuthStateChange(callback) {
  try {
    const { data } = getSupabaseClient().auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })

    return data.subscription
  } catch (error) {
    const message = error instanceof Error ? error.message : ''

    if (message === getSupabaseConfigError()) {
      return null
    }

    throw error
  }
}

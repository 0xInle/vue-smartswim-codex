import { getCurrentSession } from '@/utils/supabaseAuth'
import { getSupabaseClient } from '@/utils/supabaseClient'

export async function fetchCrmUsers() {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error('Сессия истекла. Войдите в личный кабинет заново.')
  }

  const { data, error } = await getSupabaseClient()
    .from('crm_users')
    .select('id,email,name,registered_at')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) {
    if (/crm_users/i.test(error.message)) {
      throw new Error(
        'Профиль CRM недоступен: таблица crm_users не найдена. Выполните SQL из файла supabase/crm_users.sql в Supabase SQL Editor.',
      )
    }

    throw new Error(error.message || 'Не удалось загрузить профиль пользователя из CRM.')
  }

  if (!data) {
    throw new Error(
      'Пользователь авторизован в Supabase Auth, но профиль в crm_users не создан. Проверьте trigger handle_auth_user_created и содержимое таблицы crm_users.',
    )
  }

  return [
    {
      id: data.id ?? null,
      email: data.email ?? '',
      name: data.name ?? '',
      registeredAt: data.registered_at ?? null,
    },
  ]
}

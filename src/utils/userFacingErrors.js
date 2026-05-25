const CYRILLIC_RE = /[А-Яа-яЁё]/

const ERROR_TRANSLATIONS = [
  {
    test: /cannot coerce the result to a single json object|json object requested, multiple \(or no\) rows returned/i,
    message: 'Запись не найдена или недоступна для изменения.',
  },
  {
    test: /row-level security|violates row-level security policy|permission denied/i,
    message: 'Недостаточно прав для выполнения действия.',
  },
  {
    test: /jwt expired|invalid jwt|session.*expired|refresh token.*expired/i,
    message: 'Сессия истекла. Войдите в личный кабинет заново.',
  },
  {
    test: /refresh token not found|auth session missing|session_not_found/i,
    message: 'Сессия не найдена. Войдите в личный кабинет заново.',
  },
  {
    test: /invalid login credentials/i,
    message: 'Неверная почта или пароль.',
  },
  {
    test: /email not confirmed/i,
    message: 'Подтвердите почту перед входом.',
  },
  {
    test: /user already registered|already registered/i,
    message: 'Пользователь с такой почтой уже зарегистрирован.',
  },
  {
    test: /signup.*disabled|signups not allowed/i,
    message: 'Регистрация через почту сейчас отключена.',
  },
  {
    test: /password should be at least|password.*characters/i,
    message: 'Пароль слишком короткий.',
  },
  {
    test: /weak password/i,
    message: 'Пароль слишком простой. Используйте более надежный пароль.',
  },
  {
    test: /email rate limit exceeded|rate limit|for security purposes/i,
    message: 'Слишком много запросов. Подождите немного и попробуйте снова.',
  },
  {
    test: /database error saving new user/i,
    message: 'Не удалось создать аккаунт из-за серверной ошибки. Попробуйте позже.',
  },
  {
    test: /duplicate key value violates unique constraint/i,
    message: 'Такая запись уже существует.',
  },
  {
    test: /violates foreign key constraint/i,
    message: 'Связанная запись не найдена. Обновите страницу и попробуйте снова.',
  },
  {
    test: /invalid input syntax for type uuid/i,
    message: 'Некорректный идентификатор записи.',
  },
  {
    test: /failed to fetch|networkerror|load failed|fetch failed/i,
    message: 'Не удалось подключиться к серверу. Проверьте интернет и попробуйте снова.',
  },
]

export function getUserFacingErrorMessage(error, fallback = 'Не удалось выполнить действие.') {
  const message = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : error?.message || ''
  const normalizedMessage = String(message || '').trim()

  if (!normalizedMessage) {
    return fallback
  }

  if (CYRILLIC_RE.test(normalizedMessage)) {
    return normalizedMessage
  }

  const translation = ERROR_TRANSLATIONS.find(({ test }) => test.test(normalizedMessage))

  return translation?.message || fallback
}

# Smart Swim

Промо-сайт и клиентский кабинет Smart Swim на `Vue 3` и `Vite`.

## Стек

- `Vue 3`
- `Vite`
- `Vue Router`
- `Pinia`
- `Element Plus`
- `Supabase`

## Требования

- `Node.js` версии `^20.19.0` или `>=22.12.0`
- `npm`

Проверить версии можно так:

```sh
node -v
npm -v
```

## Быстрый старт

1. Скачайте репозиторий и перейдите в папку проекта:

```sh
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ>
cd vue-smartswim
```

2. Установите зависимости:

```sh
npm install
```

3. Создайте локальный env-файл на основе примера:

```sh
cp .env.example .env.local
```

4. Заполните переменные в `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

5. Запустите проект:

```sh
npm run dev
```

После запуска Vite покажет локальный адрес, обычно `http://localhost:5173`.

## Что работает без Supabase

Без настроенного Supabase сайт может открываться и рендерить публичные страницы, если не заходить в сценарии авторизации.

## Что требует Supabase

Без корректных значений `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` не будут работать:

- регистрация
- вход в личный кабинет
- маршрут `/account`
- загрузка данных CRM-профиля

Если Supabase не настроен, приложение покажет ошибки только в соответствующих сценариях.

## Настройка Supabase

Для работы личного кабинета нужен проект в Supabase.

1. Создайте проект в Supabase.
2. Возьмите `Project URL` и `anon public key`.
3. Вставьте их в `.env.local`.
4. Откройте `SQL Editor` в Supabase.
5. Выполните SQL из файла [supabase/crm_users.sql](/Users/sergeybiryukov/Documents/Frontend/Vue/vue-smartswim/supabase/crm_users.sql).

Этот SQL:

- создает таблицу `public.crm_users`
- включает `row level security`
- создает policy для чтения собственного профиля
- создает trigger, который синхронизирует пользователя из `auth.users` в `crm_users`

## Команды

Запуск dev-сервера:

```sh
npm run dev
```

Production-сборка:

```sh
npm run build
```

Локальный preview production-сборки:

```sh
npm run preview
```

Линтинг:

```sh
npm run lint
```

## Проверка после установки

Если хотите быстро проверить, что проект поднялся корректно:

1. Выполните `npm run build`.
2. Выполните `npm run dev`.
3. Откройте главную страницу.
4. Проверьте переходы по основным маршрутам.
5. Если настраивали Supabase, проверьте регистрацию, вход и страницу `/account`.

## Структура проекта

- `src/main.js` - точка входа
- `src/App.vue` - корневой layout
- `src/router/index.js` - маршруты
- `src/components` - глобальные компоненты
- `src/pages` - страницы сайта
- `src/utils` - утилиты, включая работу с Supabase
- `public` - публичные изображения, видео и шрифты
- `supabase` - SQL для настройки CRM-таблиц

## Возможные проблемы

### Проект не стартует после `npm install`

Проверьте версию `Node.js`. Для проекта требуется `^20.19.0` или `>=22.12.0`.

### Открывается сайт, но не работает кабинет

Проверьте:

- существует ли `.env.local`
- заполнены ли `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`
- выполнен ли SQL из `supabase/crm_users.sql`

### Открывается `/account`, но нет профиля пользователя

Скорее всего, в Supabase не создана или не заполнена таблица `crm_users`, либо не сработал trigger `handle_auth_user_created`.

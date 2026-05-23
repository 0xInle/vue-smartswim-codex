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
SUPABASE_PROJECT_REF=
SUPABASE_ACCESS_TOKEN=
```

`SUPABASE_PROJECT_REF` и `SUPABASE_ACCESS_TOKEN` не нужны для работы клиентского приложения. Они используются только для локальных служебных команд, например для вывода реальных таблиц проекта через Management API.

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
- отправка hero-формы консультации
- заявки на соревнования в личном кабинете и CRM

Если Supabase не настроен, приложение покажет ошибки только в соответствующих сценариях.

## Auth flow и email-подтверждение

- клиентская форма регистрации и смены пароля валидирует пароль по минимуму `6` символов, как и Supabase Auth;
- восстановление пароля отправляет письмо со ссылкой обратно в приложение, после перехода открывается сценарий задания нового пароля;
- моментальный вход в CRM сразу после регистрации возможен только если в `Supabase Dashboard -> Authentication -> Providers -> Email` отключено обязательное подтверждение email;
- если подтверждение email включено, приложение всё равно поддерживает этот flow: после перехода по ссылке из письма пользователь попадает обратно в приложение и автоматически открывает CRM, но сам факт открытия новой вкладки зависит от почтового клиента и браузера, а не от фронтенда.

## Настройка Supabase

Для работы личного кабинета нужен проект в Supabase.

1. Создайте проект в Supabase.
2. Возьмите `Project URL` и `anon public key`.
3. Вставьте их в `.env.local`.
4. Откройте `SQL Editor` в Supabase.
5. Выполните SQL из файла [supabase/crm_users.sql](/Users/sergeybiryukov/Documents/Frontend/Vue/vue-smartswim/supabase/crm_users.sql).
6. Выполните SQL из файла [supabase/consultation_requests.sql](/Users/sergeybiryukov/Documents/Frontend/Vue/vue-smartswim/supabase/consultation_requests.sql).
7. Выполните SQL из файла [supabase/competition_applications.sql](/Users/sergeybiryukov/Documents/Frontend/Vue/vue-smartswim/supabase/competition_applications.sql), чтобы включить заявки на соревнования в личном кабинете и CRM.

Этот SQL:

- создает таблицу `public.crm_users`
- создает таблицу `public.allowed_admin_emails`
- создает таблицу `public.trainers`
- добавляет поле `role` со значениями `admin | trainer | user`
- включает `row level security`
- создает policy для чтения собственного профиля
- создает trigger, который синхронизирует пользователя из `auth.users` в `crm_users`
- назначает роль `admin` только тем email, которые заранее внесены в `public.allowed_admin_emails`

SQL для `consultation_requests`:

- создает таблицу заявок на консультацию;
- оставляет публичный `insert` для hero-формы на главной;
- ограничивает `select/update/delete` по заявкам только ролью `admin`.

SQL для `competition_applications`:

- создает таблицу заявок на соревнования;
- создает таблицу событий статусов заявок;
- включает `row level security`;
- разрешает пользователю читать свои заявки и создавать заявки только от своего `auth.uid()`;
- разрешает администратору читать и обрабатывать все заявки;
- добавляет constraints для lifecycle-статусов, индексы и realtime publication guards.

По умолчанию заявки на соревнования читаются и сохраняются в Supabase. Для локального rollback или проверки старого прототипа можно явно вернуть localStorage-источник:

```env
VITE_COMPETITION_APPLICATIONS_SOURCE=local
```

Значение `supabase` также поддерживается явно, но без этой переменной Supabase уже используется как default source.

`local` считается deprecated rollback/debug path: новые проверки, пользовательские сценарии и CRM-сценарии заявок должны опираться на Supabase. Не удаляйте localStorage fallback без отдельного removal-этапа. Перед удалением нужно подтвердить, что user/admin Supabase smoke стабильно проходит, локальный rollback не нужен для текущего релиза, судьба тестовой Supabase-заявки зафиксирована, а свежий audit больше не находит production UI, завязанный на localStorage source.

## Роли

- `admin` — полный доступ к CRM и заявкам.
- `trainer` — доступ в `/account`, детальные рабочие блоки будут добавлены позже.
- `user` — доступ в `/account`, персональные блоки будут добавлены позже.

Маршрут `/account` доступен всем авторизованным пользователям, но содержимое кабинета зависит от роли.

## Чистый старт ролей

Если хотите начать с чистого состояния:

1. Удалите существующих пользователей в `Supabase Dashboard -> Authentication -> Users`.
2. Выполните актуальный SQL из `supabase/crm_users.sql` и `supabase/consultation_requests.sql`.
3. Зарегистрируйте аккаунт `smartswim@inbox.ru`.
4. Этот аккаунт автоматически получит роль `admin`.

Почему это сработает:

- `smartswim@inbox.ru` заранее добавляется в `public.allowed_admin_emails`;
- при регистрации trigger проверяет именно эту allowlist-таблицу, а не сам email как магическое правило;
- все остальные новые регистрации создаются с ролью `user`.

Если нужно выдать роль `admin` другому пользователю:

```sql
insert into public.allowed_admin_emails (email, note)
values ('admin2@example.com', 'Дополнительный администратор')
on conflict (email) do update
set note = excluded.note;

update public.crm_users
set role = 'admin'
where lower(email) = lower('admin2@example.com');
```

Если нужно выдать роль `trainer`, email должен быть заранее внесен в таблицу `public.trainers`:

```sql
insert into public.trainers (email, name, note)
values ('trainer@example.com', 'Имя тренера', 'Тренерский доступ')
on conflict (email) do update
set
  name = excluded.name,
  note = excluded.note;

update public.crm_users
set role = 'trainer'
where lower(email) = lower('trainer@example.com');
```

При новой регистрации trigger сам присвоит `trainer`, если email уже существует в `public.trainers`.

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

Вывести реальные таблицы Supabase-проекта:

```sh
npm run supabase:list-tables
```

Для этой команды нужен `SUPABASE_ACCESS_TOKEN` с доступом к проекту. Если `SUPABASE_PROJECT_REF` не задан, команда попытается извлечь его из `VITE_SUPABASE_URL`.

Проверить, что Supabase contract для заявок на соревнования применен:

```sh
npm run supabase:check-competition-applications
```

Команда read-only и проверяет наличие таблиц, RLS, policies, constraints, triggers и индексов из `supabase/competition_applications.sql`. Для нее также нужен `SUPABASE_ACCESS_TOKEN`.

Проверить, что тестовая Supabase-заявка для regression smoke существует и находится в ожидаемом статусе:

```sh
npm run supabase:check-competition-fixture
```

Команда read-only и по умолчанию проверяет заявку `5e38dfd0-03f8-45f2-88ec-4e3d8f683d23` со статусом `reviewing`. Если fixture меняется, можно переопределить `SUPABASE_COMPETITION_APPLICATION_FIXTURE_ID` и `SUPABASE_COMPETITION_APPLICATION_FIXTURE_STATUS` в `.env.local`.

## Проверка после установки

Если хотите быстро проверить, что проект поднялся корректно:

1. Выполните `npm run build`.
2. Выполните `npm run dev`.
3. Откройте главную страницу.
4. Проверьте переходы по основным маршрутам.
5. Если настраивали Supabase, проверьте регистрацию, вход и страницу `/account`.
6. Для `smartswim@inbox.ru` проверьте, что после регистрации открывается кабинет администратора.

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
- выполнен ли SQL из `supabase/consultation_requests.sql`
- выполнен ли SQL из `supabase/competition_applications.sql`, потому что заявки на соревнования по умолчанию используют Supabase
- для `npm run supabase:list-tables` заполнен ли `SUPABASE_ACCESS_TOKEN`
- для `npm run supabase:check-competition-applications` заполнен ли `SUPABASE_ACCESS_TOKEN`
- для `npm run supabase:check-competition-fixture` заполнен ли `SUPABASE_ACCESS_TOKEN`, если проверяете smoke fixture
- если нужно временно проверить старый localStorage-flow заявок, задан ли `VITE_COMPETITION_APPLICATIONS_SOURCE=local`

### Открывается `/account`, но нет профиля пользователя

Скорее всего, в Supabase не создана или не заполнена таблица `crm_users`, либо не сработал trigger `handle_auth_user_created`.

### Админ не видит CRM-заявки

Проверьте:

- выполнен ли SQL из `supabase/consultation_requests.sql`
- зарегистрирован ли пользователь как `smartswim@inbox.ru`
- есть ли у записи в `public.crm_users` роль `admin`

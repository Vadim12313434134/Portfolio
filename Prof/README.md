## Что это за проект

Это frontend на React + Vite для платформы учета мероприятий и баллов студентов.

Основные роли:
- `student` — видит мероприятия, записывается, отправляет отчеты.
- `teacher` — создает/редактирует мероприятия, проверяет отчеты.
- `admin/moderator` — расширенные права (в т.ч. управление пользователями и периодами).

## Технологии

- React 19
- React Router 7
- Vite 8
- Чистый JS (без TypeScript)
- CSS Modules

## Быстрый старт

```bash
npm install
npm run dev
```

Сборка:

```bash
npm run build
npm run preview
```

## Переменные окружения

Используются 2 важных переменных:

- `VITE_API_BASE_URL` — базовый URL для `apiFetch` (по умолчанию `/api`).
- `VITE_API_PROXY_TARGET` — куда проксировать `/api` в dev-режиме (см. `vite.config.js`).

Для статичной cookie-заглушки (чтобы уходила на backend во всех запросах):

- `VITE_STUB_COOKIE` — строка cookie в формате `name=value` (например: `session_id=stub123`).
- `VITE_STUB_COOKIE_HEADER` — имя fallback-заголовка (по умолчанию `X-Stub-Cookie`).
- `VITE_STUB_COOKIE_SAME_SITE` — `Lax`, `Strict` или `None` (по умолчанию `Lax`).
- `VITE_STUB_COOKIE_SECURE` — `true/false` (для `SameSite=None` обычно нужен `true` + HTTPS).

Если `VITE_API_BASE_URL` не задан, фронт ходит через `/api`, а Vite проксирует запросы на backend.

## Роуты приложения

Файл: `src/App.jsx`

- `/AuthPage` — авторизация
- `/MainPage` — главная страница
- `/PersonalAccount` — личный кабинет
- `/Users` — управление пользователями (блок/разблок + периоды/цели)

## Структура проекта

src/
  api/
    apiClient.js            # низкоуровневый fetch + обработка ошибок
    session.js              # localStorage-сессия (token/user)
    backendApi.js           # единая точка экспорта API
    backend/
      shared.js             # endpoints + нормализация данных
      users.js              # auth, users/me, users/search, block/unblock
      events.js             # мероприятия + импорт CSV/шаблон
      reports.js            # отчеты студентов
      periods.js            # учебные периоды
      goals.js              # цели по баллам

  components/
    AuthPage/               # экран логина
    MainPage/               # главная + хук useMainPageData
    PersonalAccount/        # личный кабинет
    UsersPage/              # страница админского управления пользователями
    Common/                 # общие компоненты (например, сайдбар)
```

## Как устроен API слой

### 1) `apiClient.js`

- `apiFetch(path, options)` — универсальный запрос.
- Автоматически добавляет `Authorization: Bearer <token>`, если токен передан.
- Единая обработка ошибок и статусов (`502/503/504` с отдельным сообщением).

### 2) `backend/shared.js`

- Константа `ENDPOINTS` со всеми URL.
- Нормализация форматов данных backend -> frontend (`normalizeUser`, `normalizeEvent`, `normalizeReport` и т.д.).
- Вспомогательные функции для ID, ролей, пагинации, статусов.

### 3) `backend.js`

Каждый файл отвечает за свой домен:
- `users.js` — логин, текущий пользователь, поиск/блокировка пользователей.
- `events.js` — CRUD мероприятий, публикация, завершение, импорт.
- `reports.js` — все по отчетам/проверкам.
- `periods.js` — периоды.
- `goals.js` — цели.

### 4) `backendApi.js`

Переэкспорт функций из доменных файлов. Компоненты импортируют API отсюда, а не напрямую из `backend/*`.

## Авторизация

1. В `AuthPage` отправляется логин/пароль через `loginUser` (`POST /auth/login`).
2. Из ответа берется `token`.
3. Сразу запрашивается профиль через `fetchCurrentUser(token)` (`GET /users/me`).
4. Редирект на `/MainPage`.

Файлы:
- `src/components/AuthPage/AuthPage.jsx`
- `src/api/backend/users.js`
- `src/api/session.js`


### MainPage

- Главная логика в `src/components/MainPage/hooks/useMainPageData.js`.
- Там же:
  - загрузка и фильтрация мероприятий,
  - регистрация/отмена регистрации,
  - админские действия по мероприятиям,
  - импорт CSV и скачивание шаблона.

### PersonalAccount

- `src/components/PersonalAccount/PersonalAccount.jsx` — основной контейнер ЛК.
- Что внутри:
  - профиль пользователя,
  - прогресс по баллам,
  - отправка/черновики отчетов,
  - для teacher/admin — создание мероприятий и импорт CSV (дублировано с главной по UX).

### UsersPage

- `src/components/UsersPage/UsersPage.jsx`.
- Доступ только для admin/moderator.
- Отвечает за:
  - блок/разблок пользователей,
  - управление учебными периодами,
  - управление целями по баллам.

## Как добавлять новый backend endpoint

1. Добавить endpoint в `src/api/backend/shared.js` (`ENDPOINTS`).
2. Добавить функцию запроса в нужный файл `src/api/backend/*.js`.
3. При необходимости добавить нормализацию ответа в `shared.js`.
4. Переэкспортировать функцию в `src/api/backendApi.js`.
5. Использовать в компонентах через импорт из `backendApi.js`.

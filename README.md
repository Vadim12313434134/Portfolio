# Portfolio

Минималистичный сайт-портфолио на React + Express: публичный просмотр работ со слайдерами и админка для публикации.

## Возможности

- Карточки проектов со слайдером фото (до 10 шт.)
- Страница проекта с полным описанием и крупным слайдером
- Админка `/admin`: вход по паролю, создание / редактирование / удаление работ
- Фото хранятся на сервере — сайт доступен всем посетителям

## Установка

```bash
cd Documents/Portfolio
npm run install:all
```

Скопируйте `.env.example` в `.env` (уже есть) и задайте пароль:

```env
PORT=3001
ADMIN_PASSWORD=ваш_пароль
ADMIN_TOKEN_SECRET=длинная_случайная_строка
```

Пароль задаётся в `.env` (локально) или в переменных окружения хостинга.

## Docker (рекомендуется для хостинга)

Локально:

```bash
docker compose up --build
```

Сайт: http://localhost:3000  
Админка: http://localhost:3000/admin

На Deploy-f / Docker-хостинге:

1. Тип деплоя: **Docker**
2. Dockerfile в корне проекта (уже есть)
3. Переменные окружения:

```env
PORT=3000
HOST=0.0.0.0
ADMIN_PASSWORD=ваш_пароль
ADMIN_TOKEN_SECRET=длинная_случайная_строка
```

4. Команда запуска не нужна — используется `CMD` из Dockerfile: `node server/index.js`

Проверка после деплоя: `/api/health` должен вернуть `{"ok":true,...}`.

## Production без Docker

```bash
npm install
npm run build
npm start
```

## Структура

```
Portfolio/
  src/        # Vite + React
  server/     # Express API + uploads
  .env
```

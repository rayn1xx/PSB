# Teaching Platform

ссылка на доступ https://psbstudy.vercel.app/ (только фронт)

демонстрация работы https://drive.google.com/file/d/1KT3SxiuSlfGMStpo6D7ckAIq0UVw87Oz/view?usp=sharing

Команда Киттики

Состав:
Кобалиа Злата - продакт
Пунтиков Алексей - фронтэнд разработчик
Беляев Сергей - Бэкэнд разработчик

Образовательная платформа с полным набором API endpoints для студентов.

## Структура проекта

- `back/` - Backend на FastAPI
- `front/` - Frontend на React + TypeScript + Vite

## Запуск через Docker Compose

1. Скопируйте `.env.example` в `.env` и настройте переменные окружения:

```bash
cp .env.example .env
```

2. (Опционально) Настройте Yandex Object Storage для хранения файлов:

   - Создайте бакет в [Yandex Cloud Console](https://console.cloud.yandex.ru/)
   - Получите Access Key ID и Secret Access Key
   - Добавьте их в `.env` файл (см. `.env.example`)
   - Без S3 файлы не будут загружаться, но остальной функционал работает

3. Запустите все сервисы:

```bash
docker-compose up -d
```

Сервисы будут доступны:

- Backend API: http://localhost:8000
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432
- Redis: localhost:6379

3. Документация API (Swagger): http://localhost:8000/docs

## API Endpoints

### Auth

- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/signup` - Регистрация
- `GET /api/auth/me` - Текущий пользователь
- `POST /api/auth/refresh` - Обновление токена

### Profile

- `GET /api/profile` - Получить профиль
- `PUT /api/profile` - Обновить профиль
- `GET /api/profile/notifications-settings` - Настройки уведомлений
- `PUT /api/profile/notifications-settings` - Обновить настройки
- `POST /api/profile/change-password` - Сменить пароль

### Courses

- `GET /api/student/courses` - Список курсов студента
- `GET /api/courses/{course_id}/overview` - Обзор курса

### Materials

- `GET /api/courses/{course_id}/materials` - Материалы курса
- `GET /api/materials/{material_id}` - Детали материала
- `POST /api/materials/{material_id}/progress` - Обновить прогресс

### Assignments

- `GET /api/courses/{course_id}/assignments` - Список заданий
- `GET /api/assignments/{assignment_id}` - Детали задания
- `GET /api/assignments/{assignment_id}/submissions` - История отправок
- `POST /api/assignments/{assignment_id}/submissions` - Отправить ДЗ

### Tests

- `GET /api/courses/{course_id}/tests` - Список тестов
- `GET /api/tests/{test_id}` - Детали теста
- `POST /api/tests/{test_id}/attempts` - Пройти тест

### Chat

- `GET /api/courses/{course_id}/chat/channels` - Каналы чата
- `GET /api/chat/channels/{channel_id}/messages` - Сообщения
- `POST /api/chat/channels/{channel_id}/messages` - Отправить сообщение

### Grades

- `GET /api/courses/{course_id}/grades` - Журнал успеваемости

### Calendar

- `GET /api/calendar?from=&to=` - События календаря

### Notifications

- `GET /api/notifications` - Список уведомлений
- `POST /api/notifications/{id}/read` - Пометить прочитанным

## Разработка

### Backend

```bash
cd back
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd front
npm install
npm run dev
```

## Технологии

- **Backend**: FastAPI, SQLAlchemy (async), PostgreSQL, Redis, structlog
- **Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Хранилище файлов**: Yandex Object Storage (S3-совместимое)

## Логирование

Приложение использует структурированное логирование через `structlog`. Логи выводятся в JSON формате для удобного парсинга.

## База данных

При первом запуске таблицы создаются автоматически через SQLAlchemy migrations.

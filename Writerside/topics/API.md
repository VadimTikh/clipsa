# API

✅ `POST /register` — Регистрация нового пользователя  
✅ `POST /login` — Авторизация, получение JWT-токена  
✅ `GET /tasks` — Получение списка задач (авторизованный пользователь)  
✅ `POST /tasks` — Создание задачи  
```http
# Пример запроса:

POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Закончить проект",
  "description": "Написать всю документацию",
  "due_date": "2025-04-10"
}

# Пример ответа:

{
  "title": "Закончить проект",
  "description": "Написать всю документацию",
  "due_date": "2025-04-10",
  "created": true,
  "id": 23463677
}

** Для каждого ендпоинта
```
✅ `PUT /tasks/{id}` — Обновление задачи  
✅ `DELETE /tasks/{id}` — Удаление задачи


# Kabanka-Backend

FORK proJWT проекта. Данный проект является еще и примером то как можно использовать
proJWT внутри своего проекта

**Кабанка** на стеке

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)

---

## ✨ Особенности

### Backend

- **Чистая архитектура**
- **Bun** + **Express** - для максимальной производительности
- Полноценная JWT-авторизация (Access + Refresh tokens)
- Защищённые роуты + Role-based доступ
- Валидация данных (express-validator)
- Drizzle ORM + PostgreSQL
- Централизованная обработка ошибок

---

## 🛠 Технологический стек

### Backend

| Технология            | Назначение                |
| --------------------- | ------------------------- |
| **Bun**               | Runtime + Package Manager |
| **Express**           | Web-фреймворк             |
| **Drizzle ORM**       | ORM + миграции            |
| **PostgreSQL**        | База данных               |
| **JWT**               | Авторизация               |
| **Nodemailer**        | Отправка писем            |
| **express-validator** | Валидация                 |

---

## Начало работы:

1. **Установка зависимостей**

   ```sh
   bun i
   ```

2. **Запуск БД в Docker**

   ```sh
   bun db:start
   ```

3. **Миграция схем на новосозданную БД**

   ```sh
   bun db:migrate
   ```

4. **Запуск сервера**

   ```sh
   bun dev
   ```

5. **(Опционально) Запуск студийки [database studio](https://orm.drizzle.team/drizzle-studio/overview)**

   ```bash
   bun db:studio
   ```

6. **Остановка БД**
   ```sh
   bun db:stop
   ```

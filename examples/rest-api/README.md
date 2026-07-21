# Luna REST API Example

A complete REST API built with Luna, featuring:

- **ConfigModule** — loads `.env` at startup
- **ValidationPipe** — validates request bodies with `class-validator`
- **Prisma + SQLite** — persistent database with ORM
- **Users and Posts** — full CRUD with relationships

## Setup

```bash
cd examples/rest-api
npm install

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev --name init

# Start the server
npm run dev
```

The API starts on `http://localhost:3000` (configurable via `PORT` in `.env`).

## Endpoints

### Users

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List all users |
| GET | `/users/:id` | Get a user by ID |
| POST | `/users` | Create a user |
| PATCH | `/users/:id` | Update a user |
| DELETE | `/users/:id` | Delete a user |

**POST /users body:**
```json
{ "name": "Alice", "email": "alice@example.com" }
```

### Posts

| Method | Path | Description |
|--------|------|-------------|
| GET | `/posts` | List all posts |
| GET | `/posts/:id` | Get a post by ID |
| POST | `/posts` | Create a post |
| DELETE | `/posts/:id` | Delete a post |

**POST /posts body:**
```json
{ "title": "Hello", "body": "Content here", "authorId": "<user-id>" }
```

## Validation errors

Invalid requests return `400 Bad Request`:

```json
{
  "statusCode": 400,
  "message": "name must be longer than or equal to 2 characters; email must be an email"
}
```

## Project structure

```
src/
├── main.ts                   # Bootstrap (loads .env, starts server)
├── app.module.ts             # Root module
└── modules/
    ├── database/             # PrismaClient provider (PRISMA token)
    ├── users/
    │   ├── dto/              # CreateUserDto, UpdateUserDto
    │   ├── users.controller.ts
    │   ├── users.service.ts
    │   └── users.module.ts
    └── posts/
        ├── dto/              # CreatePostDto
        ├── posts.controller.ts
        ├── posts.service.ts
        └── posts.module.ts
```

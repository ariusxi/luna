# Example — HTTP + WebSocket

A minimal Luna application that exposes a REST API over HTTP and a real-time chat over WebSocket, both running from the same codebase.

## What's covered

| Feature | Where |
|---|---|
| `@Controller` / `@On` | `users.controller.ts`, `chat.controller.ts` |
| `@Body`, `@Param`, `@Query`, `@Message` | `users.controller.ts`, `chat.controller.ts` |
| Guards (`@UseGuards`) | `users.controller.ts` — `AuthGuard` on POST/DELETE |
| Pipes — Zod validation | `users.controller.ts` — `ZodPipe(CreateUserSchema)` |
| Interceptors — global logging | `main.ts` — `LoggingInterceptor` via `useGlobalInterceptors` |
| Exception Filters | `domain-exception.filter.ts` — maps `NotFoundError` → 404 |
| Multi-adapter (HTTP + WS) | `main.ts` |
| Module system + DI | `UsersModule`, `ChatModule`, `AppModule` |

## Running

```bash
# from the repo root
yarn install
yarn build

cd examples/http-and-ws
yarn install
yarn start
```

> **Note**: This example uses `ts-node` (not `tsx`) because `tsx` is built on esbuild
> which does not emit `emitDecoratorMetadata`, breaking reflect-metadata-based DI.
> Always use `ts-node` (or compile with `tsc`) when running Luna applications locally.

## HTTP endpoints

```
GET    http://localhost:3000/users          → list all users
GET    http://localhost:3000/users?limit=1  → paginate
GET    http://localhost:3000/users/:id      → find one
POST   http://localhost:3000/users          → create (requires Authorization header)
DELETE http://localhost:3000/users/:id      → remove (requires Authorization header)
```

### Examples (curl)

```bash
# list users
curl http://localhost:3000/users

# find one
curl http://localhost:3000/users/1

# create (with auth)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{"name": "Carol", "email": "carol@example.com"}'

# missing auth → 403
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Carol", "email": "carol@example.com"}'

# invalid body → 400
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"name": "x"}'

# not found → 404
curl http://localhost:3000/users/999
```

## WebSocket events

Connect to `ws://localhost:3001` and send JSON messages:

```json
{ "event": "chat.send",    "data": { "user": "Alice", "text": "Hello!" } }
{ "event": "chat.history", "data": {} }
```

### Example (Node.js)

```js
import WebSocket from 'ws'

const ws = new WebSocket('ws://localhost:3001')

ws.on('open', () => {
  ws.send(JSON.stringify({ event: 'chat.send', data: { user: 'Alice', text: 'Hello!' } }))
  ws.send(JSON.stringify({ event: 'chat.history', data: {} }))
})

ws.on('message', (data) => console.log(JSON.parse(data.toString())))
```

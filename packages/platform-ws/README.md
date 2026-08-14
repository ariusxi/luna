<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="120" alt="Luna Logo" />
</p>

<h1 align="center">@lunafw/platform-ws</h1>

<p align="center">
  WebSocket adapter for the Luna framework, built on the <a href="https://github.com/websockets/ws"><code>ws</code></a> library.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/platform-ws" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/platform-ws?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/platform-ws" alt="License" /></a>
</p>

## Installation

```bash
npm install @lunafw/core @lunafw/common @lunafw/platform-ws
```

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## Quick start

```ts
// main.ts
import { LunaFactory } from '@lunafw/common'
import { WsAdapter } from '@lunafw/platform-ws'
import { AppModule } from './app.module'

const bootstrap = async () => {
  const adapter = new WsAdapter({ port: 3001 })
  const app = await LunaFactory.createApplication(AppModule, adapter)
  await app.start()
  console.log(`WebSocket server on :${adapter.getPort()}`)
}
bootstrap()
```

---

## Message format

Clients send JSON with an `event` field and an optional `data` field:

```json
{ "event": "chat.send", "data": { "text": "Hello!" } }
```

The adapter routes the message to the handler registered for that event and sends the return value back as JSON.

## Server-originated events

Use `send` when an application keeps its own authorized subscription map and
needs to notify one connection. Use `broadcast` for events intended for every
connected client. Both methods send an `{ event, data }` envelope and return
delivery information without throwing when a socket has already disconnected.

```ts
adapter.send(socketId, {
  event: 'mind-map.changed',
  data: { room: 'study-room', version: 12 },
})

const delivered = adapter.broadcast(
  { event: 'system.notice', data: { message: 'Maintenance soon' } },
  { excludeSocketId: senderSocketId },
)
```

---

## Routing

The route key for WebSocket is built as `<prefix>.<event>` (dot-separated):

| `@Controller` | `@On` | Listens for event |
|---|---|---|
| `'chat'` | `'send', '/'` | `chat.send` |
| `'chat'` | `'join', '/'` | `chat.join` |
| `''` | `'ping', '/'` | `ping` |

```ts
import { Injectable } from '@lunafw/core'
import { Body, Controller, On } from '@lunafw/common'

@Injectable()
@Controller('chat')
export class ChatController {
  // Handles event "chat.send"
  @On('send', '/')
  handleSend(@Body() payload: { text: string }) {
    return { echo: payload.text, timestamp: Date.now() }
  }

  // Handles event "chat.join"
  @On('join', '/')
  handleJoin(@Body() payload: { room: string }) {
    return { joined: payload.room }
  }
}
```

### Client side

```ts
import WebSocket from 'ws'

const ws = new WebSocket('ws://localhost:3001')

ws.on('open', () => {
  ws.send(JSON.stringify({ event: 'chat.send', data: { text: 'Hello Luna!' } }))
})

ws.on('message', (raw) => {
  const response = JSON.parse(raw.toString())
  console.log(response) // { echo: 'Hello Luna!', timestamp: 1234567890 }
})
```

---

## LunaMessage for WebSocket

```ts
{
  context: 'ws',
  payload: data,              // the `data` field from the incoming JSON
  metadata: {
    event: 'chat.send',      // full event string (prefix + dot + event)
    socketId: 'abc123',      // unique ID assigned per connection
  }
}
```

Access metadata directly if needed:

```ts
import { Message } from '@lunafw/common'

@On('join', '/')
handleJoin(@Body() payload: { room: string }, @Message() message: LunaMessage) {
  const socketId = message.metadata.socketId as string
  console.log(`Socket ${socketId} joined ${payload.room}`)
  return { ok: true }
}
```

---

## HTTP + WebSocket together

Run both transports simultaneously from the same module tree. A controller can handle both protocols by matching event/method values:

```ts
// main.ts
import { LunaFactory } from '@lunafw/common'
import { ExpressAdapter } from '@lunafw/platform-express'
import { WsAdapter } from '@lunafw/platform-ws'
import { AppModule } from './app.module'

const bootstrap = async () => {
  const app = await LunaFactory.createApplication(AppModule, [
    new ExpressAdapter({ port: 3000 }),
    new WsAdapter({ port: 3001 }),
  ])
  await app.start()
  console.log('HTTP  → http://localhost:3000')
  console.log('WS    → ws://localhost:3001')
}
bootstrap()
```

```ts
// chat.controller.ts — handles both HTTP and WebSocket
@Injectable()
@Controller('chat')
export class ChatController {
  @On('post', '/')      // HTTP POST /chat/
  @On('send', '/')      // WS event  "chat.send"
  send(@Body() payload: { text: string }) {
    return { echo: payload.text }
  }
}
```

> **Note:** A single method can only carry one `@On` decorator — use two methods if you need different logic per protocol, or a shared service to keep the handler thin.

---

## Guards, Pipes, Interceptors, Filters

All middleware from `@lunafw/common` works identically over WebSocket. The same `@UseGuards`, `@UsePipes`, `@UseInterceptors`, and `@UseFilters` decorators apply.

```ts
import { Injectable } from '@lunafw/core'
import { LunaGuard, LunaMessage, UseGuards } from '@lunafw/common'

@Injectable()
export class WsAuthGuard implements LunaGuard {
  canActivate(message: LunaMessage): boolean {
    const meta = message.metadata as { event?: string; socketId?: string }
    // custom auth logic for WebSocket connections
    return !!meta.socketId
  }
}

@UseGuards(WsAuthGuard)
@Controller('chat')
export class ChatController { ... }
```

---

## API

### `new WsAdapter(options)`

| Option | Type | Description |
|---|---|---|
| `port` | `number` | Port to listen on. Pass `0` to let the OS assign a free port. |

### `adapter.getPort(): number`

Returns the TCP port the server is bound to.

---

## License

[MIT](../../LICENSE)

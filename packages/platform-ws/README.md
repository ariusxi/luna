<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="120" alt="Luna Logo" />
</p>

<h1 align="center">@lunafw/platform-ws</h1>

<p align="center">
  WebSocket adapter for the Luna framework — protocol-agnostic real-time routing over the <code>ws</code> library.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/platform-ws" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/platform-ws?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/platform-ws" alt="License" /></a>
</p>

## Installation

```bash
npm install @lunafw/core @lunafw/common @lunafw/platform-ws
```

## Usage

```ts
import { LunaFactory } from '@lunafw/common'
import { WsAdapter } from '@lunafw/platform-ws'

import { AppModule } from './app.module'

const bootstrap = async (): Promise<void> => {
  const app = await LunaFactory.createApplication(
    AppModule,
    new WsAdapter({ port: 3001 }),
  )
  await app.start()
}
bootstrap()
```

### Multi-adapter (HTTP + WebSocket)

```ts
import { LunaFactory } from '@lunafw/common'
import { ExpressAdapter } from '@lunafw/platform-express'
import { WsAdapter } from '@lunafw/platform-ws'

const app = await LunaFactory.createApplication(AppModule, [
  new ExpressAdapter({ port: 3000 }),
  new WsAdapter({ port: 3001 }),
])
await app.start()
```

## Message format

Clients send JSON messages with an `event` field and an optional `data` field:

```json
{ "event": "chat.send", "data": { "text": "Hello!" } }
```

The adapter routes the message to the handler registered for that event and sends the handler's return value back as JSON.

## Controllers

Use the same `@Controller` and `@On` decorators. The route key is built as `<prefix>.<event>` (or just `<event>` when prefix is empty).

```ts
import { Injectable } from '@lunafw/core'
import { Controller, LunaMessage, On } from '@lunafw/common'

@Injectable()
@Controller('chat')
export class ChatController {
  // listens for event "chat.send"
  @On('send', '/')
  handleMessage(message: LunaMessage) {
    const { text } = message.payload as { text: string }
    return { echo: text }
  }
}
```

Client side:

```ts
import WebSocket from 'ws'

const ws = new WebSocket('ws://localhost:3001')
ws.send(JSON.stringify({ event: 'chat.send', data: { text: 'Hello!' } }))
ws.on('message', (data) => console.log(JSON.parse(data.toString())))
// → { echo: 'Hello!' }
```

## LunaMessage for WebSocket

```ts
{
  context: 'ws',
  payload: data,             // the `data` field from the incoming JSON
  metadata: {
    event: 'chat.send',     // full event string
    socketId: '<string>',   // unique ID per connection
  }
}
```

## Guards, Pipes, Interceptors, Filters

All middleware from `@lunafw/common` works identically over WebSocket — the same `@UseGuards`, `@UsePipes`, `@UseInterceptors`, `@UseFilters` decorators apply.

## API

### `new WsAdapter(options)`

| Option   | Type       | Description                                                    |
| -------- | ---------- | -------------------------------------------------------------- |
| `port` | `number` | Port to listen on. Pass`0` to let the OS assign a free port. |

### `adapter.getPort(): number`

Returns the TCP port the server is bound to. Useful when `port: 0` was passed.

## License

[MIT](../../LICENSE)

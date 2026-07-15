<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="120" alt="Luna Logo" />
</p>

<h1 align="center">@lunafw/common</h1>

<p align="center">
  Protocol-agnostic abstractions and factory for the Luna framework.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/common" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/common?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/common" alt="License" /></a>
</p>

## Installation

```bash
npm install @lunafw/core @lunafw/common reflect-metadata
```

## LunaFactory

```ts
import { LunaFactory } from '@lunafw/common'
import { ExpressAdapter } from '@lunafw/platform-express'

import { AppModule } from './app.module'

const bootstrap = async (): Promise<void> => {
  const app = await LunaFactory.createApplication(
    AppModule,
    new ExpressAdapter({ port: 3000 })
  )
  
	await app.start()
}
bootstrap()
```

Multiple adapters:

```ts
const app = await LunaFactory.createApplication(AppModule, [
  new ExpressAdapter({ port: 3000 }),
  new WebSocketAdapter({ port: 3001 }),
])
```

## Decorators

### @Controller

```ts
import { Controller } from '@lunafw/common'

@Controller('users')
export class UserController {}
```

### @On

```ts
import { On } from '@lunafw/common'

@On('get', '/')
@On('post', '/:id')
@On('message')   // WebSocket
@On('FindUser')  // gRPC
```

## LunaMessage

Every handler receives a `LunaMessage` regardless of protocol:

```ts
import { LunaMessage } from '@lunafw/common'

handle(message: LunaMessage) {
  message.context   // 'http' | 'ws' | 'grpc' | ...
  message.payload   // request body / event data
  message.metadata  // headers, params, query, etc.
}
```

## License

[MIT](../../LICENSE)

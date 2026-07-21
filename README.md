<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="160" alt="Luna Logo" />
</p>

<h1 align="center">Luna Framework</h1>

<p align="center">
  A modular, protocol-agnostic backend framework for Node.js.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/core" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/core?label=%40lunafw%2Fcore&color=7c3aed" alt="@lunafw/core" /></a>
  <a href="https://www.npmjs.com/package/@lunafw/common" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/common?label=%40lunafw%2Fcommon&color=7c3aed" alt="@lunafw/common" /></a>
  <a href="https://www.npmjs.com/package/@lunafw/platform-express" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/platform-express?label=%40lunafw%2Fplatform-express&color=7c3aed" alt="@lunafw/platform-express" /></a>
  <a href="https://www.npmjs.com/package/@lunafw/platform-ws" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/platform-ws?label=%40lunafw%2Fplatform-ws&color=7c3aed" alt="@lunafw/platform-ws" /></a>
  <a href="https://www.npmjs.com/package/@lunafw/platform-grpc" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/platform-grpc?label=%40lunafw%2Fplatform-grpc&color=7c3aed" alt="@lunafw/platform-grpc" /></a>
  <a href="https://www.npmjs.com/package/@lunafw/config" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/config?label=%40lunafw%2Fconfig&color=7c3aed" alt="@lunafw/config" /></a>
  <a href="https://www.npmjs.com/package/@lunafw/testing" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/testing?label=%40lunafw%2Ftesting&color=7c3aed" alt="@lunafw/testing" /></a>
  <a href="https://github.com/ariusxi/luna/actions" target="_blank"><img src="https://img.shields.io/github/actions/workflow/status/ariusxi/luna/ci.yml?branch=main&label=CI" alt="CI" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/core" alt="License" /></a>
</p>

---

## What is Luna?

Luna is a **protocol-first** backend framework for Node.js written in TypeScript. Most frameworks are designed around HTTP — Luna abstracts the transport entirely. Every incoming message, whether it arrives via HTTP, WebSocket, or gRPC, is normalized into a single `LunaMessage` and handled by the same pipeline.

You write your business logic once. The adapter decides how the world reaches it.

## Core concepts

### LunaMessage

Every handler receives a `LunaMessage` regardless of the protocol:

```ts
interface LunaMessage {
  context: string          // 'http' | 'ws' | 'grpc'
  payload: unknown         // request body / event data / RPC input
  metadata: {
    params?:  Record<string, string>   // URL params (HTTP)
    query?:   Record<string, unknown>  // query string (HTTP)
    headers?: Record<string, unknown>  // request headers (HTTP)
    event?:   string                   // event name (WebSocket)
    socketId?: string                  // connection ID (WebSocket)
    grpcMetadata?: Record<string, unknown> // gRPC metadata
  }
}
```

### Request lifecycle

Every request goes through the same pipeline, regardless of which adapter received it:

```
Incoming request (HTTP / WebSocket / gRPC)
         │
         ▼
   ┌─────────────┐
   │   Adapter   │  translates protocol → LunaMessage
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │   Guards    │  canActivate() → block or pass
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │    Pipes    │  transform / validate the message
   └──────┬──────┘
          │
          ▼
   ┌──────────────────┐
   │  Interceptors    │  wrap execution (before + after)
   │  ┌────────────┐  │
   │  │  Handler   │  │  your controller method
   │  └────────────┘  │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Exception Filter │  catches any error from any stage
   └──────┬───────────┘
          │
          ▼
      Response
```

Middleware stacks at **global → controller → method** level for every stage. First matching exception filter wins.

### Module system

Luna uses a module-based dependency injection system. Each module declares its providers, imports, and exports:

```
AppModule
  ├── imports: [UsersModule, DatabaseModule]
  │
  ├── UsersModule
  │     providers: [UsersService, UsersController]
  │     exports:   [UsersService]           ← visible to importers
  │
  └── DatabaseModule
        providers: [{ provide: 'DB', useFactory: ... }]
        exports:   ['DB']
```

Providers stay private to their module unless exported. A controller in `UsersModule` can inject `UsersService` directly — no import needed within the same module.

## Quick start

### 1. Install

```bash
npm install @lunafw/core @lunafw/common @lunafw/platform-express
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

### 2. Create a service and controller

```ts
// users.service.ts
import { Injectable } from '@lunafw/core'

@Injectable()
export class UsersService {
  private users = [{ id: '1', name: 'Alice' }]

  findAll() { return this.users }

  findOne(id: string) {
    return this.users.find(u => u.id === id)
  }

  create(data: { name: string }) {
    const user = { id: String(this.users.length + 1), ...data }
    this.users.push(user)
    return user
  }
}
```

```ts
// users.controller.ts
import { Injectable } from '@lunafw/core'
import { Body, Controller, NotFoundException, On, Param } from '@lunafw/common'
import { UsersService } from './users.service'

@Injectable()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @On('get', '/')
  findAll() {
    return this.usersService.findAll()
  }

  @On('get', '/:id')
  findOne(@Param('id') id: string) {
    const user = this.usersService.findOne(id)
    if (!user) throw new NotFoundException(`User ${id} not found`)
    return user
  }

  @On('post', '/')
  create(@Body() dto: { name: string }) {
    return this.usersService.create(dto)
  }
}
```

### 3. Declare a module

```ts
// users.module.ts
import { Module } from '@lunafw/core'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'

@Module({
  providers: [UsersService, UsersController],
  exports: [UsersService],
})
export class UsersModule {}
```

```ts
// app.module.ts
import { Module } from '@lunafw/core'
import { UsersModule } from './users/users.module'

@Module({ imports: [UsersModule] })
export class AppModule {}
```

### 4. Bootstrap

```ts
// main.ts
import { LunaFactory } from '@lunafw/common'
import { ExpressAdapter } from '@lunafw/platform-express'
import { AppModule } from './app.module'

const bootstrap = async () => {
  const adapter = new ExpressAdapter({ port: 3000 })
  const app = await LunaFactory.createApplication(AppModule, adapter)
  await app.start()
  console.log(`Listening on :${adapter.getPort()}`)
}
bootstrap()
```

```
GET  http://localhost:3000/users        → [{ id: '1', name: 'Alice' }]
GET  http://localhost:3000/users/1      → { id: '1', name: 'Alice' }
GET  http://localhost:3000/users/99     → 404 { statusCode: 404, message: 'User 99 not found' }
POST http://localhost:3000/users        → { id: '2', name: '...' }
```

## Packages

| Package | Description |
|---|---|
| [`@lunafw/core`](./packages/core) | DI container, module system, lifecycle hooks |
| [`@lunafw/common`](./packages/common) | `LunaFactory`, all decorators, middleware pipeline |
| [`@lunafw/platform-express`](./packages/platform-express) | HTTP adapter built on Express |
| [`@lunafw/platform-ws`](./packages/platform-ws) | WebSocket adapter built on `ws` |
| [`@lunafw/platform-grpc`](./packages/platform-grpc) | gRPC adapter built on `@grpc/grpc-js` |
| [`@lunafw/config`](./packages/config) | `.env`-based configuration module |
| [`@lunafw/testing`](./packages/testing) | In-memory testing utilities |

## Examples

| Example | Description |
|---|---|
| [`examples/http-and-ws`](./examples/http-and-ws) | HTTP + WebSocket on the same app with guards, interceptors, and filters |
| [`examples/rest-api`](./examples/rest-api) | Full REST API with Prisma, ConfigModule, and ValidationPipe |

## Issues

Please read the [contribution guidelines](https://github.com/ariusxi/luna/blob/main/CONTRIBUTING.md) before opening an issue. The tracker is for bug reports and feature requests only.

## License

[MIT](./LICENSE)

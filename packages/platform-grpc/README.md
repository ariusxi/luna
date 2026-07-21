<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="120" alt="Luna Logo" />
</p>

<h1 align="center">@lunafw/platform-grpc</h1>

<p align="center">
  gRPC adapter for the Luna framework — proto-first, unary RPCs over <a href="https://github.com/grpc/grpc-node/tree/master/packages/grpc-js"><code>@grpc/grpc-js</code></a>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/platform-grpc" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/platform-grpc?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/platform-grpc" alt="License" /></a>
</p>

## Installation

```bash
npm install @lunafw/core @lunafw/common @lunafw/platform-grpc
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

### 1. Define a `.proto` file

```proto
// users.proto
syntax = "proto3";

package users;

service UserService {
  rpc GetUser    (GetUserRequest)    returns (GetUserResponse);
  rpc CreateUser (CreateUserRequest) returns (CreateUserResponse);
}

message GetUserRequest  { string id = 1; }
message GetUserResponse { string id = 1; string name = 2; string email = 3; }

message CreateUserRequest  { string name = 1; string email = 2; }
message CreateUserResponse { string id = 1;   string name = 2; string email = 3; }
```

### 2. Bootstrap the adapter

```ts
// main.ts
import * as path from 'path'
import { LunaFactory } from '@lunafw/common'
import { GrpcAdapter } from '@lunafw/platform-grpc'
import { AppModule } from './app.module'

const bootstrap = async () => {
  const adapter = new GrpcAdapter({
    port: 50051,
    protoPath: path.join(__dirname, 'users.proto'),
    packageName: 'users',
  })

  const app = await LunaFactory.createApplication(AppModule, adapter)
  await app.start()
  console.log('gRPC server listening on :50051')
}
bootstrap()
```

### 3. Write a controller

Use `@Controller` with the **service name** from the proto and `@On` with the **RPC method name** (no path needed):

```ts
// users.controller.ts
import { Injectable } from '@lunafw/core'
import { Controller, On, Body } from '@lunafw/common'
import { UsersService } from './users.service'

@Injectable()
@Controller('UserService')    // matches service name in .proto
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @On('GetUser')    // matches rpc GetUser in .proto
  getUser(@Body() req: { id: string }) {
    return this.usersService.findOne(req.id)
  }

  @On('CreateUser')   // matches rpc CreateUser in .proto
  createUser(@Body() req: { name: string; email: string }) {
    return this.usersService.create(req.name, req.email)
  }
}
```

---

## Routing

| `.proto` element | Luna mapping |
|---|---|
| `package users` | `packageName: 'users'` in `GrpcAdapter` options |
| `service UserService` | `@Controller('UserService')` |
| `rpc GetUser` | `@On('GetUser')` |

---

## LunaMessage for gRPC

```ts
{
  context: 'grpc',
  payload: { id: '42' },            // deserialized protobuf request object
  metadata: {
    grpcMetadata: {                 // gRPC metadata headers
      'x-request-id': ['abc-123'],
    }
  }
}
```

Access raw gRPC metadata if needed:

```ts
import { Message } from '@lunafw/common'

@On('GetUser')
getUser(@Body() req: { id: string }, @Message() message: LunaMessage) {
  const meta = message.metadata.grpcMetadata as Record<string, string[]>
  const requestId = meta['x-request-id']?.[0]
  return this.usersService.findOne(req.id)
}
```

---

## HTTP + gRPC together

Run both transports from the same module tree. Business logic in the service layer is shared; only the adapter differs:

```ts
// main.ts
import * as path from 'path'
import { LunaFactory } from '@lunafw/common'
import { ExpressAdapter } from '@lunafw/platform-express'
import { GrpcAdapter } from '@lunafw/platform-grpc'
import { AppModule } from './app.module'

const bootstrap = async () => {
  const app = await LunaFactory.createApplication(AppModule, [
    new ExpressAdapter({ port: 3000 }),
    new GrpcAdapter({
      port: 50051,
      protoPath: path.join(__dirname, 'users.proto'),
      packageName: 'users',
    }),
  ])
  await app.start()
  console.log('HTTP  → http://localhost:3000')
  console.log('gRPC  → localhost:50051')
}
bootstrap()
```

---

## Guards, Pipes, Interceptors, Filters

All middleware from `@lunafw/common` works over gRPC. Errors thrown from handlers are returned as gRPC `INTERNAL` status with the error message.

```ts
import { Injectable } from '@lunafw/core'
import { LunaGuard, LunaMessage, UseGuards } from '@lunafw/common'

@Injectable()
export class GrpcTokenGuard implements LunaGuard {
  canActivate(message: LunaMessage): boolean {
    const meta = message.metadata.grpcMetadata as Record<string, string[]>
    return !!meta?.['authorization']?.[0]
  }
}

@UseGuards(GrpcTokenGuard)
@Controller('UserService')
export class UsersController { ... }
```

---

## API

### `new GrpcAdapter(options)`

| Option | Type | Description |
|---|---|---|
| `port` | `number` | Port to listen on. Pass `0` for an OS-assigned port. |
| `protoPath` | `string \| string[]` | Absolute path(s) to `.proto` files. |
| `packageName` | `string` | The `package` name declared in the `.proto` file. |

### `adapter.getPort(): number`

Returns the TCP port the server is bound to.

---

## Limitations

- Only **unary** RPCs are supported. Client-streaming, server-streaming, and bidirectional-streaming are not yet handled.
- The adapter uses **insecure credentials** by default. TLS support is planned.

---

## License

[MIT](../../LICENSE)

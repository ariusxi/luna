<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="120" alt="Luna Logo" />
</p>

<h1 align="center">@lunafw/platform-grpc</h1>

<p align="center">
  gRPC adapter for the Luna framework — proto-first unary RPC routing over <code>@grpc/grpc-js</code>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/platform-grpc" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/platform-grpc?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/platform-grpc" alt="License" /></a>
</p>

## Installation

```bash
npm install @lunafw/core @lunafw/common @lunafw/platform-grpc
```

## Usage

### 1. Define your `.proto` file

```proto
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
import 'reflect-metadata'
import * as path from 'path'
import { LunaFactory } from '@lunafw/common'
import { GrpcAdapter } from '@lunafw/platform-grpc'
import { AppModule } from './app.module'

const bootstrap = async (): Promise<void> => {
  const app = await LunaFactory.createApplication(AppModule, new GrpcAdapter({
    port: 50051,
    protoPath: path.join(__dirname, 'users.proto'),
    packageName: 'users',
  }))
  await app.start()
  console.log('gRPC server listening on :50051')
}
bootstrap()
```

### 3. Write a controller

Use `@Controller` with the **service name** from the proto and `@On` with the **RPC method name**.

```ts
import { Injectable } from '@lunafw/core'
import { Controller, LunaMessage, On } from '@lunafw/common'

@Injectable()
@Controller('UserService')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @On('GetUser')
  getUser(message: LunaMessage) {
    const { id } = message.payload as { id: string }
    return this.userService.findOne(id)
  }

  @On('CreateUser')
  createUser(message: LunaMessage) {
    const { name, email } = message.payload as { name: string; email: string }
    return this.userService.create(name, email)
  }
}
```

## LunaMessage for gRPC

```ts
{
  context: 'grpc',
  payload: request,           // the deserialized protobuf request object
  metadata: {
    grpcMetadata: Record<string, MetadataValue>,  // gRPC metadata headers
  }
}
```

## Multi-adapter (HTTP + gRPC)

```ts
import { LunaFactory } from '@lunafw/common'
import { ExpressAdapter } from '@lunafw/platform-express'
import { GrpcAdapter } from '@lunafw/platform-grpc'

const app = await LunaFactory.createApplication(AppModule, [
  new ExpressAdapter({ port: 3000 }),
  new GrpcAdapter({ port: 50051, protoPath: '...', packageName: 'users' }),
])
await app.start()
```

## Guards, Pipes, Interceptors, Filters

All middleware from `@lunafw/common` works identically over gRPC. Errors thrown from handlers are caught and returned as a gRPC `INTERNAL` status code with the error message.

## Limitations

- Only **unary** RPCs are supported. Client-streaming, server-streaming, and bidirectional-streaming are not handled.
- The adapter uses **insecure credentials** by default. TLS support is planned.

## API

### `new GrpcAdapter(options)`

| Option          | Type                  | Description                                                             |
| --------------- | --------------------- | ----------------------------------------------------------------------- |
| `port`        | `number`            | Port to listen on. Pass`0` to let the OS assign a free port.          |
| `protoPath`   | `string \| string[]` | Absolute path(s) to`.proto` files.                                    |
| `packageName` | `string`            | Name of the protobuf package (`package` statement in the `.proto`). |

### `adapter.getPort(): number`

Returns the TCP port the server is bound to. Useful when `port: 0` was passed.

## License

[MIT](../../LICENSE)

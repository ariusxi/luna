<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="120" alt="Luna Logo" />
</p>

<h1 align="center">@lunafw/platform-express</h1>

<p align="center">
  Express adapter for the Luna framework.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/platform-express" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/platform-express?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/platform-express" alt="License" /></a>
</p>

## Installation

```bash
npm install @lunafw/core @lunafw/common @lunafw/platform-express reflect-metadata express
```

## Usage

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

## Controllers

```ts
import { Injectable } from '@lunafw/core'
import { Controller, LunaMessage, On } from '@lunafw/common'
import { NotFoundException } from '@lunafw/platform-express'

@Injectable()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @On('get', '/')
  findAll(_message: LunaMessage) {
    return this.userService.findAll()
  }

  @On('get', '/:id')
  findOne(message: LunaMessage) {
    const { id } = message.metadata.params as { id: string }
    const user = this.userService.findOne(id)
    if (!user) throw new NotFoundException(`User ${id} not found`)
    return user
  }

  @On('post', '/')
  create(message: LunaMessage) {
    return this.userService.create(message.payload)
  }
}
```

## Parameter decorators

Instead of accessing `message.metadata` manually, inject values directly into handler parameters:

```ts
import { Body, Headers, On, Param, Query } from '@lunafw/common'

@Injectable()
@Controller('users')
export class UserController {
  @On('get', '/:id')
  findOne(
    @Param('id') id: string,
    @Query('expand') expand?: string,
    @Headers('authorization') token?: string,
  ) {
    return this.userService.findOne(id)
  }

  @On('post', '/')
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto)
  }
}
```

When no parameter decorators are used the full `LunaMessage` is passed as the first argument (backward-compatible).

## HTTP Exceptions

Throw any exception subclass from a handler and the adapter maps it to the correct HTTP status automatically.

```ts
import {
  BadRequestException,          // 400
  UnauthorizedException,        // 401
  ForbiddenException,           // 403
  NotFoundException,            // 404
  MethodNotAllowedException,    // 405
  RequestTimeoutException,      // 408
  ConflictException,            // 409
  GoneException,                // 410
  UnprocessableEntityException, // 422
  TooManyRequestsException,     // 429
  InternalServerErrorException, // 500
  NotImplementedException,      // 501
  ServiceUnavailableException,  // 503
} from '@lunafw/platform-express'

throw new NotFoundException('User not found')
// → 404 { statusCode: 404, message: 'User not found' }
```

All exceptions accept an optional custom message:

```ts
throw new ConflictException('Email already in use')
// → 409 { statusCode: 409, message: 'Email already in use' }
```

### Custom Exceptions

```ts
import { HttpException } from '@lunafw/platform-express'

export class PaymentRequiredException extends HttpException {
  constructor(message = 'Payment Required') {
    super(402, message)
  }
}
```

## API

### `new ExpressAdapter(options)`

| Option | Type | Description |
|--------|------|-------------|
| `port` | `number` | Port to listen on. Pass `0` to let the OS assign a free port. |

### `adapter.getPort(): number`

Returns the TCP port the server is currently bound to. Useful when `port: 0` was passed.

```ts
const adapter = new ExpressAdapter({ port: 0 })
await app.start()
console.log(adapter.getPort()) // e.g. 54321
```

## License

[MIT](../../LICENSE)

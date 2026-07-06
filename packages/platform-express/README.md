<p align="center">
  <img src="../../.github/assets/logo.png" width="120" alt="Luna Logo" />
</p>

<h1 align="center">@lunafw/platform-express</h1>

<p align="center">
  Express adapter for the Luna framework.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/platform-express" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/platform-express?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/common" alt="License" /></a>
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

## HTTP Exceptions

```ts
import {
  BadRequestException,          // 400
  UnauthorizedException,        // 401
  ForbiddenException,           // 403
  NotFoundException,            // 404
  ConflictException,            // 409
  UnprocessableEntityException, // 422
  TooManyRequestsException,     // 429
  InternalServerErrorException, // 500
  ServiceUnavailableException,  // 503
} from '@lunafw/platform-express'

throw new NotFoundException('User not found')
// → 404 { statusCode: 404, message: 'User not found' }
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

## License

[MIT](../../LICENSE)

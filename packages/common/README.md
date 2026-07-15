<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="120" alt="Luna Logo" />
</p>

<h1 align="center">@lunafw/common</h1>

<p align="center">
  Protocol-agnostic abstractions, decorators and middleware pipeline for the Luna framework.
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
    new ExpressAdapter({ port: 3000 }),
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

Marks a class as a controller and sets its route prefix.

```ts
import { Controller } from '@lunafw/common'

@Controller('users')
export class UserController {}
```

### @On

Binds a method to a protocol event and optional path.

```ts
import { On } from '@lunafw/common'

@On('get', '/')         // HTTP GET /users/
@On('post', '/:id')     // HTTP POST /users/:id
@On('message')          // WebSocket event
@On('FindUser')         // gRPC procedure
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

## Guards

Guards run before the handler and decide whether the request should proceed. Return `false` (or throw) to reject.

```ts
import { Injectable } from '@lunafw/core'
import { LunaGuard, LunaMessage, UseGuards } from '@lunafw/common'

@Injectable()
export class AuthGuard implements LunaGuard {
  canActivate(message: LunaMessage): boolean {
    const headers = message.metadata.headers as Record<string, string>
    return !!headers['authorization']
  }
}

@UseGuards(AuthGuard)
@Controller('users')
export class UserController {
  // class resolved via DI
  @UseGuards(RolesGuard)
  @On('delete', '/:id')
  remove(message: LunaMessage) { ... }
}
```

Guards also accept pre-built **instances**, which is useful when the guard needs configuration:

```ts
export class RolesGuard implements LunaGuard {
  constructor(private readonly role: string) {}
  canActivate(message: LunaMessage): boolean {
    const headers = message.metadata.headers as Record<string, string>
    return headers['x-role'] === this.role
  }
}

@UseGuards(new RolesGuard('admin'))
@On('delete', '/:id')
remove(message: LunaMessage) { ... }
```

Execution order: **controller guards → method guards**.

## Pipes

Pipes transform or validate the `LunaMessage` before it reaches the handler. They run after guards.

```ts
import { Injectable } from '@lunafw/core'
import { LunaMessage, LunaPipe, UsePipes } from '@lunafw/common'

@Injectable()
export class ValidationPipe implements LunaPipe {
  transform(message: LunaMessage): LunaMessage {
    if (!message.payload) throw new BadRequestException('Payload required')
    return message
  }
}

@UsePipes(ValidationPipe)
@Controller('items')
export class ItemController {
  @UsePipes(ParseIntPipe)
  @On('get', '/:id')
  findOne(message: LunaMessage) { ... }
}
```

Execution order: **controller pipes → method pipes**.

### Zod validation

```ts
import { z, ZodSchema } from 'zod'
import { LunaMessage, LunaPipe, UsePipes } from '@lunafw/common'
import { BadRequestException } from '@lunafw/platform-express'

class ZodPipe<T> implements LunaPipe {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(message: LunaMessage): LunaMessage {
    const result = this.schema.safeParse(message.payload)
    if (!result.success) {
      throw new BadRequestException(result.error.issues[0]?.message ?? 'Validation failed')
    }
    return { ...message, payload: result.data }
  }
}

const CreatePostSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(1),
})

@Controller('posts')
export class PostController {
  // instance passed directly — schema available at decoration time
  @UsePipes(new ZodPipe(CreatePostSchema))
  @On('post', '/')
  create(message: LunaMessage) {
    return message.payload  // already validated and typed
  }
}
```

### class-validator / class-transformer validation

```ts
import { plainToInstance } from 'class-transformer'
import { IsString, MinLength, validateOrReject } from 'class-validator'
import { LunaMessage, LunaPipe, UsePipes } from '@lunafw/common'
import { BadRequestException } from '@lunafw/platform-express'

class ClassValidatorPipe<T extends object> implements LunaPipe {
  constructor(private readonly cls: new () => T) {}

  async transform(message: LunaMessage): Promise<LunaMessage> {
    const instance = plainToInstance(this.cls, message.payload)
    try {
      await validateOrReject(instance)
    } catch (errors) {
      const first = (errors as { constraints?: Record<string, string> }[])[0]
      const msg = Object.values(first?.constraints ?? {})[0] ?? 'Validation failed'
      throw new BadRequestException(msg)
    }
    return { ...message, payload: instance }
  }
}

class CreateUserDto {
  @IsString()
  @MinLength(3)
  name!: string
}

@Controller('users')
export class UserController {
  @UsePipes(new ClassValidatorPipe(CreateUserDto))
  @On('post', '/')
  create(message: LunaMessage) {
    return message.payload
  }
}
```

## Interceptors

Interceptors wrap handler execution. They run after pipes and can act both before and after the handler via a `next()` call.

```ts
import { Injectable } from '@lunafw/core'
import { LunaExecutionContext, LunaInterceptor, UseInterceptors } from '@lunafw/common'

@Injectable()
export class LoggingInterceptor implements LunaInterceptor {
  async intercept(context: LunaExecutionContext, next: () => Promise<unknown>) {
    const start = Date.now()
    const result = await next()
    console.log(`${context.getHandler()} — ${Date.now() - start}ms`)
    return result
  }
}

@UseInterceptors(LoggingInterceptor)
@Controller('posts')
export class PostController {
  @UseInterceptors(CacheInterceptor)
  @On('get', '/:id')
  findOne(message: LunaMessage) { ... }
}
```

Execution order: **controller interceptors → method interceptors → handler → method interceptors (return) → controller interceptors (return)**.

## Middleware pipeline

For every incoming request the pipeline runs in this order:

```
Guards → Pipes → Interceptors → Handler
```

## License

[MIT](../../LICENSE)

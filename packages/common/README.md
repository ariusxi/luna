<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="120" alt="Luna Logo" />
</p>

<h1 align="center">@lunafw/common</h1>

<p align="center">
  Protocol-agnostic decorators, middleware pipeline, and application factory for the Luna framework.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/common" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/common?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/common" alt="License" /></a>
</p>

## Installation

```bash
npm install @lunafw/core @lunafw/common
```

---

## LunaFactory

`LunaFactory.createApplication` bootstraps the DI container, registers all controllers with the given adapter(s), and returns the application object.

```ts
// main.ts
import { LunaFactory } from '@lunafw/common'
import { ExpressAdapter } from '@lunafw/platform-express'
import { AppModule } from './app.module'

const bootstrap = async () => {
  const adapter = new ExpressAdapter({ port: 3000 })
  const app = await LunaFactory.createApplication(AppModule, adapter)
  await app.start()
  console.log(`Server on :${adapter.getPort()}`)
}
bootstrap()
```

### Multiple adapters

Run HTTP, WebSocket, and gRPC simultaneously from the same module tree:

```ts
import { ExpressAdapter } from '@lunafw/platform-express'
import { WsAdapter }      from '@lunafw/platform-ws'
import { GrpcAdapter }    from '@lunafw/platform-grpc'

const app = await LunaFactory.createApplication(AppModule, [
  new ExpressAdapter({ port: 3000 }),
  new WsAdapter({ port: 3001 }),
  new GrpcAdapter({ port: 50051, protoPath: './users.proto', packageName: 'users' }),
])
await app.start()
```

Every `@On` handler that matches a registered adapter receives requests from that protocol — a single controller method can handle both HTTP and WebSocket simultaneously.

---

## LunaMessage

The universal message envelope. Every handler receives one, regardless of protocol:

```ts
interface LunaMessage {
  context:  string    // 'http' | 'ws' | 'grpc'
  payload:  unknown   // request body / event data / RPC input
  metadata: {
    // HTTP
    params?:  Record<string, string>
    query?:   Record<string, unknown>
    headers?: Record<string, unknown>
    // WebSocket
    event?:    string
    socketId?: string
    // gRPC
    grpcMetadata?: Record<string, unknown>
  }
}
```

---

## Controllers

### @Controller

Marks a class as a controller and sets the route prefix. Must also be decorated with `@Injectable()` so the DI container can instantiate it.

```ts
import { Injectable } from '@lunafw/core'
import { Controller } from '@lunafw/common'

@Injectable()
@Controller('users')    // routes live under /users (HTTP) or chat.* (WebSocket)
export class UsersController {}
```

### @On

Binds a method to a protocol event and an optional path. The adapter interprets both values according to its protocol:

| Adapter | `event` | `path` |
|---|---|---|
| HTTP (Express) | HTTP method (`'get'`, `'post'`, `'patch'`, `'delete'`) | URL path (`'/'`, `'/:id'`) |
| WebSocket | Event name suffix | Ignored (`'/'` by convention) |
| gRPC | RPC method name from the proto | Ignored |

```ts
import { On } from '@lunafw/common'

@On('get', '/')         // HTTP GET /users/
@On('post', '/')        // HTTP POST /users/
@On('get', '/:id')      // HTTP GET /users/:id
@On('patch', '/:id')    // HTTP PATCH /users/:id
@On('delete', '/:id')   // HTTP DELETE /users/:id

@On('send', '/')        // WebSocket → listens for event "chat.send"
@On('GetUser')          // gRPC → handles the GetUser RPC
```

---

## Parameter decorators

Extract specific values from the message directly into handler parameters instead of reading from `message.metadata` manually.

```ts
import { Body, Headers, Message, Param, Query } from '@lunafw/common'

@Injectable()
@Controller('users')
export class UsersController {
  // @Param — URL route parameter
  @On('get', '/:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id)
  }

  // @Body — full payload or a specific field
  @On('post', '/')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto)
  }

  // @Body with a key
  @On('patch', '/:id/name')
  rename(@Param('id') id: string, @Body('name') name: string) {
    return this.usersService.rename(id, name)
  }

  // @Query — URL query string parameter
  @On('get', '/')
  list(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.usersService.paginate(Number(page), Number(limit))
  }

  // @Headers — a specific header value
  @On('post', '/')
  createWithAuth(
    @Body() dto: CreateUserDto,
    @Headers('authorization') token: string,
  ) {
    this.authService.verify(token)
    return this.usersService.create(dto)
  }

  // @Message — the full LunaMessage
  @On('delete', '/:id')
  remove(@Param('id') id: string, @Message() message: LunaMessage) {
    console.log('protocol:', message.context)
    return this.usersService.remove(id)
  }
}
```

When **no** parameter decorators are used, the full `LunaMessage` is passed as the first argument (backward-compatible):

```ts
@On('get', '/:id')
findOne(message: LunaMessage) {
  const { id } = message.metadata.params as { id: string }
  return this.usersService.findOne(id)
}
```

---

## Middleware pipeline

For every incoming message the pipeline runs in this order:

```
Guards → Pipes → Interceptors → Handler
                                        ↑
                            Exception Filters wrap the whole chain
```

Each stage stacks at **global → controller → method** level.

---

## Guards

Guards run first and decide whether the request should reach the handler. Return `false` or throw to block; return `true` to pass.

```ts
import { Injectable } from '@lunafw/core'
import { LunaGuard, LunaMessage } from '@lunafw/common'

@Injectable()
export class AuthGuard implements LunaGuard {
  canActivate(message: LunaMessage): boolean {
    const headers = message.metadata.headers as Record<string, string>
    return !!headers['authorization']
  }
}
```

Apply at controller level (all methods) or method level:

```ts
import { UseGuards } from '@lunafw/common'

@UseGuards(AuthGuard)          // class resolved via DI
@Controller('users')
export class UsersController {
  @UseGuards(new RolesGuard('admin'))   // pre-built instance
  @On('delete', '/:id')
  remove(@Param('id') id: string) { ... }
}
```

Execution order: **controller guards first, then method guards**.

### Parameterized guards (via instance)

When a guard needs configuration, pass an instance directly instead of a class:

```ts
export class RolesGuard implements LunaGuard {
  constructor(private readonly role: string) {}

  canActivate(message: LunaMessage): boolean {
    const headers = message.metadata.headers as Record<string, string>
    return headers['x-role'] === this.role
  }
}

// Different roles on different routes:
@UseGuards(new RolesGuard('editor'))
@On('patch', '/:id')
update(@Param('id') id: string, @Body() dto: UpdatePostDto) { ... }

@UseGuards(new RolesGuard('admin'))
@On('delete', '/:id')
remove(@Param('id') id: string) { ... }
```

---

## Pipes

Pipes transform or validate the `LunaMessage` before it reaches the handler. They run after guards and receive the message output by the previous pipe in the chain.

```ts
import { Injectable } from '@lunafw/core'
import { LunaMessage, LunaPipe } from '@lunafw/common'

@Injectable()
export class TrimBodyPipe implements LunaPipe {
  transform(message: LunaMessage): LunaMessage {
    if (typeof message.payload === 'object' && message.payload) {
      const trimmed = Object.fromEntries(
        Object.entries(message.payload as Record<string, unknown>).map(
          ([k, v]) => [k, typeof v === 'string' ? v.trim() : v],
        ),
      )
      return { ...message, payload: trimmed }
    }
    return message
  }
}
```

```ts
import { UsePipes } from '@lunafw/common'

@UsePipes(TrimBodyPipe)           // applied to all methods in the controller
@Controller('users')
export class UsersController {
  @UsePipes(new ValidationPipe(CreateUserDto))  // applied to this method only
  @On('post', '/')
  create(@Body() dto: CreateUserDto) { ... }
}
```

Execution order: **controller pipes first, then method pipes**.

### Built-in ValidationPipe

Luna ships a `ValidationPipe` in `@lunafw/common` that integrates with `class-validator` and `class-transformer`:

```bash
npm install class-validator class-transformer
```

```ts
import { IsEmail, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string

  @IsEmail()
  email: string
}
```

```ts
import { ValidationPipe } from '@lunafw/common'

@On('post', '/')
@UsePipes(new ValidationPipe(CreateUserDto))
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto)
}
```

Invalid requests automatically return `400 Bad Request` with descriptive field errors.

### Zod validation

You can also implement a pipe with Zod:

```ts
import { z, ZodSchema } from 'zod'
import { BadRequestException, LunaMessage, LunaPipe } from '@lunafw/common'

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

const CreatePostSchema = z.object({ title: z.string().min(3), body: z.string() })

@On('post', '/')
@UsePipes(new ZodPipe(CreatePostSchema))
create(@Body() dto: { title: string; body: string }) { ... }
```

---

## Interceptors

Interceptors wrap handler execution and can act both **before** and **after** the handler via the `next()` call. They run after pipes.

```ts
import { Injectable } from '@lunafw/core'
import { LunaExecutionContext, LunaInterceptor } from '@lunafw/common'

@Injectable()
export class LoggingInterceptor implements LunaInterceptor {
  async intercept(context: LunaExecutionContext, next: () => Promise<unknown>) {
    const start = Date.now()
    const result = await next()     // call the handler chain
    const ms = Date.now() - start
    console.log(`[${context.getHandler()}] ${ms}ms`)
    return result
  }
}

@Injectable()
export class CacheInterceptor implements LunaInterceptor {
  private cache = new Map<string, unknown>()

  async intercept(context: LunaExecutionContext, next: () => Promise<unknown>) {
    const message = context.getMessage()
    const key = JSON.stringify(message.metadata.params)
    if (this.cache.has(key)) return this.cache.get(key)
    const result = await next()
    this.cache.set(key, result)
    return result
  }
}
```

```ts
import { UseInterceptors } from '@lunafw/common'

@UseInterceptors(LoggingInterceptor)
@Controller('users')
export class UsersController {
  @UseInterceptors(CacheInterceptor)
  @On('get', '/:id')
  findOne(@Param('id') id: string) { ... }
}
```

Execution order: **controller interceptors wrap method interceptors wrap the handler**.

```
controller-before → method-before → handler → method-after → controller-after
```

---

## Exception Filters

Filters catch exceptions thrown anywhere in the pipeline — by guards, pipes, interceptors, or the handler itself — and turn them into a response.

Use `@Catch` to declare which exception types the filter handles. Omit the argument for a catch-all.

```ts
import { Injectable } from '@lunafw/core'
import { Catch, LunaExceptionFilter, LunaMessage } from '@lunafw/common'

// A domain error specific to your application
export class UserNotFoundError extends Error {
  constructor(id: string) { super(`User ${id} not found`) }
}
```

```ts
import { NotFoundException } from '@lunafw/common'

@Catch(UserNotFoundError)
@Injectable()
export class UserNotFoundFilter implements LunaExceptionFilter<UserNotFoundError> {
  catch(exception: UserNotFoundError, _message: LunaMessage) {
    // convert the domain error into an HTTP exception
    throw new NotFoundException(exception.message)
  }
}
```

```ts
import { UseFilters } from '@lunafw/common'

@UseFilters(UserNotFoundFilter)   // via DI
@Controller('users')
export class UsersController {
  @UseFilters(new UserNotFoundFilter())  // or a pre-built instance
  @On('get', '/:id')
  findOne(@Param('id') id: string) {
    throw new UserNotFoundError(id)  // caught by the filter
  }
}
```

Filter lookup order: **method filters → controller filters → global filters**. First matching filter wins.

### Catch-all filter

```ts
@Catch()    // no argument = catches everything
@Injectable()
export class AllExceptionsFilter implements LunaExceptionFilter {
  catch(exception: unknown, message: LunaMessage) {
    console.error('Unhandled exception on', message.context, exception)
    throw new InternalServerErrorException()
  }
}
```

---

## HTTP Exceptions

All HTTP exceptions live in `@lunafw/common` and can be imported from there or from `@lunafw/platform-express` (re-exported for backward compatibility).

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
} from '@lunafw/common'

throw new NotFoundException('User not found')
// → HTTP 404  { statusCode: 404, message: "User not found" }
```

### Custom HTTP exceptions

```ts
import { HttpException } from '@lunafw/common'

export class PaymentRequiredException extends HttpException {
  constructor(message = 'Payment Required') {
    super(402, message)
  }
}
```

---

## Global middleware

Apply guards, pipes, interceptors, and filters to every route without decorating each controller:

```ts
import { LunaFactory } from '@lunafw/common'
import { ExpressAdapter } from '@lunafw/platform-express'

const adapter = new ExpressAdapter({ port: 3000 })
const app = await LunaFactory.createApplication(AppModule, adapter)

app
  .useGlobalGuards(new AuthGuard())
  .useGlobalPipes(new ValidationPipe())
  .useGlobalInterceptors(new LoggingInterceptor())
  .useGlobalFilters(new AllExceptionsFilter())

await app.start()
```

Execution order: **global → controller → method** for each stage.

---

## @SetMetadata + Reflector

Attach arbitrary metadata to classes or methods and read it inside guards, interceptors, or filters.

```ts
import { SetMetadata } from '@lunafw/common'

// Create a shorthand decorator
export const Roles = (...roles: string[]) => SetMetadata('roles', roles)
```

```ts
@Roles('admin')
@On('delete', '/:id')
remove(@Param('id') id: string) { ... }
```

Read the metadata from a guard or interceptor via `Reflector`:

```ts
import { Injectable } from '@lunafw/core'
import { LunaExecutionContext, LunaInterceptor, Reflector } from '@lunafw/common'

@Injectable()
export class RolesInterceptor implements LunaInterceptor {
  constructor(private readonly reflector: Reflector) {}

  async intercept(context: LunaExecutionContext, next: () => Promise<unknown>) {
    const roles = this.reflector.get<string[]>('roles', context.getMessage())
    if (roles && !this.hasRole(context.getMessage(), roles)) {
      throw new ForbiddenException('Insufficient role')
    }
    return next()
  }

  private hasRole(message: LunaMessage, roles: string[]): boolean {
    const headers = message.metadata.headers as Record<string, string>
    return roles.includes(headers['x-role'])
  }
}
```

---

## License

[MIT](../../LICENSE)

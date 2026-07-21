<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="120" alt="Luna Logo" />
</p>

<h1 align="center">@lunafw/platform-express</h1>

<p align="center">
  HTTP adapter for the Luna framework, built on <a href="https://expressjs.com">Express</a>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/platform-express" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/platform-express?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/platform-express" alt="License" /></a>
</p>

## Installation

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

---

## Quick start

```ts
// main.ts
import { LunaFactory } from '@lunafw/common'
import { ExpressAdapter } from '@lunafw/platform-express'
import { AppModule } from './app.module'

const bootstrap = async () => {
  const adapter = new ExpressAdapter({ port: 3000 })
  const app = await LunaFactory.createApplication(AppModule, adapter)
  await app.start()
  console.log(`HTTP server on :${adapter.getPort()}`)
}
bootstrap()
```

---

## Routing

Routes are declared with `@Controller` (prefix) and `@On` (HTTP method + path). The method must be lowercase.

```ts
import { Injectable } from '@lunafw/core'
import { Body, Controller, NotFoundException, On, Param, Query } from '@lunafw/common'

@Injectable()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users?page=1&limit=20
  @On('get', '/')
  findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.usersService.paginate(Number(page), Number(limit))
  }

  // GET /users/:id
  @On('get', '/:id')
  findOne(@Param('id') id: string) {
    const user = this.usersService.findOne(id)
    if (!user) throw new NotFoundException(`User ${id} not found`)
    return user
  }

  // POST /users
  @On('post', '/')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto)
  }

  // PATCH /users/:id
  @On('patch', '/:id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto)
  }

  // DELETE /users/:id
  @On('delete', '/:id')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id)
    return { deleted: true }
  }
}
```

### Route building

Routes are assembled as `/<prefix><path>`:

| `@Controller` | `@On` | Final route |
|---|---|---|
| `'users'` | `'get', '/'` | `GET /users/` |
| `'users'` | `'get', '/:id'` | `GET /users/:id` |
| `'posts'` | `'post', '/'` | `POST /posts/` |
| `''` | `'get', '/health'` | `GET /health` |

### Parameter decorators

| Decorator | Resolves to |
|---|---|
| `@Body()` | Full `message.payload` (request body) |
| `@Body('field')` | `message.payload.field` |
| `@Param('name')` | `message.metadata.params.name` (URL parameter) |
| `@Query('name')` | `message.metadata.query.name` (query string) |
| `@Headers('name')` | `message.metadata.headers.name` |
| `@Message()` | Full `LunaMessage` |

When **no** decorators are used, the handler receives the full `LunaMessage` as its first argument.

---

## HTTP Exceptions

Throw any exception subclass from a handler — or from a guard, pipe, or interceptor — and the adapter maps it to the correct HTTP status automatically.

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

// All constructors accept an optional custom message:
throw new NotFoundException('Product SKU-42 not found')
// → 404 { "statusCode": 404, "message": "Product SKU-42 not found" }

throw new ConflictException('Email address already registered')
// → 409 { "statusCode": 409, "message": "Email address already registered" }
```

### Custom HTTP exceptions

Extend `HttpException` to define application-specific status codes:

```ts
import { HttpException } from '@lunafw/common'

export class PaymentRequiredException extends HttpException {
  constructor(message = 'Payment Required') {
    super(402, message)
  }
}

export class EnhanceYourCalmException extends HttpException {
  constructor(message = 'Too many requests — slow down') {
    super(420, message)
  }
}
```

---

## Request flow for HTTP

```
Express receives request
        │
        ▼
  Body parsed as JSON (express.json middleware)
        │
        ▼
  Luna builds LunaMessage:
    context: 'http'
    payload: req.body
    metadata: { params, query, headers }
        │
        ▼
  Guards → Pipes → Interceptors → Handler
        │                  (exception filters wrap each stage)
        ▼
  response.json(result)   // handler return value
  response.status(N).json({ statusCode, message })  // on HttpException
```

---

## Guards (HTTP example)

```ts
import { Injectable } from '@lunafw/core'
import { LunaGuard, LunaMessage, UnauthorizedException } from '@lunafw/common'

@Injectable()
export class JwtGuard implements LunaGuard {
  canActivate(message: LunaMessage): boolean {
    const headers = message.metadata.headers as Record<string, string>
    const token = headers['authorization']?.replace('Bearer ', '')
    if (!token) throw new UnauthorizedException('Token missing')
    return this.verifyToken(token)
  }

  private verifyToken(token: string): boolean {
    // your JWT verification logic
    return token.startsWith('valid.')
  }
}
```

```ts
import { UseGuards } from '@lunafw/common'

@UseGuards(JwtGuard)
@Controller('profile')
export class ProfileController { ... }
```

---

## Validation (with class-validator)

Install the optional peer dependencies:

```bash
npm install class-validator class-transformer
```

Define a DTO with validation decorators:

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

Apply the built-in `ValidationPipe`:

```ts
import { ValidationPipe } from '@lunafw/common'

@On('post', '/')
@UsePipes(new ValidationPipe(CreateUserDto))
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto)
}
```

Invalid body:
```json
{ "name": "X" }
```

Response:
```json
{ "statusCode": 400, "message": "name must be longer than or equal to 2 characters; email must be an email" }
```

---

## API

### `new ExpressAdapter(options)`

| Option | Type | Description |
|---|---|---|
| `port` | `number` | Port to listen on. Pass `0` to let the OS assign a free port. |

### `adapter.getPort(): number`

Returns the TCP port the server is currently bound to. Useful when `port: 0` was passed:

```ts
const adapter = new ExpressAdapter({ port: 0 })
await app.start()
console.log(`Listening on :${adapter.getPort()}`)  // e.g. 54321
```

---

## License

[MIT](../../LICENSE)

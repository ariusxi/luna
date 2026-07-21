<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="120" alt="Luna Logo" />
</p>

<h1 align="center">@lunafw/testing</h1>

<p align="center">
  Testing utilities for the Luna framework — DI resolution and handler dispatch without starting a real server.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/testing" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/testing?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/testing" alt="License" /></a>
</p>

## Installation

```bash
npm install --save-dev @lunafw/testing
```

---

## Overview

`@lunafw/testing` lets you test Luna services and controllers without binding to a port or starting Express/ws/gRPC. It spins up the DI container from your module tree and provides an in-memory adapter that dispatches messages directly to your handlers.

```
TestingFactory.createModule(AppModule)
  │
  ├── Resolves the full DI container (same as production)
  ├── testModule.get(Token) → resolve any provider
  └── testModule.createAdapter() → in-memory TestAdapter
        └── adapter.dispatch(event, prefix, path, message)
              → calls your handler, returns its result
```

---

## Testing services

Use `testModule.get(Token)` to resolve a provider and call its methods directly. No adapter or controller needed.

```ts
import { Injectable, Module } from '@lunafw/core'
import { TestingFactory } from '@lunafw/testing'

@Injectable()
class MathService {
  add(a: number, b: number) { return a + b }
  multiply(a: number, b: number) { return a * b }
}

@Module({ providers: [MathService] })
class AppModule {}

describe('MathService', () => {
  let service: MathService

  beforeAll(async () => {
    const testModule = await TestingFactory.createModule(AppModule)
    service = testModule.get(MathService)
  })

  it('adds two numbers', () => {
    expect(service.add(2, 3)).toBe(5)
  })

  it('multiplies two numbers', () => {
    expect(service.multiply(4, 5)).toBe(20)
  })
})
```

---

## Testing controllers

Use `testModule.createAdapter()` + `adapter.dispatch()` to call a controller handler without HTTP.

```ts
import { Injectable, Module } from '@lunafw/core'
import { Controller, LunaMessage, On, Param } from '@lunafw/common'
import { TestingFactory } from '@lunafw/testing'

@Injectable()
class UsersService {
  private users = [{ id: '1', name: 'Alice' }]
  findAll() { return this.users }
  findOne(id: string) { return this.users.find(u => u.id === id) ?? null }
}

@Injectable()
@Controller('users')
class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @On('get', '/')
  findAll() { return this.usersService.findAll() }

  @On('get', '/:id')
  findOne(@Param('id') id: string) { return this.usersService.findOne(id) }
}

@Module({ providers: [UsersService, UsersController] })
class AppModule {}

describe('UsersController', () => {
  let adapter: ReturnType<Awaited<ReturnType<typeof TestingFactory.createModule>>['createAdapter']>

  beforeAll(async () => {
    const testModule = await TestingFactory.createModule(AppModule)
    adapter = testModule.createAdapter()
    await testModule.start()
  })

  it('returns all users', async () => {
    const result = await adapter.dispatch('get', 'users', '/', {
      context: 'test',
      payload: {},
      metadata: {},
    })
    expect(result).toEqual([{ id: '1', name: 'Alice' }])
  })

  it('returns a single user by ID', async () => {
    const result = await adapter.dispatch('get', 'users', '/:id', {
      context: 'test',
      payload: {},
      metadata: { params: { id: '1' } },
    })
    expect(result).toEqual({ id: '1', name: 'Alice' })
  })

  it('throws when user is not found', async () => {
    await expect(
      adapter.dispatch('get', 'users', '/:id', {
        context: 'test',
        payload: {},
        metadata: { params: { id: '999' } },
      })
    ).rejects.toThrow()
  })
})
```

---

## Testing guards

Test that a guard blocks or allows requests by applying it with `useGlobalGuards` on the test app, or by testing the guard class directly:

```ts
import { Injectable } from '@lunafw/core'
import { LunaGuard, LunaMessage } from '@lunafw/common'

@Injectable()
class TokenGuard implements LunaGuard {
  canActivate(message: LunaMessage): boolean {
    const headers = message.metadata.headers as Record<string, string>
    return !!headers['authorization']
  }
}

describe('TokenGuard', () => {
  const guard = new TokenGuard()

  it('allows a request with authorization header', () => {
    const result = guard.canActivate({
      context: 'test',
      payload: {},
      metadata: { headers: { authorization: 'Bearer token123' } },
    })
    expect(result).toBe(true)
  })

  it('blocks a request without authorization header', () => {
    const result = guard.canActivate({
      context: 'test',
      payload: {},
      metadata: { headers: {} },
    })
    expect(result).toBe(false)
  })
})
```

---

## Testing pipes

```ts
import { LunaMessage, LunaPipe } from '@lunafw/common'

class UpperCasePipe implements LunaPipe {
  transform(message: LunaMessage): LunaMessage {
    if (typeof message.payload === 'string') {
      return { ...message, payload: message.payload.toUpperCase() }
    }
    return message
  }
}

describe('UpperCasePipe', () => {
  const pipe = new UpperCasePipe()

  it('uppercases string payloads', () => {
    const result = pipe.transform({
      context: 'test',
      payload: 'hello',
      metadata: {},
    })
    expect(result.payload).toBe('HELLO')
  })

  it('passes non-string payloads through', () => {
    const result = pipe.transform({
      context: 'test',
      payload: { name: 'Luna' },
      metadata: {},
    })
    expect(result.payload).toEqual({ name: 'Luna' })
  })
})
```

---

## Mocking providers

Swap a real provider with a mock using a custom provider in the test module:

```ts
import { Module } from '@lunafw/core'
import { TestingFactory } from '@lunafw/testing'

const mockUsersService = {
  findAll: jest.fn().mockReturnValue([{ id: '1', name: 'Mock Alice' }]),
  findOne: jest.fn().mockReturnValue({ id: '1', name: 'Mock Alice' }),
}

@Module({
  providers: [
    { provide: UsersService, useValue: mockUsersService },
    UsersController,
  ],
})
class TestModule {}

describe('UsersController (mocked service)', () => {
  beforeAll(async () => {
    const testModule = await TestingFactory.createModule(TestModule)
    adapter = testModule.createAdapter()
    await testModule.start()
  })

  it('calls usersService.findAll', async () => {
    await adapter.dispatch('get', 'users', '/', { context: 'test', payload: {}, metadata: {} })
    expect(mockUsersService.findAll).toHaveBeenCalledTimes(1)
  })
})
```

---

## API

### `TestingFactory.createModule(rootModule)`

Bootstraps the Luna DI container from the given module — same resolution logic as production, no server started. Returns a `TestingModule`.

### `testModule.get<T>(token)`

Resolves a provider instance from the DI container.

```ts
const service = testModule.get(UsersService)
const secret  = testModule.get<string>('JWT_SECRET')
```

### `testModule.createAdapter()`

Creates a `TestAdapter` and registers it with the application. Must be called **before** `testModule.start()`. Returns the adapter.

### `testModule.start()`

Registers all controllers with the `TestAdapter` and triggers lifecycle hooks (`onModuleInit`, `onApplicationBootstrap`).

### `adapter.dispatch(event, prefix, path, message)`

Finds the handler registered for `event:prefix:path` and invokes it with `message`. Returns the handler's result. Throws a descriptive error if no handler matches.

```ts
const result = await adapter.dispatch(
  'post',          // event (HTTP method for Express, event name for WS)
  'users',         // prefix (@Controller value)
  '/',             // path (@On second argument)
  {
    context: 'test',
    payload: { name: 'Bob', email: 'bob@example.com' },
    metadata: {},
  },
)
```

---

## License

[MIT](../../LICENSE)

<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="120" alt="Luna Logo" />
</p>

<h1 align="center">@lunafw/testing</h1>

<p align="center">
  Testing utilities for the Luna framework — DI resolution and in-memory handler dispatch without starting a server.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/testing" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/testing?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/testing" alt="License" /></a>
</p>

## Installation

```bash
npm install --save-dev @lunafw/testing
```

## Usage

### Testing services (DI resolution)

```ts
import 'reflect-metadata'
import { Injectable, Module } from '@lunafw/core'
import { TestingFactory } from '@lunafw/testing'

@Injectable()
class UserService {
  findAll() { return [{ id: 1, name: 'Alice' }] }
}

@Module({ providers: [UserService] })
class AppModule {}

describe('UserService', () => {
  it('returns all users', async () => {
    const testModule = await TestingFactory.createModule(AppModule)
    const service = testModule.get(UserService)
    expect(service.findAll()).toHaveLength(1)
  })
})
```

### Testing controllers (handler dispatch)

```ts
import 'reflect-metadata'
import { Injectable, Module } from '@lunafw/core'
import { Controller, LunaMessage, On } from '@lunafw/common'
import { TestingFactory } from '@lunafw/testing'

@Injectable()
@Controller('users')
class UserController {
  @On('get', '/')
  findAll(_message: LunaMessage) {
    return [{ id: 1 }]
  }
}

@Module({ providers: [UserController] })
class AppModule {}

describe('UserController', () => {
  it('returns users', async () => {
    const testModule = await TestingFactory.createModule(AppModule)
    const adapter = testModule.createAdapter()
    await testModule.start()

    const result = await adapter.dispatch('get', 'users', '/', {
      context: 'test',
      payload: {},
      metadata: {},
    })

    expect(result).toEqual([{ id: 1 }])
  })
})
```

## API

### `TestingFactory.createModule(rootModule)`

Bootstraps the Luna DI container from the given module without starting any server or adapter. Returns a `TestingModule`.

### `testModule.get<T>(token)`

Resolves a provider from the DI container. Accepts a class constructor or a string/symbol token.

```ts
const service = testModule.get(UserService)
const key = testModule.get<string>('API_KEY')
```

### `testModule.createAdapter()`

Creates and registers a `TestAdapter` with the underlying `LunaApplication`. Returns the adapter so you can call `dispatch()` on it.

Must be called before `testModule.start()`.

### `testModule.start()`

Registers all controllers with the `TestAdapter` and triggers `onModuleInit` / `onApplicationBootstrap` lifecycle hooks.

### `adapter.dispatch(event, prefix, path, message)`

Invokes the handler registered for `event:prefix:path` directly and returns its result. Throws a descriptive error if no handler is found.

```ts
const result = await adapter.dispatch('post', 'items', '/', {
  context: 'test',
  payload: { name: 'Luna' },
  metadata: {},
})
```

## License

[MIT](../../LICENSE)

<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="120" alt="Luna Logo" />
</p>

<h1 align="center">@lunafw/core</h1>

<p align="center">
  Dependency injection, module system, and lifecycle hooks for the Luna framework.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/core" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/core?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/core" alt="License" /></a>
</p>

## Installation

```bash
npm install @lunafw/core
```

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## Module system

Modules are the building blocks of a Luna application. Each module groups related providers and controls what is visible to the rest of the application via `exports`.

```
AppModule
  ├── imports: [UsersModule, DatabaseModule]
  │
  ├── UsersModule
  │     providers: [UsersService, UsersController]
  │     exports:   [UsersService]   ← visible to importers
  │
  └── DatabaseModule
        providers: [DbConnection]
        exports:   [DbConnection]
```

### Declaring a module

```ts
import { Module } from '@lunafw/core'

@Module({
  imports:   [DatabaseModule],   // modules whose exports become available here
  providers: [UsersService, UsersController],
  exports:   [UsersService],     // make UsersService available to importers
})
export class UsersModule {}
```

### Root module

The root module is the entry point passed to `LunaFactory`. It imports every feature module that the application needs:

```ts
import { Module } from '@lunafw/core'
import { UsersModule } from './users/users.module'
import { PostsModule } from './posts/posts.module'

@Module({
  imports: [UsersModule, PostsModule],
})
export class AppModule {}
```

---

## Dependency Injection

### @Injectable

Mark any class as an injectable provider. Luna resolves its constructor dependencies automatically using TypeScript metadata:

```ts
import { Injectable } from '@lunafw/core'

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}
  // DatabaseService is resolved from the same module's container
}
```

### Provider scopes

```ts
import { Injectable, ProviderScope } from '@lunafw/core'

@Injectable(ProviderScope.Singleton)   // default — one instance per module
@Injectable(ProviderScope.Transient)   // new instance every time it is requested
```

### @Inject

Use `@Inject` when a token is a string or symbol — TypeScript cannot infer these automatically:

```ts
import { Inject, Injectable } from '@lunafw/core'

@Injectable()
export class AppService {
  constructor(
    private readonly userService: UserService,         // resolved by type
    @Inject('API_URL') private readonly apiUrl: string, // resolved by string token
    @Inject(DB_TOKEN) private readonly db: DbClient,   // resolved by symbol token
  ) {}
}
```

### Custom providers

Three factory styles are available for cases where simple class injection is not enough:

```ts
@Module({
  providers: [
    // Value provider — inject a literal value or pre-built object
    { provide: 'API_URL', useValue: process.env.API_URL ?? 'http://localhost' },

    // Class provider — swap implementations without changing consumers
    { provide: LoggerService, useClass: ProductionLoggerService },

    // Factory provider — build the instance with injected dependencies
    {
      provide: 'DB_CONNECTION',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createConnection(config.get('DATABASE_URL')),
    },
  ],
})
export class AppModule {}
```

### defineProvider helper

`defineProvider` gives you auto-complete and type safety when defining factory providers:

```ts
import { defineProvider } from '@lunafw/core'

export const cacheProvider = defineProvider({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => new CacheClient(config.get('REDIS_URL', 'redis://localhost')),
})

@Module({ providers: [ConfigService, cacheProvider] })
export class CacheModule {}
```

### Conditional providers

Register a provider only when a runtime condition is met:

```ts
defineProvider({
  useFactory: () => new DevLogger(),
  when: () => process.env.NODE_ENV === 'development',
})
```

### Lazy providers

Defer instantiation to the first time the token is resolved (useful for expensive connections):

```ts
defineProvider({
  inject: [ConfigService],
  useFactory: (config) => new SearchClient(config.get('ELASTIC_URL')),
  lazy: true,
})
```

---

## Error handling

`DependencyResolutionError` is thrown when a provider cannot be resolved. Common causes: missing registration, wrong token, or a circular dependency.

```ts
import { DependencyResolutionError } from '@lunafw/core'

try {
  const service = app.get(UnregisteredService)
} catch (e) {
  if (e instanceof DependencyResolutionError) {
    console.error('[DI]', e.message)
    // e.g. "[Luna] Cannot resolve UserService: DatabaseService is not registered"
  }
}
```

---

## Lifecycle hooks

Any provider can implement one or more lifecycle interfaces. Luna calls them in the documented order:

| Hook | When it runs |
|---|---|
| `onModuleInit()` | After all providers in all modules are instantiated |
| `onApplicationBootstrap()` | After all `onModuleInit` hooks complete |
| `onModuleDestroy()` | On SIGTERM / SIGINT, before shutdown |
| `beforeApplicationShutdown()` | After all `onModuleDestroy` hooks |
| `onApplicationShutdown()` | Last hook before the process exits |

```ts
import { Injectable } from '@lunafw/core'

@Injectable()
export class DatabaseService {
  async onModuleInit() {
    await this.connect()
    console.log('Database connected')
  }

  async onModuleDestroy() {
    await this.disconnect()
    console.log('Database disconnected')
  }
}
```

---

## Debugging

`app.inspect(token)` returns a serialisable snapshot of the provider dependency tree — useful for tracing unexpected resolutions:

```ts
import { LunaFactory } from '@lunafw/core'

const app = await LunaFactory.create(AppModule)
console.log(JSON.stringify(app.inspect(UsersController), null, 2))
// {
//   "token": "UsersController",
//   "scope": "singleton",
//   "dependencies": [
//     { "token": "UsersService", "scope": "singleton", "dependencies": [...] }
//   ]
// }
```

---

## License

[MIT](../../LICENSE)

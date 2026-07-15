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
npm install @lunafw/core reflect-metadata
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

## Modules

```ts
import { Module } from '@lunafw/core'

@Module({
  imports: [DatabaseModule],
  providers: [UserService, UserController],
  exports: [UserService],
})
export class UserModule {}
```

## Dependency Injection

```ts
import { Injectable } from '@lunafw/core'

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}
}
```

### Provider Scopes

```ts
import { Injectable, ProviderScope } from '@lunafw/core'

@Injectable(ProviderScope.Singleton)  // default
@Injectable(ProviderScope.Transient)
```

### Custom Providers

```ts
@Module({
  providers: [
    { provide: 'API_KEY', useValue: process.env.API_KEY },
    { provide: ConfigService, useClass: ProductionConfigService },
    {
      provide: 'DB_CONNECTION',
      useFactory: (config: ConfigService) => createConnection(config.dbUrl),
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}
```

### Functional Providers

```ts
import { defineProvider } from '@lunafw/core'

const cacheProvider = defineProvider({
  inject: [ConfigService],
  useFactory: (config) => new CacheClient(config.redisUrl),
})
```

### Conditional & Lazy Providers

```ts
// only registered when condition is true
defineProvider({
  useFactory: () => new DevLogger(),
  when: () => process.env.NODE_ENV === 'development',
})

// resolved on first use, not during boot
defineProvider({
  useFactory: () => new HeavyService(),
  lazy: true,
})
```

## Lifecycle Hooks

```ts
@Injectable()
export class AppService {
  onModuleInit() {}
  onApplicationBootstrap() {}
  onModuleDestroy() {}
  beforeApplicationShutdown() {}
  onApplicationShutdown() {}
}
```

## License

[MIT](../../LICENSE)

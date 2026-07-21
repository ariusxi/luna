<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="120" alt="Luna Logo" />
</p>

<h1 align="center">@lunafw/config</h1>

<p align="center">
  Environment-based configuration module for the Luna framework.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/config" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/config?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/config" alt="License" /></a>
</p>

## Installation

```bash
npm install @lunafw/config
```

## Quick Start

Call `ConfigModule.load()` at the very top of your entry file, before bootstrap:

```ts
// main.ts
import 'reflect-metadata'
import { ConfigModule } from '@lunafw/config'

ConfigModule.load() // loads .env before any module is instantiated

import { LunaFactory } from '@lunafw/common'
import { ExpressAdapter } from '@lunafw/platform-express'
import { AppModule } from './app.module'

const adapter = new ExpressAdapter({ port: 3000 })
const app = await LunaFactory.createApplication(AppModule, adapter)
await app.start()
```

Add `ConfigModule` to your root module's `imports`:

```ts
// app.module.ts
import { Module } from '@lunafw/core'
import { ConfigModule } from '@lunafw/config'

@Module({
  imports: [ConfigModule],
})
export class AppModule {}
```

Inject `ConfigService` wherever you need config values:

```ts
import { Injectable } from '@lunafw/core'
import { ConfigService } from '@lunafw/config'

@Injectable()
export class DatabaseService {
  constructor(private readonly config: ConfigService) {}

  connect() {
    const url = this.config.get('DATABASE_URL')
    const poolSize = this.config.get<number>('DB_POOL_SIZE', 10)
    // ...
  }
}
```

## ConfigModule.load(options?)

Synchronously reads the `.env` file and merges it into `process.env`. Existing environment variables are never overridden (process wins over file).

| Option | Type | Default | Description |
|---|---|---|---|
| `envFilePath` | `string \| string[]` | `'.env'` | Path(s) to `.env` file(s), resolved relative to `process.cwd()`. |
| `ignoreEnvFile` | `boolean` | `false` | Skip file loading entirely; read only from the OS environment. |

```ts
// Multiple files — loaded in order; first definition wins
ConfigModule.load({ envFilePath: ['.env', '.env.local'] })

// CI / production: skip the file, trust the OS environment
ConfigModule.load({ ignoreEnvFile: true })
```

## ConfigService.get(key, default?)

```ts
// Returns string | undefined
config.get('OPTIONAL_KEY')

// Returns string (falls back to default when key is missing)
config.get('HOST', 'localhost')

// Generic type for non-string values (value is still a string at runtime)
config.get<number>('PORT', 3000)
config.get<boolean>('FEATURE_FLAG', false)
```

> **Note**: all environment variables are strings. When you use a generic type (`get<number>`) you are responsible for the conversion if you need the actual primitive type.

## .env file format

```ini
# Comments are ignored
DATABASE_URL=postgres://localhost:5432/mydb

# Quoted values — quotes are stripped
SECRET="my secret value"
TOKEN='another token'

# Values already set in the OS environment take priority
NODE_ENV=development
```

## License

[MIT](../../LICENSE)

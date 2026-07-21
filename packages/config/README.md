<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="120" alt="Luna Logo" />
</p>

<h1 align="center">@lunafw/config</h1>

<p align="center">
  Environment-based configuration module for the Luna framework — zero dependencies, no runtime overhead.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/config" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/config?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/config" alt="License" /></a>
</p>

## Installation

```bash
npm install @lunafw/config
```

---

## How it works

`ConfigModule.load()` reads a `.env` file synchronously using Node's built-in `fs` module and merges the values into `process.env`. It **never overwrites** variables that are already set — the OS environment always takes priority.

Call it at the very top of your entry file, before any imports that might read from `process.env`:

```ts
// main.ts
import { ConfigModule } from '@lunafw/config'

ConfigModule.load()   // ← must run before anything reads process.env

import { LunaFactory } from '@lunafw/common'
import { ExpressAdapter } from '@lunafw/platform-express'
import { AppModule } from './app.module'

const bootstrap = async () => {
  const adapter = new ExpressAdapter({ port: Number(process.env.PORT ?? 3000) })
  const app = await LunaFactory.createApplication(AppModule, adapter)
  await app.start()
}
bootstrap()
```

---

## Module setup

Import `ConfigModule` in your root module to make `ConfigService` available via DI across the entire application:

```ts
// app.module.ts
import { Module } from '@lunafw/core'
import { ConfigModule } from '@lunafw/config'

@Module({
  imports: [ConfigModule],
})
export class AppModule {}
```

---

## Injecting ConfigService

```ts
import { Injectable } from '@lunafw/core'
import { ConfigService } from '@lunafw/config'

@Injectable()
export class DatabaseService {
  constructor(private readonly config: ConfigService) {}

  getConnectionUrl(): string {
    return this.config.get('DATABASE_URL', 'postgres://localhost:5432/mydb')
  }

  getPoolSize(): number {
    return Number(this.config.get<number>('DB_POOL_SIZE', 10))
  }
}
```

---

## .env file format

```ini
# Comments (lines starting with #) are ignored

# Plain key=value
DATABASE_URL=postgres://localhost:5432/myapp
PORT=3000

# Quoted values — single or double quotes are stripped
SECRET="my secret value with spaces"
TOKEN='another-token'

# Empty value is valid
OPTIONAL_FEATURE=

# Variables already set in the OS environment are NOT overwritten
NODE_ENV=development
```

---

## ConfigModule.load(options?)

| Option | Type | Default | Description |
|---|---|---|---|
| `envFilePath` | `string \| string[]` | `'.env'` | Path(s) to `.env` file(s), relative to `process.cwd()`. |
| `ignoreEnvFile` | `boolean` | `false` | Skip file loading entirely and rely on the OS environment. |

### Multiple files

Files are loaded in order. For each key, the **first** file that defines it wins (later files do not override earlier ones, and the OS environment wins over all files):

```ts
// loads .env first, then .env.local — .env.local cannot override .env
ConfigModule.load({ envFilePath: ['.env', '.env.local'] })
```

### Environment-specific files

```ts
const env = process.env.NODE_ENV ?? 'development'
ConfigModule.load({ envFilePath: ['.env', `.env.${env}`] })
```

### Skip file loading (production / CI)

When all environment variables are injected by the platform (Docker, Kubernetes, CI), skip the file entirely:

```ts
ConfigModule.load({ ignoreEnvFile: process.env.NODE_ENV === 'production' })
```

---

## ConfigService.get(key, defaultValue?)

```ts
// Returns string | undefined when no default is given
const value = config.get('OPTIONAL_KEY')

// Returns string, falls back to default when the key is missing
const host = config.get('HOST', 'localhost')

// Generic type annotation for convenience — value is still a string at runtime
const port = config.get<number>('PORT', 3000)
const debug = config.get<boolean>('DEBUG', false)
```

> **Note**: environment variables are always strings. When you annotate with a generic type (`get<number>`), you are responsible for converting the string to the actual type when you need it (`Number(config.get('PORT', 3000))`).

---

## Full example

```
.env
DATABASE_URL=postgres://localhost:5432/myapp
PORT=4000
JWT_SECRET=supersecret
```

```ts
// main.ts
import { ConfigModule } from '@lunafw/config'

ConfigModule.load()

import { LunaFactory } from '@lunafw/common'
import { ExpressAdapter } from '@lunafw/platform-express'
import { AppModule } from './app.module'

const bootstrap = async () => {
  const port = Number(process.env.PORT ?? 3000)
  const adapter = new ExpressAdapter({ port })
  const app = await LunaFactory.createApplication(AppModule, adapter)
  await app.start()
  console.log(`Server on :${adapter.getPort()}`)
}
bootstrap()
```

```ts
// app.module.ts
import { Module } from '@lunafw/core'
import { ConfigModule } from '@lunafw/config'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'

@Module({ imports: [ConfigModule, AuthModule, UsersModule] })
export class AppModule {}
```

```ts
// auth/auth.service.ts
import { Injectable } from '@lunafw/core'
import { ConfigService } from '@lunafw/config'

@Injectable()
export class AuthService {
  private readonly secret: string

  constructor(config: ConfigService) {
    this.secret = config.get('JWT_SECRET', 'fallback-secret')
  }

  sign(payload: object): string {
    // use this.secret to sign a JWT
    return `signed.${JSON.stringify(payload)}`
  }
}
```

---

## License

[MIT](../../LICENSE)

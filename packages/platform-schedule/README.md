# @lunafw/platform-schedule

Scheduling adapter for the [Luna](https://github.com/ariusxi/luna) framework. Runs
in-process background jobs on a **cron** schedule or fixed **interval**, reusing
Luna's controllers, dependency injection, and handler pipeline.

## Install

```bash
npm install @lunafw/platform-schedule node-cron
```

## Usage

```ts
import { LunaFactory } from '@lunafw/common'
import { ExpressAdapter } from '@lunafw/platform-express'
import { Schedule, Cron, Interval, ScheduleAdapter } from '@lunafw/platform-schedule'
import { Injectable, Module } from '@lunafw/core'

@Injectable()
@Schedule()
class CleanupJob {
  @Cron('0 4 * * *') // every day at 04:00
  async purgeOldMedia() { /* ... */ }

  @Interval(60_000) // every minute
  async drainQueue() { /* ... */ }
}

@Module({ providers: [CleanupJob] })
class AppModule {}

const app = await LunaFactory.createApplication(AppModule, [
  new ExpressAdapter({ port: 3000 }),
  new ScheduleAdapter(),
])
await app.start()
```

`@Cron`/`@Interval` are sugar over `@On('cron', expr)` / `@On('interval', ms)`.
`@Schedule()` is a thin alias over `@Controller` so the factory discovers the job's
methods; scheduled handlers are never mounted on an HTTP/WS route.

A failing run is logged and swallowed, so it cannot crash the process or stop
future runs. `close()` (called on `SIGTERM`/`SIGINT`) stops every timer.

> Runs in every process. With multiple replicas each one fires the schedule; make
> jobs idempotent or add your own leader election / locking.

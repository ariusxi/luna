import 'reflect-metadata'
import { Injectable, Module } from '@lunafw/core'
import { LunaFactory, On } from '@lunafw/common'

import { Cron, Interval, Schedule, ScheduleAdapter } from '../../src'

let ticks = 0

@Injectable()
@Schedule()
class TickJob {
  @Interval(20)
  run(): void {
    ticks += 1
  }

  @Cron('0 4 * * *')
  daily(): void {
    /* not expected to fire during the test window */
  }

  @On('get', '/')
  httpNoop(): void {
    /* an HTTP handler the schedule adapter must ignore */
  }
}

@Module({ providers: [TickJob] })
class AppModule {}

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

describe('ScheduleAdapter integration', () => {
  let adapter: ScheduleAdapter

  beforeEach(() => {
    ticks = 0
    adapter = new ScheduleAdapter()
  })

  afterEach(async () => {
    await adapter.close()
  })

  it('registers only cron/interval handlers, ignoring HTTP events', async () => {
    const app = await LunaFactory.createApplication(AppModule, adapter)
    await app.start()
    expect(adapter.getEntries()).toHaveLength(2)
    expect(adapter.getEntries().map((entry) => entry.metadata.event).sort()).toEqual(['cron', 'interval'])
  })

  it('fires an interval job repeatedly after start', async () => {
    const app = await LunaFactory.createApplication(AppModule, adapter)
    await app.start()
    await wait(75)
    expect(ticks).toBeGreaterThanOrEqual(2)
  })

  it('stops firing after close', async () => {
    const app = await LunaFactory.createApplication(AppModule, adapter)
    await app.start()
    await wait(40)
    await adapter.close()
    const afterClose = ticks
    await wait(60)
    expect(ticks).toBe(afterClose)
  })
})

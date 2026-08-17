import { schedule as scheduleCron, validate as validateCron, type ScheduledTask } from 'node-cron'
import { AbstractAdapter, HandlerMetadata, LunaHandler } from '@lunafw/common'

import type { ScheduleEvent } from '../types'

const SCHEDULE_EVENTS: ReadonlySet<string> = new Set<ScheduleEvent>(['cron', 'interval'])

interface ScheduleEntry {
  handler: LunaHandler
  metadata: HandlerMetadata
}

/**
 * Scheduling adapter for Luna.
 *
 * Interprets `@On('cron', <expression>)` and `@On('interval', <ms>)` handlers
 * (also via the `@Cron` / `@Interval` decorators) and runs them in-process on
 * their schedule. Non-schedule handlers registered by the factory are ignored.
 *
 * Each run invokes the handler with a `{ context: 'schedule' }` message; the
 * return value is discarded and a thrown error is logged, never rethrown, so one
 * failing run cannot crash the process or stop future runs.
 *
 * @example
 * const app = await LunaFactory.createApplication(AppModule, [
 *   new ExpressAdapter({ port: 3000 }),
 *   new ScheduleAdapter(),
 * ])
 * await app.start()
 */
export class ScheduleAdapter extends AbstractAdapter {
  private readonly entries: ScheduleEntry[] = []
  private readonly cronTasks: ScheduledTask[] = []
  private readonly intervals: ReturnType<typeof setInterval>[] = []
  private running = false

  /** Stores schedule handlers; ignores handlers of other adapters' events. */
  public register(handler: LunaHandler, metadata: HandlerMetadata): void {
    if (!SCHEDULE_EVENTS.has(metadata.event)) return
    this.entries.push({ handler, metadata })
  }

  /** Arms every registered schedule. Idempotent. */
  public async listen(): Promise<void> {
    if (this.running) return
    this.running = true
    for (const entry of this.entries) {
      if (entry.metadata.event === 'cron') this.startCron(entry)
      else this.startInterval(entry)
    }
  }

  /** Stops every timer and releases them. */
  public async close(): Promise<void> {
    for (const task of this.cronTasks) task.stop()
    for (const interval of this.intervals) clearInterval(interval)
    this.cronTasks.length = 0
    this.intervals.length = 0
    this.running = false
  }

  /** Registered schedule handlers, for inspection/testing. */
  public getEntries(): ScheduleEntry[] {
    return this.entries
  }

  private startCron(entry: ScheduleEntry): void {
    const expression = entry.metadata.path
    if (!validateCron(expression)) throw new Error(`ScheduleAdapter: invalid cron expression "${expression}"`)
    this.cronTasks.push(scheduleCron(expression, () => void this.run(entry)))
  }

  private startInterval(entry: ScheduleEntry): void {
    const milliseconds = Number(entry.metadata.path)
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
      throw new Error(`ScheduleAdapter: invalid interval "${entry.metadata.path}"`)
    }
    const interval = setInterval(() => void this.run(entry), milliseconds)
    if (typeof interval.unref === 'function') interval.unref()
    this.intervals.push(interval)
  }

  private async run(entry: ScheduleEntry): Promise<void> {
    try {
      await entry.handler.handle({
        context: 'schedule',
        payload: undefined,
        metadata: { event: entry.metadata.event, schedule: entry.metadata.path, firedAt: new Date().toISOString() },
      })
    } catch (error) {
      console.error('[LunaScheduleAdapter] job failed:', error)
    }
  }
}

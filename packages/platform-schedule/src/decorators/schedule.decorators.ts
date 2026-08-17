import { Controller, On } from '@lunafw/common'

/**
 * Marks a class as a container of scheduled jobs so the factory discovers its
 * `@On`/`@Cron`/`@Interval` methods. A thin alias over `@Controller`; the name is
 * only a label (scheduled handlers are not mounted on any HTTP/WS route).
 *
 * @example
 * @Schedule()
 * class ChatMediaCleanupJob {
 *   @Cron('0 4 * * *')
 *   run() { ... }
 * }
 */
export const Schedule = (name = 'schedule'): ClassDecorator => Controller(name)

/**
 * Runs the handler on a cron schedule. Interpreted by `ScheduleAdapter`.
 *
 * @param expression - Standard cron expression (e.g. `'0 4 * * *'`).
 */
export const Cron = (expression: string): MethodDecorator => On('cron', expression)

/**
 * Runs the handler every `milliseconds`. Interpreted by `ScheduleAdapter`.
 *
 * @param milliseconds - Delay between runs, in milliseconds.
 */
export const Interval = (milliseconds: number): MethodDecorator => On('interval', String(milliseconds))

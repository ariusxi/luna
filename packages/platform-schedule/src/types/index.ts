/** The schedule events the adapter interprets from `@On`. */
export type ScheduleEvent = 'cron' | 'interval'

/** Payload-free message metadata delivered to a scheduled handler when it fires. */
export interface ScheduleFireMetadata {
  /** The schedule kind that triggered the run. */
  event: ScheduleEvent
  /** The cron expression or interval (ms) the handler was registered with. */
  schedule: string
  /** ISO timestamp of when the run was triggered. */
  firedAt: string
}

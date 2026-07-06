/**
 * Metadata passed to an adapter's `register` method for each decorated handler.
 *
 * Built by `LunaApplication` from `@Controller` and `@On` decorator metadata,
 * then forwarded to the adapter so it can configure its internal routing.
 */
export interface HandlerMetadata {
  /** Protocol-specific event identifier. Each adapter defines what values are valid. */
  event: string
  /** Controller-level prefix from `@Controller` (e.g. `'users'`). */
  prefix: string
  /** Method-level path from `@On` (e.g. `'/'`, `'/:id'`). */
  path: string
}

import { HandlerMetadata, LunaHandler } from '@lunafw/common'

// The JSON parser's `verify` hook stashes the untouched request bytes here so
// `@RawBody()` handlers (webhook signature checks) can read them.
declare module 'express-serve-static-core' {
  interface Request {
    rawBody?: Buffer
  }
}

/** Configuration options for `ExpressAdapter`. */
export interface ExpressAdapterOptions {
  /** TCP port to listen on. Pass `0` to let the OS assign a free port. */
  port: number
}

/** Internal pair stored by the adapter until `listen()` mounts the routes. */
export interface ExpressHandler {
  handler: LunaHandler
  metadata: HandlerMetadata
}

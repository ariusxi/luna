import { HandlerMetadata, LunaHandler } from '@lunafw/common'

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
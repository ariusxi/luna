import { HandlerMetadata, LunaHandler } from '@lunafw/common'

export interface ExpressAdapterOptions {
  port: number
}

export interface ExpressHandler {
  handler: LunaHandler
  metadata: HandlerMetadata
}
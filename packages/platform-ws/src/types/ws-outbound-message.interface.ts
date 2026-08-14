/** Server-originated WebSocket event delivered outside a request response. */
export interface WsOutboundMessage<Data = unknown> {
  event: string
  data: Data
}

/** Optional filters applied to a WebSocket broadcast. */
export interface WsBroadcastOptions {
  excludeSocketId?: string
}

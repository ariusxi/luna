import { WebSocket } from 'ws'
import { HandlerMetadata, LunaHandler } from '@lunafw/common'

interface WsIncomingMessage {
  event: string
  data: unknown
}

interface WsHandlerEntry {
  handler: LunaHandler
  routeKey: string
}

/**
 * Collects WebSocket handler entries and dispatches incoming messages to them.
 *
 * Separated from `WsAdapter` so that routing concerns (`register`, `dispatch`)
 * stay cohesive while server lifecycle (`listen`, `getPort`, `close`) lives in
 * the adapter.
 */
export class WsHandlerRegistry {
  private readonly entries: WsHandlerEntry[] = []

  register(handler: LunaHandler, metadata: HandlerMetadata): void {
    const routeKey = metadata.prefix
      ? `${metadata.prefix}.${metadata.event}`
      : metadata.event

    this.entries.push({ handler, routeKey })
  }

  async dispatch(socket: WebSocket, socketId: string, raw: Buffer | string): Promise<void> {
    const parsed = this.parse(raw)
    if (!parsed) return

    const entry = this.entries.find((e) => e.routeKey === parsed.event)
    if (!entry) return

    const result = await entry.handler.handle({
      context: 'ws',
      payload: parsed.data,
      metadata: { event: parsed.event, socketId },
    })

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(result))
    }
  }

  private parse(raw: Buffer | string): WsIncomingMessage | null {
    try {
      const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw)
      const obj = JSON.parse(text) as Record<string, unknown>
      if (typeof obj['event'] !== 'string') return null
      return { event: obj['event'], data: obj['data'] }
    } catch {
      return null
    }
  }
}

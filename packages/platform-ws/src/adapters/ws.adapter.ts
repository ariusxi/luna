import { WebSocketServer, WebSocket } from 'ws'
import { AbstractAdapter, HandlerMetadata, LunaHandler } from '@lunafw/common'

import { WsAdapterOptions } from '../types'

/** Shape of every incoming WebSocket message. */
interface WsIncomingMessage {
  event: string
  data: unknown
}

/** Internal record that binds a handler to its routing key. */
interface WsHandlerEntry {
  handler: LunaHandler
  routeKey: string
}

/**
 * WebSocket adapter for Luna based on the `ws` library.
 *
 * Incoming messages must be valid JSON with the shape `{ "event": string, "data": unknown }`.
 * The adapter resolves a route key from the registered handler metadata using the formula
 * `<prefix>.<event>` (or just `<event>` when prefix is empty), then dispatches the message
 * to the matching handler.
 *
 * The handler's return value is serialised back to JSON and sent to the originating socket.
 * Unknown events are silently ignored.
 *
 * @example
 * const adapter = new WsAdapter({ port: 0 })
 * const app = await LunaFactory.createApplication(AppModule, adapter)
 * await app.start()
 * console.log('Listening on port', adapter.getPort())
 */
export class WsAdapter extends AbstractAdapter {
  private wss?: WebSocketServer
  private readonly entries: WsHandlerEntry[] = []

  constructor(private readonly options: WsAdapterOptions) {
    super()
  }

  /**
   * Registers a handler together with its metadata.
   *
   * The route key is derived as `<prefix>.<event>` or `<event>` when prefix is empty.
   * Registration is deferred — the handler is not yet active until {@link listen} is called.
   */
  public register(handler: LunaHandler, metadata: HandlerMetadata): void {
    const routeKey = metadata.prefix
      ? `${metadata.prefix}.${metadata.event}`
      : metadata.event

    this.entries.push({ handler, routeKey })
  }

  /**
   * Starts the WebSocket server and begins accepting connections.
   *
   * For each connected socket the adapter listens for `message` events, parses the
   * JSON payload, resolves the matching handler by `event` field, calls
   * `handler.handle()`, and sends the result back as JSON.
   *
   * @returns A promise that resolves once the server is fully listening.
   */
  public async listen(): Promise<void> {
    this.wss = new WebSocketServer({ port: this.options.port })

    await new Promise<void>((resolve, reject) => {
      this.wss!.once('listening', resolve)
      this.wss!.once('error', reject)
    })

    this.wss.on('connection', (socket: WebSocket) => {
      const socketId = Math.random().toString(36).slice(2)

      socket.on('message', (raw: Buffer | string) => {
        void this.handleMessage(socket, socketId, raw)
      })
    })
  }

  /**
   * Parses and dispatches a single raw WebSocket message.
   *
   * Silently ignores messages that are not valid JSON or that lack an `event` field.
   * Unknown events (no registered handler) are also silently ignored.
   *
   * @param socket   - The originating WebSocket connection.
   * @param socketId - A unique identifier assigned to this connection.
   * @param raw      - The raw message buffer or string.
   */
  private async handleMessage(
    socket: WebSocket,
    socketId: string,
    raw: Buffer | string,
  ): Promise<void> {
    let parsed: WsIncomingMessage

    try {
      const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw)
      const obj = JSON.parse(text) as Record<string, unknown>

      if (typeof obj['event'] !== 'string') return

      parsed = { event: obj['event'], data: obj['data'] }
    } catch {
      return
    }

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

  /**
   * Returns the TCP port the server is currently bound to.
   *
   * Particularly useful when the adapter was created with `port: 0` (OS-assigned port).
   *
   * @throws {Error} If the server has not started yet.
   */
  public getPort(): number {
    const address = this.wss?.address()
    if (!address || typeof address === 'string') {
      throw new Error('WebSocket server is not listening')
    }
    return address.port
  }

  /**
   * Closes all active connections and stops the WebSocket server.
   *
   * @returns A promise that resolves once the server is fully closed.
   */
  public async close(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.wss?.close((err) => (err ? reject(err) : resolve()))
    })
  }
}

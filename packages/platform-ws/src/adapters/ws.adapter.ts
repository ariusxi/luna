import { randomUUID } from 'node:crypto'
import { WebSocket, WebSocketServer } from 'ws'
import { AbstractAdapter, HandlerMetadata, LunaHandler } from '@lunafw/common'

import { WsAdapterOptions, WsBroadcastOptions, WsOutboundMessage } from '../types'
import { WsHandlerRegistry } from './ws.handler.registry'

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
  private readonly registry = new WsHandlerRegistry()
  private readonly sockets = new Map<string, WebSocket>()

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
    this.registry.register(handler, metadata)
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
      const socketId = randomUUID()
      this.sockets.set(socketId, socket)

      socket.on('message', (raw: Buffer | string) => {
        void this.registry.dispatch(socket, socketId, raw)
      })

      socket.once('close', () => {
        this.sockets.delete(socketId)
      })
    })
  }

  /** Sends a server-originated event to one connected socket. */
  public send<Data>(socketId: string, message: WsOutboundMessage<Data>): boolean {
    const socket = this.sockets.get(socketId)
    if (!socket || socket.readyState !== WebSocket.OPEN) return false

    socket.send(JSON.stringify(message))
    return true
  }

  /** Broadcasts a server-originated event to all matching connected sockets. */
  public broadcast<Data>(
    message: WsOutboundMessage<Data>,
    options: WsBroadcastOptions = {},
  ): number {
    let delivered = 0

    for (const [socketId, socket] of this.sockets.entries()) {
      if (socketId === options.excludeSocketId || socket.readyState !== WebSocket.OPEN) continue

      socket.send(JSON.stringify(message))
      delivered += 1
    }

    return delivered
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
    const server = this.wss
    if (!server) return

    for (const socket of this.sockets.values()) {
      socket.close()
    }

    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()))
    })
    this.sockets.clear()
    if (this.wss === server) this.wss = undefined
  }
}

import { HandlerMetadata } from './handler-metadata.interface'
import { LunaHandler } from './handler.interface'

/**
 * Base class for all Luna protocol adapters.
 *
 * An adapter bridges a communication protocol (HTTP, WebSocket, gRPC, GraphQL, etc.)
 * and the Luna handler system. Each adapter is responsible for:
 * - Receiving incoming messages from the protocol
 * - Translating them into `LunaMessage` instances
 * - Calling the appropriate `LunaHandler`
 * - Translating the handler response back to the protocol format
 *
 * @example
 * class ExpressAdapter extends AbstractAdapter {
 *   register(handler, metadata) { ... }
 *   async listen() { this.app.listen(3000) }
 *   async close() { this.server.close() }
 * }
 */
export abstract class AbstractAdapter {
  /**
   * Registers a handler with the adapter.
   *
   * Called once per handler during application bootstrap. The adapter uses
   * `metadata` to configure routing — e.g. HTTP method and path, WebSocket
   * event name, gRPC service/method, etc.
   *
   * @param handler - The handler instance to register.
   * @param metadata - Decorator-derived metadata describing how to route to this handler.
   */
  public abstract register(handler: LunaHandler, metadata: HandlerMetadata): void

  /**
   * Starts the adapter and begins accepting incoming messages.
   *
   * For HTTP this means starting the HTTP server. For WebSocket, opening the
   * socket. For CQRS, subscribing to the command bus. Etc.
   */
  public abstract listen(): Promise<void>

  /**
   * Gracefully shuts down the adapter, releasing all held resources.
   *
   * Called automatically when the application receives `SIGTERM` or `SIGINT`.
   */
  public abstract close(): Promise<void>
}
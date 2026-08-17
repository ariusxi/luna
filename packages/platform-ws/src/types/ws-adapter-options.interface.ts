import type { Server } from 'http'

/**
 * Configuration options for the {@link WsAdapter}.
 *
 * Provide either a standalone `port`, or a `server` to attach to an existing
 * HTTP server and share its port (the single-port setup required by hosts like
 * Render/Heroku). When `server` resolves to a server it takes precedence.
 */
export interface WsAdapterOptions {
  /**
   * TCP port for a standalone WebSocket server.
   *
   * Use `0` to let the OS assign a free port (useful in tests).
   * Retrieve the actual port with {@link WsAdapter.getPort}. Ignored when
   * `server` resolves to an HTTP server.
   */
  port?: number

  /**
   * Attach the WebSocket server to an existing HTTP server, sharing its port.
   *
   * A thunk resolved at {@link WsAdapter.listen} time, so it can return a server
   * that another adapter (e.g. `ExpressAdapter`) only opens once it starts.
   * Upgrades are handled on {@link WsAdapterOptions.path}.
   */
  server?: () => Server | undefined

  /**
   * Path the WebSocket upgrade is served on when sharing a `server`.
   *
   * Defaults to `/ws`. Ignored for a standalone `port` server.
   */
  path?: string
}

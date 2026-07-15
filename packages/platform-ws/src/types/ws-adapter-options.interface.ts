/**
 * Configuration options for the {@link WsAdapter}.
 */
export interface WsAdapterOptions {
  /**
   * TCP port to listen on.
   *
   * Use `0` to let the OS assign a free port (useful in tests).
   * Retrieve the actual port with {@link WsAdapter.getPort}.
   */
  port: number
}

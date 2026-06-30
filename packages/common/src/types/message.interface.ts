/**
 * The universal message contract passed to every handler regardless of protocol.
 *
 * Adapters are responsible for translating protocol-specific input
 * (HTTP request, WebSocket event, gRPC call, etc.) into a `LunaMessage`.
 *
 * @template T - The shape of the payload.
 *
 * @example
 * // HTTP adapter filling a LunaMessage
 * const message: LunaMessage = {
 *   context: 'http',
 *   payload: req.body,
 *   metadata: { method: req.method, path: req.path, headers: req.headers },
 * }
 */
export interface LunaMessage<T = unknown> {
  /** Protocol identifier — e.g. `'http'`, `'ws'`, `'grpc'`, `'graphql'`, `'cqrs'`. */
  context: string
  /** The message body. Shape is defined by the adapter and the handler. */
  payload: T
  /** Protocol-specific extras: headers, params, query string, socket id, etc. */
  metadata: Record<string, unknown>
}
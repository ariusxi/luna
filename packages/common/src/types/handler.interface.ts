import { LunaMessage } from './message.interface'

/**
 * The core handler contract. Any class that processes a `LunaMessage` and
 * returns a response must implement this interface.
 *
 * Handlers are protocol-agnostic — they never import from an adapter package.
 * The adapter resolves the handler from the DI container and calls `handle`.
 *
 * @template T - The expected payload type.
 * @template R - The response type.
 *
 * @example
 * class GetUsersHandler implements LunaHandler<void, User[]> {
 *   handle(message: LunaMessage<void>): User[] {
 *     return this.userService.findAll()
 *   }
 * }
 */
export interface LunaHandler<T = unknown, R = unknown> {
  /** Processes a `LunaMessage` and returns a response or a promise of one. */
  handle(message: LunaMessage<T>): Promise<R> | R
}
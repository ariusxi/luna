/**
 * Base class for all Luna HTTP exceptions.
 *
 * Throw any subclass from a handler and the `ExpressAdapter` will
 * automatically respond with the correct status code and message.
 *
 * Pass `details` to attach extra fields to the JSON error body — adapters merge
 * them alongside `statusCode` and `message` (e.g. a conflict that reports the
 * `currentVersion` the caller should resync to).
 *
 * @example
 * throw new NotFoundException('User not found')
 * throw new ConflictException('stale', { currentVersion: 7 })
 */
export abstract class HttpException extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

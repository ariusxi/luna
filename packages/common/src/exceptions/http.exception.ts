/**
 * Base class for all Luna HTTP exceptions.
 *
 * Throw any subclass from a handler and the `ExpressAdapter` will
 * automatically respond with the correct status code and message.
 *
 * @example
 * throw new NotFoundException('User not found')
 */
export abstract class HttpException extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

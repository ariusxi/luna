import { LunaMessage } from '../types/message.interface'

/**
 * Interface that all Luna exception filters must implement.
 *
 * A filter is the last stage of the request pipeline. It catches exceptions
 * thrown by guards, pipes, interceptors, or the handler itself and converts
 * them into a response value that the adapter sends to the client.
 *
 * Filters are matched by exception type via `@Catch`. If a filter wants to
 * control the HTTP status code it should throw an `HttpException` from within
 * `catch()` — the adapter's own error handling will map it to the right status.
 *
 * @template T - The exception type this filter handles. Defaults to `unknown`.
 *
 * @example
 * @Catch(DomainException)
 * @Injectable()
 * class DomainExceptionFilter implements LunaExceptionFilter<DomainException> {
 *   catch(exception: DomainException, message: LunaMessage) {
 *     throw new BadRequestException(exception.message)
 *   }
 * }
 */
export interface LunaExceptionFilter<T = unknown> {
  catch(exception: T, message: LunaMessage): unknown | Promise<unknown>
}

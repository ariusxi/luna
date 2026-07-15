export const CATCH_METADATA = 'luna:catch'

/**
 * Marks an exception filter class with the exception types it handles.
 *
 * When no types are provided the filter acts as a catch-all and handles every
 * unmatched exception.
 *
 * @param exceptions - The exception classes this filter should handle.
 *
 * @example
 * // handles a specific domain exception
 * @Catch(DomainException)
 * class DomainFilter implements LunaExceptionFilter<DomainException> { ... }
 *
 * @example
 * // catch-all filter
 * @Catch()
 * class GlobalFilter implements LunaExceptionFilter { ... }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Catch = (...exceptions: (abstract new (...args: any[]) => unknown)[]): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(CATCH_METADATA, exceptions, target)
  }
}

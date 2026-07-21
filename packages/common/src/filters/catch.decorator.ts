export const CATCH_METADATA = 'luna:catch'

/** Constructor type for exception classes that can be caught by `@Catch`. */
export type ExceptionConstructor = abstract new (...args: any[]) => unknown

/** Shape of the metadata stored by `@Catch` on a filter class. */
export interface CatchMetadata {
  exceptions: ExceptionConstructor[]
}

/**
 * Marks an exception filter class with the exception types it handles.
 *
 * When no types are provided the filter acts as a catch-all and handles every
 * unmatched exception.
 *
 * @param exceptions - The exception classes this filter should handle.
 *
 * @example
 * @Catch(DomainException)
 * class DomainFilter implements LunaExceptionFilter<DomainException> { ... }
 *
 * @example
 * @Catch()
 * class GlobalFilter implements LunaExceptionFilter { ... }
 */
export const Catch = (...exceptions: ExceptionConstructor[]): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(CATCH_METADATA, exceptions, target)
  }
}

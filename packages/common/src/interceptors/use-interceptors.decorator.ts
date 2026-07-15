import { LunaInterceptor } from './interceptor.interface'

export const USE_INTERCEPTORS_METADATA = 'luna:interceptors'

type ClassConstructor<T> = new (...args: unknown[]) => T

/**
 * Applies one or more interceptors to a controller class or a handler method.
 *
 * Interceptors execute after pipes and before the handler. They wrap the
 * handler call, giving you the chance to run logic before and after execution.
 *
 * @param interceptors - One or more interceptor classes to apply.
 *
 * @example
 * @UseInterceptors(LoggingInterceptor)
 * @Controller('users')
 * class UserController {
 *   @UseInterceptors(CacheInterceptor)
 *   @On('get', '/:id')
 *   findOne(message: LunaMessage) { ... }
 * }
 */
export const UseInterceptors = (...interceptors: ClassConstructor<LunaInterceptor>[]): ClassDecorator & MethodDecorator => {
  return (target: object, propertyKey?: string | symbol) => {
    if (propertyKey !== undefined) {
      Reflect.defineMetadata(USE_INTERCEPTORS_METADATA, interceptors, target, propertyKey)
    } else {
      Reflect.defineMetadata(USE_INTERCEPTORS_METADATA, interceptors, target)
    }
  }
}

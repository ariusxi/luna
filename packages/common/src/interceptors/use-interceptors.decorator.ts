import { ClassOrInstance } from '../types/class-or-instance.type'
import { LunaInterceptor } from './interceptor.interface'

export const USE_INTERCEPTORS_METADATA = 'luna:interceptors'

/**
 * Applies one or more interceptors to a controller class or a handler method.
 *
 * Each interceptor can be provided as a **class** (resolved from the DI
 * container, falling back to direct instantiation) or as a pre-built
 * **instance** (useful when the interceptor needs construction-time
 * configuration).
 *
 * Interceptors execute after pipes and before the handler. They wrap the
 * handler call via a `next()` function, giving you the chance to run logic
 * before and after handler execution — or to short-circuit the call entirely.
 *
 * @param interceptors - One or more interceptor classes or instances.
 *
 * @example
 * // class — resolved via DI
 * @UseInterceptors(LoggingInterceptor)
 * @Controller('posts')
 * class PostController {
 *   // instance — cache TTL configured at decoration time
 *   @UseInterceptors(new CacheInterceptor({ ttl: 60 }))
 *   @On('get', '/:id')
 *   findOne(message: LunaMessage) { ... }
 * }
 */
export const UseInterceptors = (...interceptors: ClassOrInstance<LunaInterceptor>[]): ClassDecorator & MethodDecorator => {
  return (target: object, propertyKey?: string | symbol) => {
    if (propertyKey !== undefined) {
      return Reflect.defineMetadata(USE_INTERCEPTORS_METADATA, interceptors, target, propertyKey)
    }
    Reflect.defineMetadata(USE_INTERCEPTORS_METADATA, interceptors, target)
  }
}

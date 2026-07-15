import { ClassOrInstance } from '../types/class-or-instance.type'
import { LunaExceptionFilter } from './filter.interface'

export const USE_FILTERS_METADATA = 'luna:filters'

/**
 * Applies one or more exception filters to a controller class or a handler method.
 *
 * Filters are the last stage of the pipeline. They run when an unhandled
 * exception is thrown and convert it into a response value.
 *
 * Each filter can be a **class** (resolved from DI, falls back to `new Class()`)
 * or a pre-built **instance** (used as-is).
 *
 * Filters are matched by exception type declared via `@Catch`. The first
 * matching filter wins. If no filter matches the exception is re-thrown and
 * the adapter's own error handling takes over.
 *
 * @param filters - One or more filter classes or instances.
 *
 * @example
 * @UseFilters(DomainExceptionFilter)
 * @Controller('users')
 * class UserController {
 *   @UseFilters(new NotFoundFilter('User'))
 *   @On('get', '/:id')
 *   findOne(message: LunaMessage) { ... }
 * }
 */
export const UseFilters = (...filters: ClassOrInstance<LunaExceptionFilter>[]): ClassDecorator & MethodDecorator => {
  return (target: object, propertyKey?: string | symbol) => {
    if (propertyKey !== undefined) {
      Reflect.defineMetadata(USE_FILTERS_METADATA, filters, target, propertyKey)
    } else {
      Reflect.defineMetadata(USE_FILTERS_METADATA, filters, target)
    }
  }
}

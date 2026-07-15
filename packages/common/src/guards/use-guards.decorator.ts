import { ClassOrInstance } from '../types/class-or-instance.type'
import { LunaGuard } from './guard.interface'

export const USE_GUARDS_METADATA = 'luna:guards'

/**
 * Applies one or more guards to a controller class or a handler method.
 *
 * Each guard can be provided as a **class** (resolved from the DI container,
 * falling back to direct instantiation) or as a pre-built **instance** (used
 * as-is, which allows passing configuration at decoration time).
 *
 * Guards are executed in declaration order. If any guard returns `false` the
 * handler is not called and a `GuardRejectionError` is thrown.
 *
 * @param guards - One or more guard classes or instances.
 *
 * @example
 * // class — resolved via DI
 * @UseGuards(AuthGuard)
 * @Controller('users')
 * class UserController {
 *   // stacked: controller guard runs first, then method guard
 *   @UseGuards(new RolesGuard('admin'))
 *   @On('delete', '/:id')
 *   remove(message: LunaMessage) { ... }
 * }
 */
export const UseGuards = (...guards: ClassOrInstance<LunaGuard>[]): ClassDecorator & MethodDecorator => {
  return (target: object, propertyKey?: string | symbol) => {
    if (propertyKey !== undefined) {
      Reflect.defineMetadata(USE_GUARDS_METADATA, guards, target, propertyKey)
    } else {
      Reflect.defineMetadata(USE_GUARDS_METADATA, guards, target)
    }
  }
}

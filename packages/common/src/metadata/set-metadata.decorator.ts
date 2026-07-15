/**
 * Attaches arbitrary metadata to a class or method under a custom key.
 *
 * Used together with `Reflector` inside guards, interceptors, or filters to
 * implement role-based access control, feature flags, rate-limit thresholds,
 * and similar cross-cutting concerns without coupling the middleware to
 * specific decorator names.
 *
 * @param key   - The metadata key.
 * @param value - The metadata value.
 *
 * @example
 * // define a shorthand helper
 * const Roles = (...roles: string[]) => SetMetadata('roles', roles)
 *
 * @Roles('admin', 'moderator')
 * @On('delete', '/:id')
 * remove(message: LunaMessage) { ... }
 *
 * // read inside a guard
 * @Injectable()
 * class RolesGuard implements LunaGuard {
 *   constructor(private readonly reflector: Reflector) {}
 *
 *   canActivate(message: LunaMessage): boolean {
 *     const roles = this.reflector.get<string[]>('roles', message)
 *     // ...
 *   }
 * }
 */
export const SetMetadata = (key: string, value: unknown): ClassDecorator & MethodDecorator => {
  return (target: object, propertyKey?: string | symbol) => {
    if (propertyKey !== undefined) {
      Reflect.defineMetadata(key, value, target, propertyKey)
    } else {
      Reflect.defineMetadata(key, value, target)
    }
  }
}

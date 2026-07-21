/** Shape of a metadata entry stored by `@SetMetadata`. */
export interface SetMetadataEntry<T = unknown> {
  key: string
  value: T
}

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
 * const Roles = (...roles: string[]) => SetMetadata('roles', roles)
 *
 * @Roles('admin', 'moderator')
 * @On('delete', '/:id')
 * remove(message: LunaMessage) { ... }
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

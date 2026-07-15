/**
 * Helper service for reading decorator metadata inside guards, interceptors,
 * and filters.
 *
 * Inject `Reflector` into any middleware class to read `@SetMetadata` values
 * from the handler class or method being processed.
 *
 * @example
 * @Injectable()
 * class RolesGuard implements LunaGuard {
 *   constructor(private readonly reflector: Reflector) {}
 *
 *   canActivate(message: LunaMessage): boolean {
 *     const roles = this.reflector.get<string[]>('roles', SomeController.prototype, 'someMethod')
 *     return roles?.includes('admin') ?? true
 *   }
 * }
 */
export class Reflector {
  /**
   * Reads metadata set by `@SetMetadata` from a class or method.
   *
   * @param key        - The metadata key.
   * @param target     - The class constructor or prototype.
   * @param propertyKey - The method name (omit to read class-level metadata).
   */
  get<T>(key: string, target: object, propertyKey?: string | symbol): T | undefined {
    if (propertyKey !== undefined) {
      return Reflect.getMetadata(key, target, propertyKey) as T | undefined
    }
    return Reflect.getMetadata(key, target) as T | undefined
  }

  /**
   * Reads metadata from a method and, if not found, falls back to the class.
   *
   * This is useful for decorators that can be applied at both levels, where the
   * method-level value should take precedence over the class-level one.
   *
   * @param key        - The metadata key.
   * @param target     - The class prototype.
   * @param propertyKey - The method name.
   */
  getWithFallback<T>(key: string, target: object, propertyKey: string | symbol): T | undefined {
    return (
      (Reflect.getMetadata(key, target, propertyKey) as T | undefined) ??
      (Reflect.getMetadata(key, (target as { constructor: object }).constructor) as T | undefined)
    )
  }

  /**
   * Reads the same metadata key from multiple targets and returns all
   * non-undefined values as an array.
   *
   * @param key     - The metadata key.
   * @param targets - Array of class constructors or prototypes to read from.
   */
  getAll<T>(key: string, targets: object[]): T[] {
    return targets
      .map((t) => Reflect.getMetadata(key, t) as T | undefined)
      .filter((v): v is T => v !== undefined)
  }
}

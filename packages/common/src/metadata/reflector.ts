export interface IReflector {
  get<T>(key: string, target: object, propertyKey?: string | symbol): T | undefined
  getWithFallback<T>(key: string, target: object, propertyKey: string | symbol): T | undefined
  getAll<T>(key: string, targets: object[]): T[]
}

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
export class Reflector implements IReflector {
  get<T>(key: string, target: object, propertyKey?: string | symbol): T | undefined {
    if (propertyKey !== undefined) {
      return Reflect.getMetadata(key, target, propertyKey) as T | undefined
    }
    return Reflect.getMetadata(key, target) as T | undefined
  }

  getWithFallback<T>(key: string, target: object, propertyKey: string | symbol): T | undefined {
    return (
      (Reflect.getMetadata(key, target, propertyKey) as T | undefined) ??
      (Reflect.getMetadata(key, (target as { constructor: object }).constructor) as T | undefined)
    )
  }

  getAll<T>(key: string, targets: object[]): T[] {
    return targets
      .map((t) => Reflect.getMetadata(key, t) as T | undefined)
      .filter((v): v is T => v !== undefined)
  }
}

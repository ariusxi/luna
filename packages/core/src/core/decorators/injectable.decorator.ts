import { InjectableProperties, ProviderScope } from '../types'

/**
 * Marks a class as a Luna provider, making it available for dependency injection.
 *
 * All classes used as providers must be decorated with `@Injectable`.
 * By default, providers are singletons — one instance is shared across the module.
 *
 * @param properties.scope - Controls how instances are created.
 *   - `ProviderScope.Singleton` (default) — one instance per module, shared on every resolve.
 *   - `ProviderScope.Transient` — a new instance is created on every resolve.
 *
 * @example
 * @Injectable()
 * export class UserService {}
 *
 * @example
 * @Injectable({ scope: ProviderScope.Transient })
 * export class RequestLogger {}
 */
export function Injectable(properties?: InjectableProperties): ClassDecorator {
  return (target) => {
    const scope = properties?.scope ?? ProviderScope.Singleton

    Reflect.defineMetadata('luna:injectable', true, target)
    Reflect.defineMetadata('luna:scope', scope, target)
  }
}

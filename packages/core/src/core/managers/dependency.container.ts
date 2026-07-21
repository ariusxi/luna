import { ClassConstructor, ClassProvider, FactoryProvider, ProviderDefinition, Token, ValueProvider } from '../types'
import { DependencyResolutionError } from '../handlers'
import { InstanceResolver } from './instance.resolver'

const isClassProvider = (p: ProviderDefinition): p is ClassProvider =>
  typeof p === 'object' && 'useClass' in p

const isFactoryProvider = (p: ProviderDefinition): p is FactoryProvider =>
  typeof p === 'object' && 'useFactory' in p

const isValueProvider = (p: ProviderDefinition): p is ValueProvider =>
  typeof p === 'object' && 'useValue' in p

const isCustomProvider = (p: ProviderDefinition): p is ClassProvider | FactoryProvider | ValueProvider =>
  'provide' in (p as object)

/**
 * IoC container for a single Luna module.
 *
 * Stores provider definitions and resolves them on demand, delegating instance
 * creation and caching to `InstanceResolver`.
 *
 * Consumers should not use this class directly — interact with the container
 * through `LunaApplication.get()` and `LunaApplication.inspect()`.
 */
export class DependencyContainer {
  private readonly providers = new Map<Token, ProviderDefinition>()
  private readonly resolver = new InstanceResolver()

  constructor(private readonly moduleClass: Function) {}

  /**
   * Registers a provider definition in this container.
   *
   * Supports class constructors decorated with `@Injectable`, as well as
   * `ClassProvider`, `FactoryProvider`, and `ValueProvider` objects.
   *
   * @throws {Error} If a plain class is passed that is not decorated with `@Injectable`.
   */
  public register(provider: ProviderDefinition): void {
    if ('when' in provider && typeof provider.when === 'function' && !provider.when()) return

    if (isCustomProvider(provider)) {
      this.providers.set(provider.provide, provider)
      return
    }

    const isInjectable = Reflect.getMetadata('luna:injectable', provider)
    if (!isInjectable) throw new Error(`${(provider as ClassConstructor).name} is not decorated with @Injectable.`)

    this.providers.set(provider, provider)
  }

  /** Returns the raw provider definition for `token`, or `undefined` if not registered. */
  public getProvider(token: Token): ProviderDefinition | undefined {
    return this.providers.get(token)
  }

  /**
   * Resolves a provider to a live instance.
   *
   * @throws {DependencyResolutionError} If the token is not registered.
   */
  public resolve<T>(token: Token, dependencyOf?: Token): T {
    if (!this.providers.has(token)) {
      throw new DependencyResolutionError(token, this.moduleClass, dependencyOf)
    }

    const provider = this.providers.get(token)!
    const resolve = (dep: Token, of?: Token) => this.resolve<unknown>(dep, of)

    if (isValueProvider(provider)) return this.resolver.resolveValue<T>(provider)
    if (isFactoryProvider(provider)) return this.resolver.resolveFactory<T>(token, provider, resolve)
    return this.resolver.resolveClass<T>(token, provider, resolve)
  }

  /** Returns all registered tokens in this container. */
  public getTokens(): Token[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Eagerly instantiates all non-lazy providers in registration order.
   * Called automatically during application bootstrap.
   */
  public boot(): void {
    for (const [token, provider] of this.providers) {
      if ('lazy' in provider && provider.lazy) continue
      this.resolve(token)
    }
  }

  /** Returns the dependency tree of a registered provider without instantiating anything. */
  public inspect(token: Token): object {
    const provider = this.providers.get(token)
    if (!provider) return { name: String(token), dependencies: [] }

    const Cls = isClassProvider(provider)
      ? provider.useClass
      : typeof provider === 'function'
        ? provider
        : null

    if (!Cls) return { name: String(token), dependencies: [] }

    const paramTypes: Function[] = Reflect.getMetadata('design:paramtypes', Cls) ?? []
    return {
      name: Cls.name,
      dependencies: paramTypes.map((dep) => this.inspect(dep as unknown as Token)),
    }
  }
}

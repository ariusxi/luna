import { ClassProvider, FactoryProvider, ProviderDefinition, ProviderScope, Token, ValueProvider } from '../types'
import { LifecycleManager } from './lifecycle.manager'
import { DependencyResolutionError } from '../handlers'

/**
 * IoC container for a single Luna module.
 *
 * Stores provider definitions and resolves them on demand, handling singleton
 * scoping, transient instantiation, value providers, and factory providers.
 * Lifecycle hooks are registered on every class instance that is created here.
 *
 * Consumers should not use this class directly — interact with the container
 * through `LunaApplication.get()` and `LunaApplication.inspect()`.
 */
export class DependencyContainer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly providers = new Map<Token, ProviderDefinition>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly instances = new Map<Token, any>()

  constructor(private readonly moduleClass: Function) {}

  private isClassProvider(provider: ProviderDefinition): provider is ClassProvider {
    return typeof provider === 'object' && 'useClass' in provider
  }

  private isFactoryProvider(provider: ProviderDefinition): provider is FactoryProvider {
    return typeof provider === 'object' && 'useFactory' in provider
  }

  private isValueProvider(provider: ProviderDefinition): provider is ValueProvider {
    return typeof provider === 'object' && 'useValue' in provider
  }

  /**
   * Registers a provider definition in this container.
   *
   * Supports class constructors decorated with `@Injectable`, as well as
   * `ClassProvider`, `FactoryProvider`, and `ValueProvider` objects.
   * Providers with a failing `when()` guard are silently skipped.
   *
   * @throws {Error} If a plain class is passed that is not decorated with `@Injectable`.
   */
  public register(provider: ProviderDefinition): void {
    if ('when' in provider && typeof provider.when === 'function' && !provider.when()) {
      return
    }

    if (this.isClassProvider(provider) || this.isFactoryProvider(provider) || this.isValueProvider(provider)) {
      this.providers.set(provider.provide, provider)
      return
    }

    const isInjectable = Reflect.getMetadata('luna:injectable', provider)
    if (!isInjectable) {
      throw new Error(`${provider.name} is not decorated with @Injectable.`)
    }
    this.providers.set(provider, provider)
  }

  /**
   * Returns the raw provider definition for `token`, or `undefined` if not
   * registered. Prefer `resolve()` to get a live instance.
   */
  public getProvider(token: Token): ProviderDefinition | undefined {
    return this.providers.get(token)
  }

  /**
   * Resolves a provider to a live instance.
   *
   * For singleton-scoped classes the same instance is returned on every call.
   * Transient classes produce a new instance each time. Factory and value
   * providers follow their own semantics.
   *
   * @param token        - The token to resolve.
   * @param dependencyOf - The token that triggered this resolution (used in error messages).
   * @throws {DependencyResolutionError} If the token is not registered.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public resolve<T>(token: Token, dependencyOf?: Token): T {
    if (!this.providers.has(token)) {
      throw new DependencyResolutionError(token, this.moduleClass, dependencyOf)
    }

    const existing = this.instances.get(token)
    const provider = this.providers.get(token)!

    if (this.isValueProvider(provider)) {
      return provider.useValue as T
    }

    if (this.isFactoryProvider(provider)) {
      if (existing) return existing

      const injections = provider.inject ?? []
      const dependencies = injections.map((dependency) => this.resolve(dependency, token))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance = (provider.useFactory as (...args: any[]) => T)(...dependencies)

      this.instances.set(token, instance)
      return instance
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Cls = this.isClassProvider(provider) ? provider.useClass : provider as new (...args: any[]) => T

    const scope = Reflect.getMetadata('luna:scope', Cls)
    if (existing && scope === ProviderScope.Singleton) return existing

    const injectTokens: Token[] = Reflect.getMetadata('luna:inject', Cls) ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dependencies: any[] = Reflect.getMetadata('design:paramtypes', Cls) ?? []
    const params = dependencies.map((dep, index: number) => this.resolve(injectTokens[index] ?? dep, token))

    const instance = new Cls(...params)
    LifecycleManager.registerInstance(instance)

    if (scope === ProviderScope.Singleton) {
      this.instances.set(token, instance)
    }

    return instance
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

  /**
   * Returns the dependency tree of a registered provider without instantiating anything.
   * Useful for debugging the injection graph.
   *
   * @param token - The token to inspect.
   */
  public inspect(token: Token): object {
    const provider = this.providers.get(token)
    if (!provider) return { name: String(token), dependencies: [] }

    const Cls = this.isClassProvider(provider)
      ? provider.useClass
      : typeof provider === 'function'
        ? provider
        : null

    if (!Cls) return { name: String(token), dependencies: [] }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dependencies: any[] = Reflect.getMetadata('design:paramtypes', Cls) ?? []
    return {
      name: Cls.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dependencies: dependencies.map((dep: any) => this.inspect(dep)),
    }
  }
}

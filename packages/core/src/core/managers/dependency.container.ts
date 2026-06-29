import { ClassProvider, FactoryProvider, ProviderDefinition, ProviderScope, Token, ValueProvider } from '../types'
import { LifecycleManager } from './lifecycle.manager'
import { DependencyResolutionError } from '../handlers'

export class DependencyContainer {
  private readonly providers = new Map<Token, ProviderDefinition>()
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

  public getProvider(token: Token): ProviderDefinition | undefined {
    return this.providers.get(token)
  }

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
      const instance = provider.useFactory(...dependencies)

      this.instances.set(token, instance)
      
      return instance
    }

    const Token = this.isClassProvider(provider) ? provider.useClass : provider as new (...args: any[]) => T

    const scope = Reflect.getMetadata('luna:scope', Token)
    if (existing && scope === ProviderScope.Singleton) return existing

    const injectTokens = Reflect.getMetadata('luna:inject', Token) ?? []
    const dependencies = Reflect.getMetadata('design:paramtypes', Token) ?? []
    const params = dependencies.map((dependency: any, index: number) => this.resolve(injectTokens[index] ?? dependency, token))

    const instance = new Token(...params)
    LifecycleManager.registerInstance(instance)

    if (scope === ProviderScope.Singleton) {
      this.instances.set(token, instance)
    }

    return instance
  }

  public boot(): void {
    for (const [token, provider] of this.providers) {
      if ('lazy' in provider && provider.lazy) continue
      this.resolve(token)
    }
  }

  public inspect(token: Token): object {
    const provider = this.providers.get(token)
    if (!provider) return { name: String(token), dependencies: [] }

    const Token = this.isClassProvider(provider)
      ? provider.useClass
      : typeof provider === 'function'
        ? provider
        : null

    if (!Token) return { name: String(token), dependencies: [] }

    const dependencies = Reflect.getMetadata('design:paramtypes', Token) ?? []
    return {
      name: Token.name,
      dependencies: dependencies.map((dep: any) => this.inspect(dep)),
    }
  }
}

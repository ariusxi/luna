import { ClassProvider, FactoryProvider, ProviderDefinition, ProviderScope, Token, ValueProvider } from "../types"
import { LifecycleManager } from "./lifecycle.manager"

function isClassProvider(provider: ProviderDefinition): provider is ClassProvider {
  return typeof provider === 'object' && 'useClass' in provider
}

function isFactoryProvider(provider: ProviderDefinition): provider is FactoryProvider {
  return typeof provider === 'object' && 'useFactory' in provider
}

function isValueProvider(provider: ProviderDefinition): provider is ValueProvider {
  return typeof provider === 'object' && 'useValue' in provider
}

export class DependencyContainer {
  private readonly providers = new Map<Token, ProviderDefinition>()
  private readonly instances = new Map<Token, any>()

  public register(provider: ProviderDefinition): void {
    if (isClassProvider(provider) || isFactoryProvider(provider) || isValueProvider(provider)) {
      this.providers.set(provider.provide, provider)
      return
    }

    const isInjectable = Reflect.getMetadata('luna:injectable', provider)
    if (!isInjectable) {
      throw new Error(`${provider.name} is not decorated with @Injectable.`)
    }
    this.providers.set(provider, provider)
  }

  public resolve<T>(token: Token): T {
    if (!this.providers.has(token)) {
      const name = typeof token === 'function' ? token.name : String(token)
      throw new Error(`${name} is not registered in the container.`)
    }

    const existing = this.instances.get(token)
    const provider = this.providers.get(token)!

    if (isValueProvider(provider)) {
      return provider.useValue as T
    }

    if (isFactoryProvider(provider)) {
      if (existing) return existing
      const deps = (provider.inject ?? []).map((dep) => this.resolve(dep))
      const instance = provider.useFactory(...deps)
      this.instances.set(token, instance)
      return instance
    }

    const Token = isClassProvider(provider) ? provider.useClass : provider as new (...args: any[]) => T

    const scope = Reflect.getMetadata('luna:scope', Token)
    if (existing && scope === ProviderScope.Singleton) return existing

    const injectTokens = Reflect.getMetadata('luna:inject', Token) ?? []


    const dependencies = Reflect.getMetadata('design:paramtypes', Token) ?? []
    const params = dependencies.map((dep: any, index: number) => this.resolve(injectTokens[index] ?? dep))

    const instance = new Token(...params)
    LifecycleManager.registerInstance(instance)

    if (scope === ProviderScope.Singleton) {
      this.instances.set(token, instance)
    }

    return instance
  }

  public boot(): void {
    for (const [token] of this.providers) {
      this.resolve(token)
    }
  }

  public inspect(token: Token): object {
    const provider = this.providers.get(token)
    if (!provider) return { name: String(token), dependencies: [] }

    const Token = isClassProvider(provider)
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

import { ClassConstructor, ClassProvider, FactoryProvider, ProviderDefinition, ProviderScope, Token, ValueProvider } from '../types'
import { LifecycleManager } from './lifecycle.manager'

export type ResolveCallback = (token: Token, dependencyOf?: Token) => unknown

/**
 * Manages the instance cache and performs the actual provider instantiation.
 *
 * Separated from `DependencyContainer` so that provider storage/retrieval
 * (`providers` map) and instance resolution (`instances` cache) are each
 * cohesive on their own.
 */
export class InstanceResolver {
  private readonly instances = new Map<Token, unknown>()

  resolveValue<T>(provider: ValueProvider): T {
    return provider.useValue as T
  }

  resolveFactory<T>(token: Token, provider: FactoryProvider, resolve: ResolveCallback): T {
    if (this.instances.has(token)) return this.instances.get(token) as T

    const dependencies = (provider.inject ?? []).map((dep) => resolve(dep, token))
    const instance = (provider.useFactory as (...args: unknown[]) => T)(...dependencies)

    this.instances.set(token, instance)
    return instance
  }

  resolveClass<T>(token: Token, provider: ClassProvider | ClassConstructor<T>, resolve: ResolveCallback): T {
    const Cls = 'useClass' in provider ? provider.useClass : provider as ClassConstructor<T>
    const scope = Reflect.getMetadata('luna:scope', Cls) as ProviderScope | undefined

    if (this.instances.has(token) && scope === ProviderScope.Singleton) {
      return this.instances.get(token) as T
    }

    const injectTokens: Token[] = Reflect.getMetadata('luna:inject', Cls) ?? []
    const paramTypes: Function[] = Reflect.getMetadata('design:paramtypes', Cls) ?? []
    const params = paramTypes.map((dep, index) =>
      resolve(injectTokens[index] ?? (dep as unknown as Token), token),
    )

    const instance = new Cls(...params)
    LifecycleManager.registerInstance(instance)

    if (scope === ProviderScope.Singleton) this.instances.set(token, instance)
    return instance
  }
}

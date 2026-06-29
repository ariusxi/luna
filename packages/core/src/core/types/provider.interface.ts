import { FactoryProvider, Token } from './module.interface'

export interface ProviderDefinitionFunction extends FactoryProvider {
  provide: symbol
  /** If true, the provider is not instantiated at boot time — only when first resolved. */
  lazy?: boolean
  /** If provided, the provider is only registered when this function returns true. */
  when?: () => boolean
}

export type InjectableToken = Token | ProviderDefinitionFunction

export interface ProviderDefinitionOptions<T> {
  /**
   * Tokens to inject into the factory function.
   * Accepts class constructors, string/symbol tokens, or other `defineProvider` results.
   *
   * @example
   * inject: [DbService, 'API_KEY', OtherFnProvider]
   */
  inject?: InjectableToken[]

  /** Factory function that receives the resolved dependencies and returns the provider value. */
  useFactory: (...args: any[]) => T

  /**
   * If true, the provider is not instantiated at boot time.
   * It will be created on the first `resolve` call.
   *
   * @example
   * lazy: true
   */
  lazy?: boolean

  /**
   * A condition function. The provider is only registered if this returns true.
   * Evaluated once at boot time.
   *
   * @example
   * when: () => process.env.NODE_ENV !== 'test'
   */
  when?: () => boolean
}

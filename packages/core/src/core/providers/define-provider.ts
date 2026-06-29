import { ProviderDefinitionOptions, ProviderDefinitionFunction, InjectableToken } from '../types'
import { Token } from '../types'

function normalizeToken(token: InjectableToken): Token {
  if (typeof token === 'object' && 'provide' in token) {
    return token.provide
  }
  return token as Token
}

/**
 * Defines a functional provider with an auto-generated Symbol token.
 *
 * Use this to declare providers as plain functions instead of classes.
 * The returned object can be placed directly in a module's `providers` array
 * and used as a token in `inject`.
 *
 * @param options.useFactory - Factory function that returns the provider value.
 * @param options.inject - Dependencies to inject into the factory (class, string, symbol, or another `defineProvider` result).
 * @param options.lazy - If true, the provider is not instantiated at boot time.
 * @param options.when - Condition function. Provider is only registered if it returns true.
 *
 * @example
 * const UserService = defineProvider({
 *   inject: [DbService],
 *   useFactory: (db) => ({
 *     getUsers: () => db.query('SELECT * FROM users'),
 *   }),
 * })
 *
 * @example
 * const DevLogger = defineProvider({
 *   when: () => process.env.NODE_ENV === 'development',
 *   useFactory: () => console,
 * })
 */
export const defineProvider = <T>(options: ProviderDefinitionOptions<T>): ProviderDefinitionFunction => ({
  provide: Symbol(),
  inject: options.inject?.map(normalizeToken),
  useFactory: options.useFactory,
  when: options.when,
  lazy: options.lazy,
})

/**
 * Composes multiple providers into a single functional provider.
 * A shorthand for `defineProvider` when the only concern is injecting dependencies into a factory.
 *
 * @param inject - Tokens to inject.
 * @param useFactory - Factory receiving the resolved dependencies.
 *
 * @example
 * const UserService = composeProviders(
 *   [DbService, CacheService],
 *   (db, cache) => createUserService(db, cache),
 * )
 */
export const composeProviders = <T>(
  inject: InjectableToken[],
  useFactory: (...args: any[]) => T,
): ProviderDefinitionFunction => defineProvider({
  inject,
  useFactory,
})

import { ProviderDefinitionOptions, ProviderDefinitionFunction, InjectableToken } from '../types'
import { Token } from '../types'

function normalizeToken(token: InjectableToken): Token {
  if (typeof token === 'object' && 'provide' in token) {
    return token.provide
  }
  return token as Token
}

export const defineProvider = <T>(options: ProviderDefinitionOptions<T>): ProviderDefinitionFunction => ({
  provide: Symbol(),
  inject: options.inject?.map(normalizeToken),
  useFactory: options.useFactory,
})

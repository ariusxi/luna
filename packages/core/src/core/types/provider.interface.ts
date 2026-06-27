import { FactoryProvider, Token } from './module.interface'

export interface ProviderDefinitionFunction extends FactoryProvider {
  provide: symbol
}

export type InjectableToken = Token | ProviderDefinitionFunction

export interface ProviderDefinitionOptions<T> {
  inject?: InjectableToken[]
  useFactory: (...args: any[]) => T
}
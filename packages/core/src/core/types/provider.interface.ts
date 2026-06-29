import { FactoryProvider, Token } from './module.interface'

export interface ProviderDefinitionFunction extends FactoryProvider {
  provide: symbol
  lazy?: boolean
  when?: () => boolean
}

export type InjectableToken = Token | ProviderDefinitionFunction

export interface ProviderDefinitionOptions<T> {
  lazy?: boolean
  inject?: InjectableToken[]
  useFactory: (...args: any[]) => T
  when?: () => boolean
}
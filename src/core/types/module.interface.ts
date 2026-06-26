import { DependencyContainer } from "../managers/dependency.container"

export enum ProviderScope {
  Singleton = 'singleton',
  Transient = 'transient',
}

export interface InjectableProperties {
  scope: ProviderScope
}

export type ClassConstructor<T = any> = new (...args: any[]) => T

export type Token = string | symbol | ClassConstructor

export type Provider = ClassConstructor

export interface BaseProvider {
  provide: Token
  inject?: Token[]
}

export interface ClassProvider extends BaseProvider {
  useClass: ClassConstructor
}

export interface FactoryProvider extends BaseProvider {
  useFactory: (...args: any[]) => any
  inject?: Token[]
}

export interface ValueProvider<T = any> extends BaseProvider {
  useValue: T
}

export type ProviderDefinition =
  | Provider
  | ClassProvider
  | FactoryProvider
  | ValueProvider

export interface ModuleProperties {
  imports?: Function[]
  providers?: ProviderDefinition[]
  exports?: Token[]
}

export interface ModuleContext {
  container: DependencyContainer
  exports: Token[]
}

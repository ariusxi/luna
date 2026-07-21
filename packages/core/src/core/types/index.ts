export enum ProviderScope {
  Singleton = 'singleton',
  Transient = 'transient',
}

export interface InjectableProperties {
  scope: ProviderScope
}

export type ClassConstructor<T = any> = new (...args: any[]) => T

/** A provider token — can be a string, symbol, or a class constructor. */
export type Token = string | symbol | ClassConstructor

export type Provider = ClassConstructor

export interface BaseProvider {
  /** The token used to identify this provider in the container. */
  provide: Token
  inject?: Token[]
}

/**
 * Registers a class under a custom token.
 *
 * @example
 * { provide: 'UserRepo', useClass: PostgresUserRepo }
 */
export interface ClassProvider extends BaseProvider {
  useClass: ClassConstructor
}

/**
 * Registers the return value of a factory function as a factory function.
 * Use `inject` to pass dependencies to the factory.
 *
 * @example
 * { provide: 'Config', useFactory: (db: Db) => new Config(db), inject: [Db] }
 */
export interface FactoryProvider extends BaseProvider {
  useFactory: (...args: any[]) => any
  inject?: Token[]
}

/**
 * Registers a static value as a provider.
 *
 * @example
 * { provide: 'API_KEY', useValue: process.env.API_KEY }
 */
export interface ValueProvider<T = any> extends BaseProvider {
  useValue: T
}

export type ProviderDefinition =
  | Provider
  | ClassProvider
  | FactoryProvider
  | ValueProvider

export interface ModuleProperties {
  /**
   * Other modules whose exported providers should be available in this module.
   *
   * @example
   * imports: [DatabaseModule]
   */
  imports?: Function[]

  /**
   * Classes or custom provider definitions that belong to this module.
   * All entries are instantiated at boot time (eager loading).
   *
   * @example
   * providers: [UserService, { provide: 'API_KEY', useValue: '123' }]
   */
  providers?: ProviderDefinition[]

  /**
   * Tokens that should be visible to modules that import this module.
   * Only providers listed here are accessible outside this module.
   *
   * @example
   * exports: [UserService, 'API_KEY']
   */
  exports?: Token[]
}

export interface IContainer {
  register(provider: ProviderDefinition): void
  getProvider(token: Token): ProviderDefinition | undefined
  resolve<T>(token: Token, dependencyOf?: Token): T
  getTokens(): Token[]
  boot(): void
  inspect(token: Token): object
}

export interface ModuleContext {
  container: IContainer
  exports: Token[]
}

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

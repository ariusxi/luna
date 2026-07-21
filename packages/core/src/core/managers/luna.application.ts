import { ModuleContext, Token } from '../types'
import { LifecycleManager } from './lifecycle.manager'

/**
 * The running application instance returned by `LunaFactory.create()`.
 *
 * Provides access to the DI container for resolving providers, and manages
 * the application lifecycle (startup hooks, graceful shutdown on OS signals).
 *
 * In most cases you will not use `LunaApplication` from `@lunafw/core` directly.
 * `@lunafw/common`'s `LunaFactory.createApplication()` wraps it and adds adapter
 * management, returning its own `LunaApplication` that exposes `start()` and `close()`.
 */
export class LunaApplication {
  constructor(
    private readonly contexts: Map<Function, ModuleContext>,
    private readonly rootModule: Function,
  ) {}

  /**
   * Starts the application.
   *
   * Executes lifecycle hooks in order:
   * 1. `onModuleInit` — called on every provider that defines it, after all modules are set up.
   * 2. `onApplicationBootstrap` — called after all `onModuleInit` hooks have completed.
   *
   * Also registers OS signal handlers (`SIGTERM`, `SIGINT`) for graceful shutdown,
   * which trigger `onModuleDestroy`, `beforeApplicationShutdown`, and `onApplicationShutdown`
   * in that order.
   *
   * @example
   * const app = await LunaFactory.create(AppModule)
   * await app.start()
   */
  public async start(): Promise<void> {
    await LifecycleManager.executeLifecycleMethod('onModuleInit')
    await LifecycleManager.executeLifecycleMethod('onApplicationBootstrap')

    const onShutdown = async () => {
      await LifecycleManager.executeLifecycleMethod('onModuleDestroy')
      await LifecycleManager.executeLifecycleMethod('beforeApplicationShutdown')
      await LifecycleManager.executeLifecycleMethod('onApplicationShutdown')
    }

    const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT']
    SHUTDOWN_SIGNALS.forEach((signal) => process.on(signal, onShutdown))
  }

  /**
   * Retrieves a provider instance from the root module's container.
   *
   * The token must match what was used in `providers` — either a class directly
   * or the `provide` value of a custom provider.
   *
   * @param token - The class or string/symbol token to resolve.
   *
   * @example
   * const userService = app.get(UserService)
   * const apiKey = app.get<string>('API_KEY')
   */
  public get<T>(token: Token): T {
    const context = this.contexts.get(this.rootModule)!
    return context.container.resolve<T>(token)
  }

  /**
   * Resolves a token by searching all module contexts in registration order.
   *
   * Unlike `get()`, which enforces module-boundary isolation by only searching
   * the root module, this method is used internally during controller discovery
   * to instantiate controllers that live in non-root modules.
   *
   * @internal
   */
  public resolveFromAny<T>(token: Token): T {
    for (const context of this.contexts.values()) {
      if (context.container.getTokens().includes(token)) {
        return context.container.resolve<T>(token)
      }
    }
    const root = this.contexts.get(this.rootModule)!
    return root.container.resolve<T>(token)
  }

  /**
   * Returns all registered tokens in the root module's container.
   *
   * Used by `@lunafw/common` to scan for controllers and register handlers
   * with protocol adapters during application bootstrap.
   */
  public getTokens(): Token[] {
    const context = this.contexts.get(this.rootModule)!
    return context.container.getTokens()
  }

  /**
   * Returns all registered tokens across every module in the application.
   *
   * Unlike `getTokens()`, which is scoped to the root module, this method
   * walks all module contexts so controllers defined in child modules are
   * discovered during handler registration.
   */
  public getAllTokens(): Token[] {
    const seen = new Set<Token>()
    for (const context of this.contexts.values()) {
      for (const token of context.container.getTokens()) {
        seen.add(token)
      }
    }
    return [...seen]
  }

  /**
   * Returns the dependency tree of a provider without instantiating anything.
   * Useful for debugging the injection graph.
   *
   * @param token - The class or token to inspect.
   *
   * @example
   * console.log(JSON.stringify(app.inspect(UserController), null, 2))
   */
  public inspect(token: Token): object {
    const context = this.contexts.get(this.rootModule)!
    return context.container.inspect(token)
  }
}

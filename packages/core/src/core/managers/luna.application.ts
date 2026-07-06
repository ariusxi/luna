import { ModuleContext, Token } from '../types'
import { LifecycleManager } from './lifecycle.manager'

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

    const APPLICATION_EVENTS = ['SIGTERM', 'SIGINT']
    APPLICATION_EVENTS.forEach((event) => process.on(event, async () => {
      await LifecycleManager.executeLifecycleMethod('onModuleDestroy')
      await LifecycleManager.executeLifecycleMethod('beforeApplicationShutdown')
      await LifecycleManager.executeLifecycleMethod('onApplicationShutdown')
    }))
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

  public get<T>(token: Token): T {
    const context = this.contexts.get(this.rootModule)!
    return context.container.resolve<T>(token)
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

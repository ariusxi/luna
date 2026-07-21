import { LunaApplication as CoreApplication } from '@lunafw/core'

import { CONTROLLER_METADATA } from '../decorators/controller.decorator'
import { ON_METADATA } from '../decorators/on.decorator'
import { LunaExceptionFilter } from '../filters/filter.interface'
import { LunaGuard } from '../guards'
import { LunaInterceptor } from '../interceptors'
import { LunaPipe } from '../pipes'
import { AbstractAdapter, ClassConstructor, ClassOrInstance, HandlerMetadata, LunaMessage } from '../types'
import { MiddlewareRegistry } from './middleware.registry'

/**
 * The running Luna application instance returned by `LunaFactory.createApplication`.
 *
 * Wraps the core application (DI + lifecycle hooks) and manages the lifecycle
 * of all registered protocol adapters.
 *
 * Call `useGlobal*` methods before `start()` to apply middleware to every
 * route in the application.
 */
export class LunaApplication {
  private readonly middlewareRegistry: MiddlewareRegistry

  constructor(
    private readonly core: CoreApplication,
    private readonly adapters: AbstractAdapter[],
  ) {
    this.middlewareRegistry = new MiddlewareRegistry((items) => this.resolve(items))
  }

  /**
   * Starts the application.
   *
   * Scans all registered providers for controllers, registers their handlers
   * with each adapter, executes core lifecycle hooks, and starts all adapters.
   *
   * @example
   * const app = await LunaFactory.createApplication(AppModule, new ExpressAdapter({ port: 3000 }))
   * await app.start()
   */
  public async start(): Promise<void> {
    this.registerControllers()
    await this.core.start()
    for (const adapter of this.adapters) {
      await adapter.listen()
    }
  }

  /**
   * Gracefully shuts down the application.
   *
   * Calls `close` on every registered adapter, releasing their resources
   * (closing HTTP servers, WebSocket connections, etc.).
   */
  public async close(): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.close()
    }
  }

  /**
   * Registers one or more guards that run on every route in the application.
   * Global guards execute before controller- and method-level guards.
   *
   * Must be called before `start()`.
   *
   * @example
   * const app = await LunaFactory.createApplication(AppModule, adapter)
   * app.useGlobalGuards(new AuthGuard())
   * await app.start()
   */
  public useGlobalGuards(...guards: ClassOrInstance<LunaGuard>[]): this {
    this.middlewareRegistry.addGuards(...guards)
    return this
  }

  /**
   * Registers one or more pipes that run on every route in the application.
   * Global pipes execute before controller- and method-level pipes.
   *
   * Must be called before `start()`.
   */
  public useGlobalPipes(...pipes: ClassOrInstance<LunaPipe>[]): this {
    this.middlewareRegistry.addPipes(...pipes)
    return this
  }

  /**
   * Registers one or more interceptors that run on every route in the
   * application. Global interceptors are the outermost layer of the chain.
   *
   * Must be called before `start()`.
   */
  public useGlobalInterceptors(...interceptors: ClassOrInstance<LunaInterceptor>[]): this {
    this.middlewareRegistry.addInterceptors(...interceptors)
    return this
  }

  /**
   * Registers one or more exception filters that run on every route in the
   * application when an unhandled exception escapes the handler chain.
   *
   * Must be called before `start()`.
   */
  public useGlobalFilters(...filters: ClassOrInstance<LunaExceptionFilter>[]): this {
    this.middlewareRegistry.addFilters(...filters)
    return this
  }

  /**
   * Resolves a list of `ClassOrInstance` values into live instances.
   *
   * - **Instance** — returned as-is; no DI lookup or instantiation.
   * - **Class** — resolved from the DI container; falls back to `new Class()`
   *   when the class is not registered as a provider.
   */
  private resolve<T>(items: ClassOrInstance<T>[]): T[] {
    return items.map((item) => {
      if (typeof item === 'function') {
        const Cls = item as ClassConstructor<T>
        try {
          return this.core.get<T>(Cls)
        } catch {
          return new Cls()
        }
      }
      return item as T
    })
  }

  /**
   * Scans all DI tokens for `@Controller`-decorated classes, reads their `@On`
   * handler methods, collects guard/pipe/interceptor/filter metadata, and
   * registers one `LunaHandler` per method on every adapter.
   */
  private registerControllers(): void {
    const tokens = this.core.getAllTokens()

    for (const token of tokens) {
      if (typeof token !== 'function') continue

      const prefix = Reflect.getMetadata(CONTROLLER_METADATA, token)
      if (prefix === undefined) continue

      const instance = this.core.resolveFromAny<Record<string, (...args: unknown[]) => unknown>>(token)
      const prototype = Object.getPrototypeOf(instance) as object

      for (const methodName of Object.getOwnPropertyNames(prototype)) {
        const onMetadata = Reflect.getMetadata(ON_METADATA, prototype, methodName) as
          | { event: string; path: string }
          | undefined
        if (!onMetadata) continue

        const middleware = this.middlewareRegistry.collect(token, prototype, methodName)

        const handlerMetadata: HandlerMetadata = {
          event: onMetadata.event,
          prefix,
          path: onMetadata.path,
        }

        const handler = this.middlewareRegistry.buildHandler(
          instance,
          methodName,
          prototype,
          middleware,
          handlerMetadata,
        )

        for (const adapter of this.adapters) {
          adapter.register(handler, handlerMetadata)
        }
      }
    }
  }
}

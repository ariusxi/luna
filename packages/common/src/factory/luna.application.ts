import { LunaApplication as CoreApplication } from '@lunafw/core'

import { CONTROLLER_METADATA } from '../decorators/controller.decorator'
import { ON_METADATA } from '../decorators/on.decorator'
import { CATCH_METADATA } from '../filters/catch.decorator'
import { LunaExceptionFilter, } from '../filters/filter.interface'
import { USE_FILTERS_METADATA } from '../filters/use-filters.decorator'
import { GuardRejectionError, LunaGuard, USE_GUARDS_METADATA } from '../guards'
import { LunaExecutionContext, LunaInterceptor, USE_INTERCEPTORS_METADATA } from '../interceptors'
import { PARAM_METADATA, ParamMetadata, resolveParams } from '../params/param.decorator'
import { LunaPipe, USE_PIPES_METADATA } from '../pipes'
import { AbstractAdapter, ClassConstructor, ClassOrInstance, HandlerMetadata, LunaHandler, LunaMessage } from '../types'

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
  private globalGuards: ClassOrInstance<LunaGuard>[] = []
  private globalPipes: ClassOrInstance<LunaPipe>[] = []
  private globalInterceptors: ClassOrInstance<LunaInterceptor>[] = []
  private globalFilters: ClassOrInstance<LunaExceptionFilter>[] = []

  constructor(
    private readonly core: CoreApplication,
    private readonly adapters: AbstractAdapter[],
  ) {}

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
    this.globalGuards.push(...guards)
    return this
  }

  /**
   * Registers one or more pipes that run on every route in the application.
   * Global pipes execute before controller- and method-level pipes.
   *
   * Must be called before `start()`.
   */
  public useGlobalPipes(...pipes: ClassOrInstance<LunaPipe>[]): this {
    this.globalPipes.push(...pipes)
    return this
  }

  /**
   * Registers one or more interceptors that run on every route in the
   * application. Global interceptors are the outermost layer of the chain.
   *
   * Must be called before `start()`.
   */
  public useGlobalInterceptors(...interceptors: ClassOrInstance<LunaInterceptor>[]): this {
    this.globalInterceptors.push(...interceptors)
    return this
  }

  /**
   * Registers one or more exception filters that run on every route in the
   * application when an unhandled exception escapes the handler chain.
   *
   * Must be called before `start()`.
   */
  public useGlobalFilters(...filters: ClassOrInstance<LunaExceptionFilter>[]): this {
    this.globalFilters.push(...filters)
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
   * Finds the first filter in `filters` whose `@Catch` metadata matches the
   * given exception, then calls `filter.catch()`. Returns the filter's return
   * value if handled, or re-throws the original exception if no filter matches.
   */
  private async runFilters(
    exception: unknown,
    message: LunaMessage,
    filters: LunaExceptionFilter[],
  ): Promise<unknown> {
    for (const filter of filters) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const caughtTypes: (abstract new (...args: any[]) => unknown)[] =
        Reflect.getMetadata(CATCH_METADATA, filter.constructor) ?? []

      const matches =
        caughtTypes.length === 0 ||
        caughtTypes.some((ExType) => exception instanceof ExType)

      if (matches) {
        return filter.catch(exception, message)
      }
    }
    throw exception
  }

  /**
   * Builds a `LunaHandler` that runs the full middleware pipeline for one
   * controller method:
   *
   * ```
   * Guards → Pipes → Interceptors → Handler (with param extraction)
   *                                          ↑ Filters wrap everything
   * ```
   */
  private buildHandler(
    instance: Record<string, (...args: unknown[]) => unknown>,
    methodName: string,
    prototype: object,
    controllerGuards: ClassOrInstance<LunaGuard>[],
    methodGuards: ClassOrInstance<LunaGuard>[],
    controllerPipes: ClassOrInstance<LunaPipe>[],
    methodPipes: ClassOrInstance<LunaPipe>[],
    controllerInterceptors: ClassOrInstance<LunaInterceptor>[],
    methodInterceptors: ClassOrInstance<LunaInterceptor>[],
    controllerFilters: ClassOrInstance<LunaExceptionFilter>[],
    methodFilters: ClassOrInstance<LunaExceptionFilter>[],
  ): LunaHandler {
    const guards = this.resolve<LunaGuard>([...this.globalGuards, ...controllerGuards, ...methodGuards])
    const pipes = this.resolve<LunaPipe>([...this.globalPipes, ...controllerPipes, ...methodPipes])
    const interceptors = this.resolve<LunaInterceptor>([...this.globalInterceptors, ...controllerInterceptors, ...methodInterceptors])
    const filters = this.resolve<LunaExceptionFilter>([...methodFilters, ...controllerFilters, ...this.globalFilters])

    const paramsMeta: ParamMetadata[] =
      Reflect.getMetadata(PARAM_METADATA, prototype, methodName) ?? []

    return {
      handle: async (message: LunaMessage) => {
        try {
          for (const guard of guards) {
            const allowed = await guard.canActivate(message)
            if (!allowed) throw new GuardRejectionError()
          }

          let transformedMessage = message
          for (const pipe of pipes) {
            transformedMessage = await pipe.transform(transformedMessage)
          }

          const context: LunaExecutionContext = {
            getMessage: () => transformedMessage,
            getHandler: () => methodName,
          }

          const chain = interceptors.reduceRight<() => Promise<unknown>>(
            (next, interceptor) => () => interceptor.intercept(context, next),
            async () => {
              const args = resolveParams(transformedMessage, paramsMeta)
              return instance[methodName](...args)
            },
          )

          return await chain()
        } catch (error) {
          return this.runFilters(error, message, filters)
        }
      },
    }
  }

  /**
   * Scans all DI tokens for `@Controller`-decorated classes, reads their `@On`
   * handler methods, collects guard/pipe/interceptor/filter metadata, and
   * registers one `LunaHandler` per method on every adapter.
   */
  private registerControllers(): void {
    const tokens = this.core.getTokens()

    for (const token of tokens) {
      if (typeof token !== 'function') continue

      const prefix = Reflect.getMetadata(CONTROLLER_METADATA, token)
      if (prefix === undefined) continue

      const instance = this.core.get<Record<string, (...args: unknown[]) => unknown>>(token)
      const prototype = Object.getPrototypeOf(instance) as object

      const controllerGuards: ClassOrInstance<LunaGuard>[] = Reflect.getMetadata(USE_GUARDS_METADATA, token) ?? []
      const controllerPipes: ClassOrInstance<LunaPipe>[] = Reflect.getMetadata(USE_PIPES_METADATA, token) ?? []
      const controllerInterceptors: ClassOrInstance<LunaInterceptor>[] = Reflect.getMetadata(USE_INTERCEPTORS_METADATA, token) ?? []
      const controllerFilters: ClassOrInstance<LunaExceptionFilter>[] = Reflect.getMetadata(USE_FILTERS_METADATA, token) ?? []

      for (const methodName of Object.getOwnPropertyNames(prototype)) {
        const onMetadata = Reflect.getMetadata(ON_METADATA, prototype, methodName) as
          | { event: string; path: string }
          | undefined
        if (!onMetadata) continue

        const methodGuards: ClassOrInstance<LunaGuard>[] = Reflect.getMetadata(USE_GUARDS_METADATA, prototype, methodName) ?? []
        const methodPipes: ClassOrInstance<LunaPipe>[] = Reflect.getMetadata(USE_PIPES_METADATA, prototype, methodName) ?? []
        const methodInterceptors: ClassOrInstance<LunaInterceptor>[] = Reflect.getMetadata(USE_INTERCEPTORS_METADATA, prototype, methodName) ?? []
        const methodFilters: ClassOrInstance<LunaExceptionFilter>[] = Reflect.getMetadata(USE_FILTERS_METADATA, prototype, methodName) ?? []

        const metadata: HandlerMetadata = {
          event: onMetadata.event,
          prefix,
          path: onMetadata.path,
        }

        const handler = this.buildHandler(
          instance,
          methodName,
          prototype,
          controllerGuards,
          methodGuards,
          controllerPipes,
          methodPipes,
          controllerInterceptors,
          methodInterceptors,
          controllerFilters,
          methodFilters,
        )

        for (const adapter of this.adapters) {
          adapter.register(handler, metadata)
        }
      }
    }
  }
}

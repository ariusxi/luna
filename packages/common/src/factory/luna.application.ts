import { LunaApplication as CoreApplication } from '@lunafw/core'

import { CONTROLLER_METADATA } from '../decorators/controller.decorator'
import { ON_METADATA } from '../decorators/on.decorator'
import { GuardRejectionError, LunaGuard, USE_GUARDS_METADATA } from '../guards'
import { LunaExecutionContext, LunaInterceptor, USE_INTERCEPTORS_METADATA } from '../interceptors'
import { LunaPipe, USE_PIPES_METADATA } from '../pipes'
import { AbstractAdapter, HandlerMetadata, LunaHandler, LunaMessage } from '../types'

type ClassConstructor<T> = new (...args: unknown[]) => T

/**
 * The running Luna application instance returned by `LunaFactory.createApplication`.
 *
 * Wraps the core application (DI + lifecycle hooks) and manages the lifecycle
 * of all registered protocol adapters.
 */
export class LunaApplication {
  constructor(
    private readonly core: CoreApplication,
    private readonly adapters: AbstractAdapter[],
  ) { }

  /**
   * Starts the application.
   *
   * Scans all registered providers for controllers, registers their handlers
   * with each adapter, executes core lifecycle hooks, and starts all adapters.
   *
   * @example
   * const app = await LunaFactory.createApplication(AppModule, new HttpAdapter({ port: 3000 }))
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

  private resolve<T>(classes: ClassConstructor<T>[]): T[] {
    return classes.map((Cls) => {
      try {
        return this.core.get<T>(Cls)
      } catch {
        return new Cls()
      }
    })
  }

  private buildHandler(
    instance: Record<string, (message: LunaMessage) => unknown>,
    methodName: string,
    controllerGuards: ClassConstructor<LunaGuard>[],
    methodGuards: ClassConstructor<LunaGuard>[],
    controllerPipes: ClassConstructor<LunaPipe>[],
    methodPipes: ClassConstructor<LunaPipe>[],
    controllerInterceptors: ClassConstructor<LunaInterceptor>[],
    methodInterceptors: ClassConstructor<LunaInterceptor>[],
  ): LunaHandler {
    const guards = this.resolve<LunaGuard>([...controllerGuards, ...methodGuards])
    const pipes = this.resolve<LunaPipe>([...controllerPipes, ...methodPipes])
    const interceptors = this.resolve<LunaInterceptor>([...controllerInterceptors, ...methodInterceptors])

    return {
      handle: async (message: LunaMessage) => {
        for (const guard of guards) {
          const allowed = await guard.canActivate(message)
          if (!allowed) {
            throw new GuardRejectionError()
          }
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
          () => Promise.resolve(instance[methodName](transformedMessage)),
        )

        return chain()
      },
    }
  }

  private registerControllers(): void {
    const tokens = this.core.getTokens()

    for (const token of tokens) {
      if (typeof token !== 'function') continue

      const prefix = Reflect.getMetadata(CONTROLLER_METADATA, token)
      if (prefix === undefined) continue

      const instance = this.core.get<Record<string, (message: LunaMessage) => unknown>>(token)
      const prototype = Object.getPrototypeOf(instance) as object

      const controllerGuards: ClassConstructor<LunaGuard>[] =
        Reflect.getMetadata(USE_GUARDS_METADATA, token) ?? []
      const controllerPipes: ClassConstructor<LunaPipe>[] =
        Reflect.getMetadata(USE_PIPES_METADATA, token) ?? []
      const controllerInterceptors: ClassConstructor<LunaInterceptor>[] =
        Reflect.getMetadata(USE_INTERCEPTORS_METADATA, token) ?? []

      for (const methodName of Object.getOwnPropertyNames(prototype)) {
        const onMetadata = Reflect.getMetadata(ON_METADATA, prototype, methodName) as { event: string; path: string } | undefined
        if (!onMetadata) continue

        const methodGuards: ClassConstructor<LunaGuard>[] =
          Reflect.getMetadata(USE_GUARDS_METADATA, prototype, methodName) ?? []
        const methodPipes: ClassConstructor<LunaPipe>[] =
          Reflect.getMetadata(USE_PIPES_METADATA, prototype, methodName) ?? []
        const methodInterceptors: ClassConstructor<LunaInterceptor>[] =
          Reflect.getMetadata(USE_INTERCEPTORS_METADATA, prototype, methodName) ?? []

        const metadata: HandlerMetadata = {
          event: onMetadata.event,
          prefix,
          path: onMetadata.path,
        }

        const handler = this.buildHandler(
          instance,
          methodName,
          controllerGuards,
          methodGuards,
          controllerPipes,
          methodPipes,
          controllerInterceptors,
          methodInterceptors,
        )

        for (const adapter of this.adapters) {
          adapter.register(handler, metadata)
        }
      }
    }
  }
}

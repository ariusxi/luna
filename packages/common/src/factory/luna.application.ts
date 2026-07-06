import { LunaApplication as CoreApplication } from '@lunafw/core'

import { CONTROLLER_METADATA } from '../decorators/controller.decorator'
import { ON_METADATA } from '../decorators/on.decorator'
import { AbstractAdapter, HandlerMetadata, LunaHandler, LunaMessage } from '../types'

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

  private registerControllers(): void {
    const tokens = this.core.getTokens()

    for (const token of tokens) {
      if (typeof token !== 'function') continue

      const prefix = Reflect.getMetadata(CONTROLLER_METADATA, token)
      if (prefix === undefined) continue

      const instance = this.core.get<Record<string, (message: LunaMessage) => unknown>>(token)
      const prototype = Object.getPrototypeOf(instance) as object

      for (const methodName of Object.getOwnPropertyNames(prototype)) {
        const onMetadata = Reflect.getMetadata(ON_METADATA, prototype, methodName) as { event: string; path: string } | undefined
        if (!onMetadata) continue

        const metadata: HandlerMetadata = {
          event: onMetadata.event,
          prefix,
          path: onMetadata.path,
        }

        const handler: LunaHandler = {
          handle: (message: LunaMessage) => instance[methodName](message),
        }

        for (const adapter of this.adapters) {
          adapter.register(handler, metadata)
        }
      }
    }
  }
}

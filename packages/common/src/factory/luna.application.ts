import { LunaApplication as CoreApplication } from '@lunafw/core'

import { AbstractAdapter } from '../types'

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
   * Executes core lifecycle hooks (`onModuleInit`, `onApplicationBootstrap`)
   * and then calls `listen` on every registered adapter.
   *
   * @example
   * const app = await LunaFactory.createApplication(AppModule, new HttpAdapter({ port: 3000 }))
   * await app.start()
   */
  public async start(): Promise<void> {
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
}
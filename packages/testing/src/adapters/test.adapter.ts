import { AbstractAdapter, HandlerMetadata, LunaHandler, LunaMessage } from '@lunafw/common'

/**
 * Route key used to index registered handlers.
 * Format: `{event}:{prefix}:{path}`
 */
type RouteKey = string

/**
 * In-memory adapter for use in tests.
 *
 * Does not open any ports or external connections. Handlers are registered
 * internally and can be invoked synchronously via `dispatch`.
 *
 * @example
 * const adapter = testModule.createAdapter()
 * await testModule.start()
 * const result = await adapter.dispatch('get', 'users', '/', { context: 'test', payload: {}, metadata: {} })
 */
export class TestAdapter extends AbstractAdapter {
  private readonly handlers = new Map<RouteKey, LunaHandler>()

  /**
   * Builds the route key used to store and look up handlers.
   *
   * @param event - The event/method identifier (e.g. `'get'`, `'post'`).
   * @param prefix - The controller-level prefix from `@Controller`.
   * @param path - The method-level path from `@On`.
   */
  private buildKey(event: string, prefix: string, path: string): RouteKey {
    return `${event}:${prefix}:${path}`
  }

  /**
   * Registers a handler for the given route metadata.
   *
   * Called automatically by `LunaApplication` during `start()`.
   *
   * @param handler - The handler to register.
   * @param metadata - Route metadata derived from `@Controller` and `@On` decorators.
   */
  public register(handler: LunaHandler, metadata: HandlerMetadata): void {
    const key = this.buildKey(metadata.event, metadata.prefix, metadata.path)
    this.handlers.set(key, handler)
  }

  /**
   * No-op. The test adapter does not open any network ports.
   */
  public async listen(): Promise<void> {
    // no-op
  }

  /**
   * No-op. The test adapter holds no external resources to release.
   */
  public async close(): Promise<void> {
    // no-op
  }

  /**
   * Invokes the handler registered for the given route and returns its result.
   *
   * @param event - The event/method identifier to match (e.g. `'get'`).
   * @param prefix - The controller prefix to match (e.g. `'users'`).
   * @param path - The handler path to match (e.g. `'/'`).
   * @param message - The `LunaMessage` to pass to the handler.
   * @returns The value returned by the matched handler.
   * @throws {Error} If no handler is registered for the given route.
   *
   * @example
   * const result = await adapter.dispatch('get', 'users', '/', {
   *   context: 'test',
   *   payload: {},
   *   metadata: {},
   * })
   */
  public async dispatch(event: string, prefix: string, path: string, message: LunaMessage): Promise<unknown> {
    const key = this.buildKey(event, prefix, path)
    const handler = this.handlers.get(key)

    if (!handler) {
      throw new Error(
        `TestAdapter: no handler registered for route "${key}". ` +
        `Make sure the controller is decorated with @Controller('${prefix}') ` +
        `and the method with @On('${event}', '${path}'), and that testModule.start() was called.`,
      )
    }

    return handler.handle(message)
  }
}

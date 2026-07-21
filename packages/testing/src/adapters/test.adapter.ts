import { AbstractAdapter, HandlerMetadata, LunaHandler, LunaMessage } from '@lunafw/common'

/** Dispatch signature for the in-memory test adapter. */
export interface ITestAdapter {
  dispatch(event: string, prefix: string, path: string, message: LunaMessage): Promise<unknown>
}

/** Route key used to index registered handlers. Format: `{event}:{prefix}:{path}` */
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
export class TestAdapter extends AbstractAdapter implements ITestAdapter {
  private readonly handlers = new Map<RouteKey, LunaHandler>()

  private buildKey(event: string, prefix: string, path: string): RouteKey {
    return `${event}:${prefix}:${path}`
  }

  public register(handler: LunaHandler, metadata: HandlerMetadata): void {
    const key = this.buildKey(metadata.event, metadata.prefix, metadata.path)
    this.handlers.set(key, handler)
  }

  public async listen(): Promise<void> {
    // no-op
  }

  public async close(): Promise<void> {
    // no-op
  }

  /**
   * Invokes the handler registered for the given route and returns its result.
   *
   * @throws {Error} If no handler is registered for the given route.
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

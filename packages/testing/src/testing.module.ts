import { LunaApplication as CommonApplication } from '@lunafw/common'
import { LunaApplication as CoreApplication } from '@lunafw/core'

import { TestAdapter } from './adapters/test.adapter'

/**
 * Injection token accepted by `TestingModule.get`.
 * Mirrors the `Token` type from `@lunafw/core` without re-exporting it.
 */
type InjectionToken<T = unknown> = (new (...args: unknown[]) => T) | string | symbol

/**
 * A thin wrapper around the Luna DI container returned by `TestingFactory.createModule`.
 *
 * Exposes DI resolution and adapter creation utilities intended for use in tests.
 * Unlike a production `LunaApplication`, it does not require any real adapter to be
 * passed at construction time — adapters are created on demand via `createAdapter`.
 *
 * @example
 * const testModule = await TestingFactory.createModule(AppModule)
 * const service = testModule.get(UserService)
 * const adapter = testModule.createAdapter()
 * await testModule.start()
 */
export class TestingModule {
  private readonly adapters: TestAdapter[] = []

  constructor(private readonly core: CoreApplication) {}

  /**
   * Resolves a provider instance from the DI container.
   *
   * When `token` is a class constructor the return type is inferred automatically.
   *
   * @param token - The injection token (class constructor, string, or symbol).
   * @returns The resolved instance.
   * @throws If the token is not registered in the container.
   *
   * @example
   * const service = testModule.get(UserService)
   */
  public get<T>(token: InjectionToken<T>): T {
    return this.core.get<T>(token as Parameters<CoreApplication['get']>[0])
  }

  /**
   * Creates a new `TestAdapter` and registers it internally so that
   * controller handlers are wired to it when `start()` is called.
   *
   * Call `start()` after creating all adapters you need.
   *
   * @returns The newly created `TestAdapter`.
   *
   * @example
   * const adapter = testModule.createAdapter()
   * await testModule.start()
   * const result = await adapter.dispatch('get', 'users', '/', message)
   */
  public createAdapter(): TestAdapter {
    const adapter = new TestAdapter()
    this.adapters.push(adapter)
    return adapter
  }

  /**
   * Starts the testing module.
   *
   * Registers all controller handlers on every adapter previously created via
   * `createAdapter`, then runs core lifecycle hooks. No network ports are opened.
   *
   * @example
   * await testModule.start()
   */
  public async start(): Promise<void> {
    const app = new CommonApplication(this.core, this.adapters)
    await app.start()
  }
}

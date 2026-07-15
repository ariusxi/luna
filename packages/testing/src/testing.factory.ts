import { LunaFactory as CoreFactory } from '@lunafw/core'

import { TestingModule } from './testing.module'

/**
 * Entry point for bootstrapping a Luna module in a test environment.
 *
 * Initialises the DI container without starting any adapter or server, and
 * returns a `TestingModule` that exposes helpers for resolving providers and
 * dispatching messages to handlers.
 *
 * @example
 * const testModule = await TestingFactory.createModule(AppModule)
 * const service = testModule.get(UserService)
 */
export class TestingFactory {
  /**
   * Bootstraps the DI container for the given root module and returns a
   * `TestingModule` instance.
   *
   * No adapters are started. Use `TestingModule.createAdapter()` followed by
   * `TestingModule.start()` when you also need to test handler dispatch.
   *
   * @param module - The root `@Module`-decorated class that defines providers.
   * @returns A `TestingModule` wrapping the initialised DI container.
   *
   * @example
   * const testModule = await TestingFactory.createModule(AppModule)
   */
  public static async createModule(module: Function): Promise<TestingModule> {
    const core = await CoreFactory.create(module)
    return new TestingModule(core)
  }
}

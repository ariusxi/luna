import { ModuleContext } from '../types'
import { DependencyContainer } from './dependency.container'
import { LunaApplication } from './luna.application'
import { ModuleManager } from './module.manager'
import { ModuleScanner } from './module.scanner'

/**
 * Entry point for bootstrapping a Luna application from the `@lunafw/core` level.
 *
 * Scans the module tree, builds per-module DI containers, propagates exported
 * providers across module boundaries, and returns a `LunaApplication`.
 *
 * In most setups you will use `LunaFactory` from `@lunafw/common` instead,
 * which wraps this and adds protocol adapter management.
 *
 * @example
 * import { LunaFactory } from '@lunafw/core'
 *
 * const app = await LunaFactory.create(AppModule)
 * await app.start()
 */
export class LunaFactory {

  private static buildContexts(modules: Function[]): Map<Function, ModuleContext> {
    const contexts = new Map<Function, ModuleContext>()

    // First pass — create containers and register each module's own providers.
    for (const moduleClass of modules) {
      const metadata = ModuleManager.get(moduleClass)
      const container = new DependencyContainer(moduleClass)

      for (const provider of metadata?.providers ?? []) {
        container.register(provider)
      }

      contexts.set(moduleClass, {
        container,
        exports: metadata?.exports ?? [],
      })
    }

    // Second pass — propagate exported providers into importing modules.
    // Modules are in DFS order (leaves first), so boot runs in dependency order.
    for (const moduleClass of modules) {
      const metadata = ModuleManager.get(moduleClass)
      const context = contexts.get(moduleClass)!

      context.container.boot()

      for (const importingModule of modules) {
        const importingMeta = ModuleManager.get(importingModule)
        if (!importingMeta?.imports?.includes(moduleClass)) continue

        const importingContext = contexts.get(importingModule)!

        for (const token of context.exports) {
          const instance = context.container.resolve(token)
          importingContext.container.register({ provide: token, useValue: instance })
        }
      }
    }

    return contexts
  }

  /**
   * Bootstraps a Luna application from a root module.
   *
   * Scans the module tree, instantiates all providers (eager loading),
   * and returns a `LunaApplication` ready to be started.
   *
   * @param rootModule - The top-level module that defines the application structure.
   *
   * @example
   * const app = await LunaFactory.create(AppModule)
   * await app.start()
   */
  public static async create(rootModule: Function) {
    const scanner = new ModuleScanner()
    const modules = scanner.scan(rootModule)
    const contexts = this.buildContexts(modules)

    return new LunaApplication(contexts, rootModule)
  }

}

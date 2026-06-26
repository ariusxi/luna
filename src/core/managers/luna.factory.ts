import { ModuleContext } from '../types'
import { DependencyContainer } from './dependency.container'
import { LunaApplication } from './luna.application'
import { ModuleManager } from './module.manager'
import { ModuleScanner } from './module.scanner'

export class LunaFactory {

  private static buildContexts(modules: Function[]): Map<Function, ModuleContext> {
    const contexts = new Map<Function, ModuleContext>()

    for (const moduleClass of modules) {
      const metadata = ModuleManager.get(moduleClass)
      const container = new DependencyContainer()

      const moduleProviders = metadata?.providers ?? []
      for (const provider of moduleProviders) {
        container.register(provider as any)
      }

      container.boot()

      const exports = metadata?.exports ?? []
      contexts.set(moduleClass, { container, exports })
    }

    return contexts
  }

  public static async create(rootModule: Function) {
    const scanner = new ModuleScanner()
    const modules = scanner.scan(rootModule)
    const contexts = this.buildContexts(modules)

    return new LunaApplication(contexts, rootModule)
  }

}
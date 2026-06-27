import { ModuleContext } from '../types'
import { DependencyContainer } from './dependency.container'
import { LunaApplication } from './luna.application'
import { ModuleManager } from './module.manager'
import { ModuleScanner } from './module.scanner'

export class LunaFactory {

  private static buildContexts(modules: Function[]): Map<Function, ModuleContext> {
    const contexts = new Map<Function, ModuleContext>()

    // primeira passagem — cria os containers e registra os providers locais
    for (const moduleClass of modules) {
      const metadata = ModuleManager.get(moduleClass)
      const container = new DependencyContainer(moduleClass)

      for (const provider of metadata?.providers ?? []) {
        container.register(provider as any)
      }

      contexts.set(moduleClass, {
        container,
        exports: metadata?.exports ?? [],
      })
    }

    // segunda passagem — propaga exports como ValueProvider com instância já resolvida
    // módulos estão em ordem DFS (folhas primeiro), então boot pode rodar na mesma ordem
    for (const moduleClass of modules) {
      const metadata = ModuleManager.get(moduleClass)
      const context = contexts.get(moduleClass)!

      // boot do módulo atual antes de propagar
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

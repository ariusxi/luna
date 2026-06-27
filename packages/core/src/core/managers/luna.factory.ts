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

    // segunda passagem — registra nos containers os providers exportados pelos módulos importados
    for (const moduleClass of modules) {
      const metadata = ModuleManager.get(moduleClass)
      const context = contexts.get(moduleClass)!

      for (const importedModule of metadata?.imports ?? []) {
        const importedContext = contexts.get(importedModule)
        if (!importedContext) continue

        for (const token of importedContext.exports) {
          const provider = importedContext.container.getProvider(token)
          if (provider) context.container.register(provider)
        }
      }
    }

    // terceira passagem — boot após todos os providers estarem registrados
    for (const [, context] of contexts) {
      context.container.boot()
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

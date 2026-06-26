import { ProviderDefinition } from '../types'
import { ModuleManager } from './module.manager'

export class ModuleScanner {
  private visit(discovered: Set<Function>, moduleClass: Function) {
    if (discovered.has(moduleClass)) return

    discovered.add(moduleClass)
    
    const metadata = ModuleManager.get(moduleClass)
    if (!metadata) {
      throw new Error(`${moduleClass.name} is not a valid module.`)
    }

    const imports = metadata.imports ?? []
    for (const imported of imports) {
      this.visit(discovered, imported)
    }
  }

  public scan(rootModule: Function): Function[] {
    const discovered = new Set<Function>()
    
    this.visit(discovered, rootModule)

    return [...discovered]
  }

  public collectProviders(modules: Function[]): ProviderDefinition[] {
    const providers = modules.flatMap((module) => {
      const metadata = ModuleManager.get(module)
      const moduleProviders = metadata?.providers ?? []

      return moduleProviders
    })

    return providers
  }
}
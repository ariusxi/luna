import { ProviderDefinition } from '../types'
import { ModuleManager } from './module.manager'

/**
 * Traverses the module tree via depth-first search starting from the root
 * module and collects the full list of modules in dependency order (leaves
 * first, root last).
 *
 * This is an internal service used by `LunaFactory` during bootstrap.
 */
export class ModuleScanner {
  private visit(discovered: Set<Function>, moduleClass: Function): void {
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

  /**
   * Scans the module tree from `rootModule` and returns the ordered list of
   * discovered module classes (each class appears exactly once).
   *
   * @param rootModule - The top-level module to start scanning from.
   */
  public scan(rootModule: Function): Function[] {
    const discovered = new Set<Function>()
    this.visit(discovered, rootModule)
    return [...discovered]
  }

  /**
   * Collects all provider definitions from the given list of modules.
   *
   * @param modules - The ordered list of module classes returned by `scan()`.
   */
  public collectProviders(modules: Function[]): ProviderDefinition[] {
    return modules.flatMap((module) => {
      const metadata = ModuleManager.get(module)
      return metadata?.providers ?? []
    })
  }
}

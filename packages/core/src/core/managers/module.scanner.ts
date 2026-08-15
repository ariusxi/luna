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
  private visit(seen: Set<Function>, ordered: Function[], moduleClass: Function): void {
    if (seen.has(moduleClass)) return
    seen.add(moduleClass)

    const metadata = ModuleManager.get(moduleClass)
    if (!metadata) {
      throw new Error(`${moduleClass.name} is not a valid module.`)
    }

    const imports = metadata.imports ?? []
    for (const imported of imports) {
      this.visit(seen, ordered, imported)
    }

    // Post-order: a module is appended only after its imports, so the returned
    // list is leaves-first / root-last. Bootstrap relies on this so a module's
    // imported exports are already resolved before the module itself boots.
    ordered.push(moduleClass)
  }

  /**
   * Scans the module tree from `rootModule` and returns the ordered list of
   * discovered module classes (each class appears exactly once), in dependency
   * order: imported modules before the modules that import them, root last.
   *
   * @param rootModule - The top-level module to start scanning from.
   */
  public scan(rootModule: Function): Function[] {
    const seen = new Set<Function>()
    const ordered: Function[] = []
    this.visit(seen, ordered, rootModule)
    return ordered
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

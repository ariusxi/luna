import { ModuleProperties } from "../types";

/**
 * Static registry that stores `@Module` decorator metadata for every module class.
 *
 * `ModuleScanner` reads from this registry during application bootstrap to
 * discover the full module tree. This is an internal service — consumers
 * interact with modules through the `@Module` decorator.
 */
export class ModuleManager {
  private static modules = new Map<Function, ModuleProperties>()

  /**
   * Records the metadata for a module class.
   * Called automatically by the `@Module` decorator.
   *
   * @param moduleClass - The decorated class.
   * @param options     - The module configuration object.
   */
  public static register(moduleClass: Function, options: ModuleProperties): void {
    this.modules.set(moduleClass, options)
  }

  /**
   * Returns the stored metadata for `moduleClass`, or `undefined` if not registered.
   *
   * @param moduleClass - The module class to look up.
   */
  public static get(moduleClass: Function): ModuleProperties | void {
    return this.modules.get(moduleClass)
  }

  /**
   * Returns `true` when `moduleClass` has been registered via `@Module`.
   *
   * @param moduleClass - The module class to check.
   */
  public static has(moduleClass: Function): boolean {
    return this.modules.has(moduleClass)
  }

  /** Returns the full map of all registered module metadata. */
  public static getAll(): Map<Function, ModuleProperties> {
    return this.modules
  }
}

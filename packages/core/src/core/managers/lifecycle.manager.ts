/**
 * Manages the lifecycle of all instantiated providers.
 *
 * Every class instance created by `DependencyContainer` is registered here.
 * `LunaApplication.start()` calls `executeLifecycleMethod` to invoke the
 * standard lifecycle hooks in the correct order.
 *
 * This is an internal service — consumers interact with lifecycle hooks by
 * implementing the hook methods on their `@Injectable` classes.
 */
export class LifecycleManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static instances: any[] = []

  /**
   * Registers an instance so its lifecycle hooks can be invoked later.
   * Called automatically by `DependencyContainer` when it creates a new instance.
   *
   * @param instance - The newly created provider instance.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static registerInstance(instance: any): void {
    this.instances.push(instance)
  }

  /**
   * Calls `method` on `instance` if it exists, catching and logging any error
   * so that a single failing hook does not abort the bootstrap sequence.
   *
   * @param instance - The provider instance.
   * @param method   - The lifecycle method name to invoke.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async executeMethod(instance: any, method: string): Promise<void> {
    try {
      await instance[method]()
    } catch (error) {
      console.error(`[Luna] Error on ${instance.constructor.name}.${method}:`, error)
    }
  }

  /**
   * Invokes `method` on every registered instance that defines it, in
   * registration order.
   *
   * @param method - The lifecycle method name (e.g. `'onModuleInit'`).
   */
  public static async executeLifecycleMethod(method: string): Promise<void> {
    const instancesWithLifecycle = this.instances.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (instance: any) => typeof instance[method] === 'function',
    )

    for (const instance of instancesWithLifecycle) {
      await this.executeMethod(instance, method)
    }
  }
}

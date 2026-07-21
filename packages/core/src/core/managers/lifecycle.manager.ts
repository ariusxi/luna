/** Interface that injectable providers can implement to receive lifecycle callbacks. */
export interface ILifecycleHook {
  onModuleInit?(): Promise<void> | void
  onModuleDestroy?(): Promise<void> | void
  onApplicationBootstrap?(): Promise<void> | void
  beforeApplicationShutdown?(): Promise<void> | void
  onApplicationShutdown?(): Promise<void> | void
}

type LifecycleInstance = Record<string, (...args: unknown[]) => Promise<void> | void>

class LifecycleManagerImpl {
  private instances: unknown[] = []

  registerInstance(instance: unknown): void {
    this.instances.push(instance)
  }

  async executeMethod(instance: unknown, method: string): Promise<void> {
    try {
      await (instance as LifecycleInstance)[method]()
    } catch (error) {
      const name = (instance as { constructor: { name: string } }).constructor.name
      console.error(`[Luna] Error on ${name}.${method}:`, error)
    }
  }

  async executeLifecycleMethod(method: string): Promise<void> {
    const eligible = this.instances.filter(
      (instance) => typeof (instance as LifecycleInstance)[method] === 'function',
    )
    for (const instance of eligible) {
      await this.executeMethod(instance, method)
    }
  }
}

export const LifecycleManager = new LifecycleManagerImpl()

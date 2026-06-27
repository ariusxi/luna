export class LifecycleManager {
  private static instances: any[] = []

  public static registerInstance(instance: any): void {
    this.instances.push(instance)
  }

  public static async executeMethod(instance: any, method: string): Promise<void> {
    try {
      await instance[method]()
    } catch (error) {
      console.error(`[Luna] Error on ${instance.constructor.name}.${method}:`, error)
    }
  }

  public static async executeLifecycleMethod(method: string): Promise<void> {
    const instancesWithLifecycle = this.instances.filter((instance) => typeof instance[method] === 'function')
      
    for (const instance of instancesWithLifecycle) {
      await this.executeMethod(instance, method)
    }
  }
}
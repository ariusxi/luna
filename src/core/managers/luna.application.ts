import { ModuleContext, Token } from '../types'
import { LifecycleManager } from './lifecycle.manager'

export class LunaApplication {
  constructor(
    private readonly contexts: Map<Function, ModuleContext>,
    private readonly rootModule: Function,
  ) {}

  public async start(): Promise<void> {
    await LifecycleManager.executeLifecycleMethod('onModuleInit')
    await LifecycleManager.executeLifecycleMethod('onApplicationBoostrap')

    const APPLICATION_EVENTS = ['SIGTERM', 'SIGINT']
    APPLICATION_EVENTS.forEach((event) => process.on(event, async () => {
      await LifecycleManager.executeLifecycleMethod('onModuleDestroy')
      await LifecycleManager.executeLifecycleMethod('beforeApplicationShutdown')
      await LifecycleManager.executeLifecycleMethod('onApplicationShutdown')
    }))
  }

  public get<T>(token: Token): T {
    const context = this.contexts.get(this.rootModule)!
    return context.container.resolve<T>(token)
  }

  public inspect(token: Token): object {
    const context = this.contexts.get(this.rootModule)!
    return context.container.inspect(token)
  }
}
import 'reflect-metadata'
import { LunaFactory } from '../../src/core/managers/luna.factory'
import { LifecycleManager } from '../../src/core/managers/lifecycle.manager'
import { ModuleManager } from '../../src/core/managers/module.manager'
import { Injectable } from '../../src/core/decorators/injectable.decorator'
import { Module } from '../../src/core/decorators/module.decorator'

describe('Lifecycle hooks', () => {
  beforeEach(() => {
    ModuleManager['modules'].clear()
    LifecycleManager['instances'] = []
  })

  it('should call onModuleInit on boot', async () => {
    const fn = jest.fn()

    @Injectable()
    class MyService {
      onModuleInit() { fn() }
    }

    @Module({ providers: [MyService] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    await app.start()

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should call onApplicationBootstrap after onModuleInit', async () => {
    const order: string[] = []

    @Injectable()
    class MyService {
      onModuleInit() { order.push('init') }
      onApplicationBootstrap() { order.push('bootstrap') }
    }

    @Module({ providers: [MyService] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    await app.start()

    expect(order).toEqual(['init', 'bootstrap'])
  })

  it('should call onModuleInit on all providers across modules', async () => {
    const calls: string[] = []

    @Injectable()
    class ServiceA {
      onModuleInit() { calls.push('A') }
    }

    @Injectable()
    class ServiceB {
      onModuleInit() { calls.push('B') }
    }

    @Module({ providers: [ServiceA], exports: [ServiceA] })
    class ModuleA {}

    @Module({ imports: [ModuleA], providers: [ServiceB] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    await app.start()

    expect(calls).toContain('A')
    expect(calls).toContain('B')
  })

  it('should support async onModuleInit', async () => {
    const fn = jest.fn()

    @Injectable()
    class AsyncService {
      async onModuleInit() {
        await new Promise((r) => setTimeout(r, 10))
        fn()
      }
    }

    @Module({ providers: [AsyncService] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    await app.start()

    expect(fn).toHaveBeenCalled()
  })

  it('should not fail if a provider has no lifecycle methods', async () => {
    @Injectable()
    class PlainService {}

    @Module({ providers: [PlainService] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    await expect(app.start()).resolves.not.toThrow()
  })
})

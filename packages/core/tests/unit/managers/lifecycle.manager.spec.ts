import 'reflect-metadata'
import { LifecycleManager } from '../../../src/core/managers/lifecycle.manager'

describe('LifecycleManager', () => {
  beforeEach(() => {
    LifecycleManager['instances'] = []
  })

  it('should register an instance', () => {
    const instance = { onModuleInit: jest.fn() }
    LifecycleManager.registerInstance(instance)

    expect(LifecycleManager['instances']).toContain(instance)
  })

  it('should call lifecycle method on matching instances', async () => {
    const fn = jest.fn()
    LifecycleManager.registerInstance({ onModuleInit: fn })
    LifecycleManager.registerInstance({ noLifecycle: true })

    await LifecycleManager.executeLifecycleMethod('onModuleInit')

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should not call method on instances that do not define it', async () => {
    const fn = jest.fn()
    LifecycleManager.registerInstance({ onModuleInit: fn })
    LifecycleManager.registerInstance({})

    await LifecycleManager.executeLifecycleMethod('onModuleInit')

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should call async lifecycle methods and await them', async () => {
    const order: number[] = []
    LifecycleManager.registerInstance({
      onModuleInit: async () => {
        await new Promise((r) => setTimeout(r, 10))
        order.push(1)
      },
    })
    LifecycleManager.registerInstance({
      onModuleInit: () => { order.push(2) },
    })

    await LifecycleManager.executeLifecycleMethod('onModuleInit')

    expect(order).toEqual([1, 2])
  })

  it('should continue executing other instances if one throws', async () => {
    const fn = jest.fn()
    LifecycleManager.registerInstance({
      onModuleInit: () => { throw new Error('boom') },
    })
    LifecycleManager.registerInstance({ onModuleInit: fn })

    await LifecycleManager.executeLifecycleMethod('onModuleInit')

    expect(fn).toHaveBeenCalled()
  })

  it('should execute all shutdown hooks in order', async () => {
    const order: string[] = []
    LifecycleManager.registerInstance({ onModuleDestroy: () => order.push('destroy') })
    LifecycleManager.registerInstance({ onApplicationShutdown: () => order.push('shutdown') })

    await LifecycleManager.executeLifecycleMethod('onModuleDestroy')
    await LifecycleManager.executeLifecycleMethod('onApplicationShutdown')

    expect(order).toEqual(['destroy', 'shutdown'])
  })
})

import 'reflect-metadata'
import { Module } from '../../../src/core/decorators/module.decorator'
import { ModuleManager } from '../../../src/core/managers/module.manager'

describe('@Module', () => {
  beforeEach(() => {
    ModuleManager['modules'].clear()
  })

  it('should register the class as a module', () => {
    @Module({})
    class MyModule {}

    expect(ModuleManager.has(MyModule)).toBe(true)
  })

  it('should store providers metadata', () => {
    class ServiceA {}

    @Module({ providers: [ServiceA] })
    class MyModule {}

    expect(ModuleManager.get(MyModule)?.providers).toContain(ServiceA)
  })

  it('should store imports metadata', () => {
    @Module({})
    class OtherModule {}

    @Module({ imports: [OtherModule] })
    class MyModule {}

    expect(ModuleManager.get(MyModule)?.imports).toContain(OtherModule)
  })

  it('should store exports metadata', () => {
    class ServiceA {}

    @Module({ exports: [ServiceA] })
    class MyModule {}

    expect(ModuleManager.get(MyModule)?.exports).toContain(ServiceA)
  })

  it('should allow empty module definition', () => {
    @Module({})
    class EmptyModule {}

    expect(ModuleManager.get(EmptyModule)).toEqual({})
  })
})

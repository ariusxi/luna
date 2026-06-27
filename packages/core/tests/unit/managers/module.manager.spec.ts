import 'reflect-metadata'
import { ModuleManager } from '../../../src/core/managers/module.manager'

describe('ModuleManager', () => {
  beforeEach(() => {
    ModuleManager['modules'].clear()
  })

  it('should register a module', () => {
    class MyModule {}
    ModuleManager.register(MyModule, { providers: [] })

    expect(ModuleManager.has(MyModule)).toBe(true)
  })

  it('should retrieve module metadata', () => {
    class MyModule {}
    const props = { providers: [], imports: [] }
    ModuleManager.register(MyModule, props)

    expect(ModuleManager.get(MyModule)).toEqual(props)
  })

  it('should return undefined for unregistered module', () => {
    class Unknown {}
    expect(ModuleManager.get(Unknown)).toBeUndefined()
  })

  it('should return all registered modules', () => {
    class ModA {}
    class ModB {}
    ModuleManager.register(ModA, {})
    ModuleManager.register(ModB, {})

    expect(ModuleManager.getAll().size).toBe(2)
  })

  it('should overwrite existing module registration', () => {
    class MyModule {}
    ModuleManager.register(MyModule, { providers: [] })
    ModuleManager.register(MyModule, { providers: [], imports: [] })

    expect(ModuleManager.get(MyModule)?.imports).toBeDefined()
  })
})

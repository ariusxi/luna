import 'reflect-metadata'
import { ModuleScanner } from '../../../src/core/managers/module.scanner'
import { ModuleManager } from '../../../src/core/managers/module.manager'

describe('ModuleScanner', () => {
  let scanner: ModuleScanner

  beforeEach(() => {
    ModuleManager['modules'].clear()
    scanner = new ModuleScanner()
  })

  it('should discover a single root module', () => {
    class RootModule {}
    ModuleManager.register(RootModule, {})

    expect(scanner.scan(RootModule)).toEqual([RootModule])
  })

  it('should discover imported modules recursively', () => {
    class LeafModule {}
    class ChildModule {}
    class RootModule {}

    ModuleManager.register(LeafModule, {})
    ModuleManager.register(ChildModule, { imports: [LeafModule] })
    ModuleManager.register(RootModule, { imports: [ChildModule] })

    const discovered = scanner.scan(RootModule)
    expect(discovered).toContain(RootModule)
    expect(discovered).toContain(ChildModule)
    expect(discovered).toContain(LeafModule)
  })

  it('should not visit the same module twice (circular guard)', () => {
    class ModA {}
    class ModB {}

    ModuleManager.register(ModA, { imports: [ModB] })
    ModuleManager.register(ModB, { imports: [] })

    const discovered = scanner.scan(ModA)
    const unique = new Set(discovered)
    expect(discovered.length).toBe(unique.size)
  })

  it('should throw for unregistered module', () => {
    class Unknown {}
    expect(() => scanner.scan(Unknown)).toThrow('Unknown is not a valid module.')
  })

  it('should collect providers from all modules', () => {
    class ServiceA {}
    class ServiceB {}
    class ModA {}
    class ModB {}

    ModuleManager.register(ModA, { providers: [ServiceA] })
    ModuleManager.register(ModB, { providers: [ServiceB], imports: [ModA] })

    const modules = scanner.scan(ModB)
    const providers = scanner.collectProviders(modules)

    expect(providers).toContain(ServiceA)
    expect(providers).toContain(ServiceB)
  })
})

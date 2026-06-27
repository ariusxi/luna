import 'reflect-metadata'
import { LunaFactory } from '../../src/core/managers/luna.factory'
import { LifecycleManager } from '../../src/core/managers/lifecycle.manager'
import { ModuleManager } from '../../src/core/managers/module.manager'
import { Module } from '../../src/core/decorators/module.decorator'
import { defineProvider } from '../../src/core/providers/define-provider'

describe('Functional providers (defineProvider)', () => {
  beforeEach(() => {
    ModuleManager['modules'].clear()
    LifecycleManager['instances'] = []
  })

  it('should register and resolve a functional provider', async () => {
    const MyService = defineProvider({
      useFactory: () => ({ getValue: () => 42 }),
    })

    @Module({ providers: [MyService] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    const instance = app.get<{ getValue: () => number }>(MyService.provide)
    expect(instance.getValue()).toBe(42)
  })

  it('should inject another functional provider', async () => {
    const DbService = defineProvider({
      useFactory: () => ({ query: () => ['user1'] }),
    })

    const UserService = defineProvider({
      inject: [DbService],
      useFactory: (db: { query: () => string[] }) => ({
        getUsers: () => db.query(),
      }),
    })

    @Module({ providers: [DbService, UserService] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    const service = app.get<{ getUsers: () => string[] }>(UserService.provide)
    expect(service.getUsers()).toEqual(['user1'])
  })

  it('should export and resolve a functional provider across modules', async () => {
    const ConfigService = defineProvider({
      useFactory: () => ({ port: 3000 }),
    })

    @Module({ providers: [ConfigService], exports: [ConfigService.provide] })
    class ConfigModule {}

    @Module({ imports: [ConfigModule] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    const config = app.get<{ port: number }>(ConfigService.provide)
    expect(config.port).toBe(3000)
  })

  it('should generate unique tokens for each defineProvider call', async () => {
    const A = defineProvider({ useFactory: () => 'a' })
    const B = defineProvider({ useFactory: () => 'b' })

    @Module({ providers: [A, B] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    expect(app.get(A.provide)).toBe('a')
    expect(app.get(B.provide)).toBe('b')
  })

  it('should mix functional and class providers in the same module', async () => {
    const { Injectable } = await import('../../src/core/decorators/injectable.decorator')

    @Injectable()
    class ClassService { value = 'class' }

    const FnService = defineProvider({
      useFactory: () => ({ value: 'functional' }),
    })

    @Module({ providers: [ClassService, FnService] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    expect(app.get<ClassService>(ClassService).value).toBe('class')
    expect(app.get<{ value: string }>(FnService.provide).value).toBe('functional')
  })
})

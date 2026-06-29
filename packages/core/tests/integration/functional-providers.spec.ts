import 'reflect-metadata'
import { LunaFactory } from '../../src/core/managers/luna.factory'
import { LifecycleManager } from '../../src/core/managers/lifecycle.manager'
import { ModuleManager } from '../../src/core/managers/module.manager'
import { Module } from '../../src/core/decorators/module.decorator'
import { defineProvider, composeProviders } from '../../src/core/providers/define-provider'

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

  describe('conditional providers (when)', () => {
    it('should register provider when condition is true', async () => {
      const Service = defineProvider({
        when: () => true,
        useFactory: () => ({ active: true }),
      })

      @Module({ providers: [Service] })
      class AppModule {}

      const app = await LunaFactory.create(AppModule)
      expect(app.get<{ active: boolean }>(Service.provide).active).toBe(true)
    })

    it('should not register provider when condition is false', async () => {
      const Service = defineProvider({
        when: () => false,
        useFactory: () => ({ active: true }),
      })

      @Module({ providers: [Service] })
      class AppModule {}

      const app = await LunaFactory.create(AppModule)
      expect(() => app.get(Service.provide)).toThrow('[Luna]')
    })

    it('should register alternative provider based on condition', async () => {
      const ProdService = defineProvider({
        when: () => process.env.NODE_ENV === 'production',
        useFactory: () => ({ env: 'prod' }),
      })

      const DevService = defineProvider({
        when: () => process.env.NODE_ENV !== 'production',
        useFactory: () => ({ env: 'dev' }),
      })

      @Module({ providers: [ProdService, DevService] })
      class AppModule {}

      const app = await LunaFactory.create(AppModule)
      expect(() => app.get(ProdService.provide)).toThrow('[Luna]')
      expect(app.get<{ env: string }>(DevService.provide).env).toBe('dev')
    })
  })

  describe('lazy providers', () => {
    it('should not instantiate lazy provider at boot', async () => {
      const factory = jest.fn(() => ({ value: 1 }))

      const LazyService = defineProvider({
        lazy: true,
        useFactory: factory,
      })

      @Module({ providers: [LazyService] })
      class AppModule {}

      await LunaFactory.create(AppModule)
      expect(factory).not.toHaveBeenCalled()
    })

    it('should instantiate lazy provider on first resolve', async () => {
      const factory = jest.fn(() => ({ value: 42 }))

      const LazyService = defineProvider({
        lazy: true,
        useFactory: factory,
      })

      @Module({ providers: [LazyService] })
      class AppModule {}

      const app = await LunaFactory.create(AppModule)
      const instance = app.get<{ value: number }>(LazyService.provide)

      expect(factory).toHaveBeenCalledTimes(1)
      expect(instance.value).toBe(42)
    })

    it('should return same instance on subsequent resolves of lazy provider', async () => {
      const LazyService = defineProvider({
        lazy: true,
        useFactory: () => ({ id: Math.random() }),
      })

      @Module({ providers: [LazyService] })
      class AppModule {}

      const app = await LunaFactory.create(AppModule)
      const a = app.get<{ id: number }>(LazyService.provide)
      const b = app.get<{ id: number }>(LazyService.provide)

      expect(a.id).toBe(b.id)
    })
  })

  describe('composeProviders', () => {
    it('should compose multiple providers into one', async () => {
      const A = defineProvider({ useFactory: () => 'hello' })
      const B = defineProvider({ useFactory: () => 'world' })

      const Composed = composeProviders([A, B], (a, b) => `${a} ${b}`)

      @Module({ providers: [A, B, Composed] })
      class AppModule {}

      const app = await LunaFactory.create(AppModule)
      expect(app.get(Composed.provide)).toBe('hello world')
    })

    it('should work with class providers and functional providers together', async () => {
      const { Injectable } = await import('../../src/core/decorators/injectable.decorator')

      @Injectable()
      class Logger { log = jest.fn() }

      const Service = defineProvider({ useFactory: () => ({ value: 10 }) })

      const Composed = composeProviders(
        [Logger, Service],
        (logger: Logger, svc: { value: number }) => ({
          run: () => { logger.log(svc.value); return svc.value },
        }),
      )

      @Module({ providers: [Logger, Service, Composed] })
      class AppModule {}

      const app = await LunaFactory.create(AppModule)
      const result = app.get<{ run: () => number }>(Composed.provide)
      expect(result.run()).toBe(10)
    })
  })
})

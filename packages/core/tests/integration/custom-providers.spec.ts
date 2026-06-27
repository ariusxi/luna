import 'reflect-metadata'
import { LunaFactory } from '../../src/core/managers/luna.factory'
import { LifecycleManager } from '../../src/core/managers/lifecycle.manager'
import { ModuleManager } from '../../src/core/managers/module.manager'
import { Injectable } from '../../src/core/decorators/injectable.decorator'
import { Inject } from '../../src/core/decorators/inject.decorator'
import { Module } from '../../src/core/decorators/module.decorator'

describe('Custom providers', () => {
  beforeEach(() => {
    ModuleManager['modules'].clear()
    LifecycleManager['instances'] = []
  })

  it('should resolve a ValueProvider by string token', async () => {
    @Module({ providers: [{ provide: 'API_KEY', useValue: 'secret' }] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    expect(app.get('API_KEY')).toBe('secret')
  })

  it('should resolve a FactoryProvider by string token', async () => {
    @Module({
      providers: [{ provide: 'Config', useFactory: () => ({ port: 3000 }) }],
    })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    expect(app.get('Config')).toEqual({ port: 3000 })
  })

  it('should inject a ValueProvider into a class', async () => {
    @Injectable()
    class MyService {
      constructor(@Inject('API_KEY') public key: string) {}
    }

    @Module({
      providers: [
        { provide: 'API_KEY', useValue: 'my-key' },
        MyService,
      ],
    })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    const service = app.get<MyService>(MyService)
    expect(service.key).toBe('my-key')
  })

  it('should resolve a ClassProvider under a string token', async () => {
    @Injectable()
    class ConcreteRepo {}

    @Module({
      providers: [{ provide: 'UserRepo', useClass: ConcreteRepo }],
    })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    expect(app.get('UserRepo')).toBeInstanceOf(ConcreteRepo)
  })

  it('should resolve a FactoryProvider with injected dependencies', async () => {
    @Injectable()
    class Db {}

    @Module({
      providers: [
        Db,
        { provide: 'Repo', useFactory: (db: Db) => ({ db }), inject: [Db] },
      ],
    })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    const repo = app.get<{ db: Db }>('Repo')
    expect(repo.db).toBeInstanceOf(Db)
  })

  it('should export and resolve a ValueProvider across modules', async () => {
    @Module({
      providers: [{ provide: 'TOKEN', useValue: 42 }],
      exports: ['TOKEN'],
    })
    class ConfigModule {}

    @Module({ imports: [ConfigModule] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    expect(app.get('TOKEN')).toBe(42)
  })
})

import 'reflect-metadata'
import { LunaFactory } from '../../src/core/managers/luna.factory'
import { ModuleManager } from '../../src/core/managers/module.manager'
import { Injectable } from '../../src/core/decorators/injectable.decorator'
import { Module } from '../../src/core/decorators/module.decorator'

describe('Module scope isolation', () => {
  beforeEach(() => {
    ModuleManager['modules'].clear()
  })

  it('should resolve a provider within its own module', async () => {
    @Injectable()
    class UserService {}

    @Module({ providers: [UserService] })
    class UserModule {}

    @Module({ imports: [UserModule] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    // UserService is in UserModule, not exported — AppModule cannot resolve it
    expect(() => app.get(UserService)).toThrow('[Luna]')
  })

  it('should resolve an exported provider in an importing module', async () => {
    @Injectable()
    class UserService {}

    @Module({ providers: [UserService], exports: [UserService] })
    class UserModule {}

    @Module({ imports: [UserModule] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    expect(app.get(UserService)).toBeInstanceOf(UserService)
  })

  it('should not resolve a non-exported provider from another module', async () => {
    @Injectable()
    class InternalService {}

    @Injectable()
    class PublicService {}

    @Module({ providers: [InternalService, PublicService], exports: [PublicService] })
    class FeatureModule {}

    @Module({ imports: [FeatureModule] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    expect(() => app.get(InternalService)).toThrow('[Luna]')
  })

  it('should resolve an exported provider that has internal dependencies', async () => {
    @Injectable()
    class DbService {}

    @Injectable()
    class UserService {
      constructor(public db: DbService) {}
    }

    // DbService e UserService estão no mesmo módulo — DbService não precisa ser exportado
    @Module({ providers: [DbService, UserService], exports: [UserService] })
    class UserModule {}

    @Module({ imports: [UserModule] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    const user = app.get<UserService>(UserService)
    expect(user.db).toBeInstanceOf(DbService)
  })
})

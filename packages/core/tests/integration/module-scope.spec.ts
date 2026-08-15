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

  it('boots a provider that injects an exported provider from an imported module', async () => {
    @Injectable()
    class WsService {}

    @Module({ providers: [WsService], exports: [WsService] })
    class WsModule {}

    @Injectable()
    class LiveService {
      constructor(public ws: WsService) {}
    }

    // FeatureModule imports WsModule and has a provider that injects the export.
    // Before the leaves-first scan fix, FeatureModule booted before WsModule's
    // export was propagated, throwing "Cannot resolve WsService in FeatureModule".
    @Module({ imports: [WsModule], providers: [LiveService] })
    class FeatureModule {}

    @Module({ imports: [FeatureModule] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)
    const live = app.resolveFromAny<LiveService>(LiveService)
    expect(live.ws).toBeInstanceOf(WsService)
  })

  it('should discover and resolve providers across imported modules', async () => {
    @Injectable()
    class FeatureController {}

    @Module({ providers: [FeatureController] })
    class FeatureModule {}

    @Module({ imports: [FeatureModule] })
    class AppModule {}

    const app = await LunaFactory.create(AppModule)

    expect(app.getAllTokens()).toContain(FeatureController)
    expect(app.resolveFromAny(FeatureController)).toBeInstanceOf(FeatureController)
  })
})

import 'reflect-metadata'

import { Controller, LunaMessage, On } from '@lunafw/common'
import { Injectable, Module } from '@lunafw/core'

import { TestingFactory } from '../../src/testing.factory'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

@Injectable()
class UserService {
  public findAll(): Array<{ id: number; name: string }> {
    return [{ id: 1, name: 'Alice' }]
  }
}

@Injectable()
@Controller('users')
class UserController {
  constructor(private readonly userService: UserService) {}

  @On('get', '/')
  public findAll(_message: LunaMessage): Array<{ id: number; name: string }> {
    return this.userService.findAll()
  }
}

@Module({ providers: [UserService, UserController] })
class AppModule {}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TestingFactory', () => {
  describe('createModule', () => {
    it('resolves providers from DI', async () => {
      const testModule = await TestingFactory.createModule(AppModule)
      const service = testModule.get(UserService)

      expect(service.findAll()).toHaveLength(1)
      expect(service.findAll()[0]).toEqual({ id: 1, name: 'Alice' })
    })

    it('dispatches to controller handlers via TestAdapter', async () => {
      const testModule = await TestingFactory.createModule(AppModule)
      const adapter = testModule.createAdapter()
      await testModule.start()

      const result = await adapter.dispatch('get', 'users', '/', {
        context: 'test',
        payload: {},
        metadata: {},
      })

      expect(result).toEqual([{ id: 1, name: 'Alice' }])
    })

    it('resolves the same instance from the container as dispatched to the controller', async () => {
      const testModule = await TestingFactory.createModule(AppModule)
      const adapter = testModule.createAdapter()
      await testModule.start()

      const service = testModule.get(UserService)
      const result = (await adapter.dispatch('get', 'users', '/', {
        context: 'test',
        payload: {},
        metadata: {},
      })) as Array<{ id: number; name: string }>

      expect(result).toEqual(service.findAll())
    })
  })
})

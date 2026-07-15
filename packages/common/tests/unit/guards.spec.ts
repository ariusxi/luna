import 'reflect-metadata'
import { LunaMessage } from '../../src/types/message.interface'
import { LunaGuard } from '../../src/guards/guard.interface'
import { GuardRejectionError } from '../../src/guards/guard-rejection.error'
import { Controller } from '../../src/decorators/controller.decorator'
import { On } from '../../src/decorators/on.decorator'
import { USE_GUARDS_METADATA, UseGuards } from '../../src/guards/use-guards.decorator'

class AllowGuard implements LunaGuard {
  canActivate(_message: LunaMessage): boolean { return true }
}

class DenyGuard implements LunaGuard {
  canActivate(_message: LunaMessage): boolean { return false }
}

class AsyncAllowGuard implements LunaGuard {
  async canActivate(_message: LunaMessage): Promise<boolean> { return true }
}

class AsyncDenyGuard implements LunaGuard {
  async canActivate(_message: LunaMessage): Promise<boolean> { return false }
}

const makeMessage = (): LunaMessage => ({ context: 'test', payload: {}, metadata: {} })

describe('LunaGuard', () => {
  it('AllowGuard returns true', () => {
    expect(new AllowGuard().canActivate(makeMessage())).toBe(true)
  })

  it('DenyGuard returns false', () => {
    expect(new DenyGuard().canActivate(makeMessage())).toBe(false)
  })

  it('AsyncAllowGuard resolves true', async () => {
    await expect(new AsyncAllowGuard().canActivate(makeMessage())).resolves.toBe(true)
  })

  it('AsyncDenyGuard resolves false', async () => {
    await expect(new AsyncDenyGuard().canActivate(makeMessage())).resolves.toBe(false)
  })
})

describe('GuardRejectionError', () => {
  it('is an instance of Error', () => {
    const error = new GuardRejectionError()
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('GuardRejectionError')
    expect(error.message).toBe('Guard rejected the request')
  })
})

describe('@UseGuards', () => {
  it('stores guard classes as class-level metadata', () => {
    @UseGuards(AllowGuard, DenyGuard)
    @Controller('test')
    class TestController {}

    const guards = Reflect.getMetadata(USE_GUARDS_METADATA, TestController)
    expect(guards).toEqual([AllowGuard, DenyGuard])
  })

  it('stores guard classes as method-level metadata', () => {
    class TestController {
      @UseGuards(AllowGuard)
      @On('get', '/')
      find(_message: LunaMessage) {}
    }

    const guards = Reflect.getMetadata(USE_GUARDS_METADATA, TestController.prototype, 'find')
    expect(guards).toEqual([AllowGuard])
  })

  it('does not bleed metadata between controllers', () => {
    @UseGuards(AllowGuard)
    class A {}

    @UseGuards(DenyGuard)
    class B {}

    expect(Reflect.getMetadata(USE_GUARDS_METADATA, A)).toEqual([AllowGuard])
    expect(Reflect.getMetadata(USE_GUARDS_METADATA, B)).toEqual([DenyGuard])
  })
})

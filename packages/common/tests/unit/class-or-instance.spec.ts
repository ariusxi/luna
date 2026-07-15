import 'reflect-metadata'
import { LunaMessage } from '../../src/types/message.interface'
import { LunaGuard } from '../../src/guards/guard.interface'
import { LunaPipe } from '../../src/pipes/pipe.interface'
import { LunaExecutionContext, LunaInterceptor } from '../../src/interceptors/interceptor.interface'
import { USE_GUARDS_METADATA, UseGuards } from '../../src/guards/use-guards.decorator'
import { USE_PIPES_METADATA, UsePipes } from '../../src/pipes/use-pipes.decorator'
import { USE_INTERCEPTORS_METADATA, UseInterceptors } from '../../src/interceptors/use-interceptors.decorator'

const msg = (): LunaMessage => ({ context: 'test', payload: {}, metadata: {} })

// ── shared fixtures ──────────────────────────────────────────────────────────

class GuardClass implements LunaGuard {
  canActivate(_m: LunaMessage) { return true }
}

class PipeClass implements LunaPipe {
  transform(m: LunaMessage) { return m }
}

class InterceptorClass implements LunaInterceptor {
  intercept(_ctx: LunaExecutionContext, next: () => Promise<unknown>) { return next() }
}

const guardInstance = new GuardClass()
const pipeInstance = new PipeClass()
const interceptorInstance = new InterceptorClass()

// ── @UseGuards ───────────────────────────────────────────────────────────────

describe('@UseGuards — class or instance', () => {
  it('accepts a class on a controller', () => {
    @UseGuards(GuardClass)
    class Ctrl {}
    expect(Reflect.getMetadata(USE_GUARDS_METADATA, Ctrl)).toEqual([GuardClass])
  })

  it('accepts an instance on a controller', () => {
    @UseGuards(guardInstance)
    class Ctrl {}
    expect(Reflect.getMetadata(USE_GUARDS_METADATA, Ctrl)).toEqual([guardInstance])
  })

  it('accepts mixed class and instance on a method', () => {
    class Ctrl {
      @UseGuards(GuardClass, guardInstance)
      handle(_m: LunaMessage) {}
    }
    const meta = Reflect.getMetadata(USE_GUARDS_METADATA, Ctrl.prototype, 'handle')
    expect(meta).toEqual([GuardClass, guardInstance])
  })

  it('the stored instance is the exact same reference', () => {
    @UseGuards(guardInstance)
    class Ctrl {}
    const [stored] = Reflect.getMetadata(USE_GUARDS_METADATA, Ctrl)
    expect(stored).toBe(guardInstance)
  })
})

// ── @UsePipes ────────────────────────────────────────────────────────────────

describe('@UsePipes — class or instance', () => {
  it('accepts a class on a controller', () => {
    @UsePipes(PipeClass)
    class Ctrl {}
    expect(Reflect.getMetadata(USE_PIPES_METADATA, Ctrl)).toEqual([PipeClass])
  })

  it('accepts an instance on a controller', () => {
    @UsePipes(pipeInstance)
    class Ctrl {}
    expect(Reflect.getMetadata(USE_PIPES_METADATA, Ctrl)).toEqual([pipeInstance])
  })

  it('accepts mixed class and instance on a method', () => {
    class Ctrl {
      @UsePipes(PipeClass, pipeInstance)
      handle(_m: LunaMessage) {}
    }
    const meta = Reflect.getMetadata(USE_PIPES_METADATA, Ctrl.prototype, 'handle')
    expect(meta).toEqual([PipeClass, pipeInstance])
  })

  it('the stored instance is the exact same reference', () => {
    @UsePipes(pipeInstance)
    class Ctrl {}
    const [stored] = Reflect.getMetadata(USE_PIPES_METADATA, Ctrl)
    expect(stored).toBe(pipeInstance)
  })
})

// ── @UseInterceptors ─────────────────────────────────────────────────────────

describe('@UseInterceptors — class or instance', () => {
  it('accepts a class on a controller', () => {
    @UseInterceptors(InterceptorClass)
    class Ctrl {}
    expect(Reflect.getMetadata(USE_INTERCEPTORS_METADATA, Ctrl)).toEqual([InterceptorClass])
  })

  it('accepts an instance on a controller', () => {
    @UseInterceptors(interceptorInstance)
    class Ctrl {}
    expect(Reflect.getMetadata(USE_INTERCEPTORS_METADATA, Ctrl)).toEqual([interceptorInstance])
  })

  it('accepts mixed class and instance on a method', () => {
    class Ctrl {
      @UseInterceptors(InterceptorClass, interceptorInstance)
      handle(_m: LunaMessage) {}
    }
    const meta = Reflect.getMetadata(USE_INTERCEPTORS_METADATA, Ctrl.prototype, 'handle')
    expect(meta).toEqual([InterceptorClass, interceptorInstance])
  })

  it('the stored instance is the exact same reference', () => {
    @UseInterceptors(interceptorInstance)
    class Ctrl {}
    const [stored] = Reflect.getMetadata(USE_INTERCEPTORS_METADATA, Ctrl)
    expect(stored).toBe(interceptorInstance)
  })
})

// ── guard canActivate callable on instance ───────────────────────────────────

describe('guard instance is callable', () => {
  it('canActivate works on a stored instance', () => {
    expect(guardInstance.canActivate(msg())).toBe(true)
  })
})

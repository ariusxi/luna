import 'reflect-metadata'
import { LunaMessage } from '../../src/types/message.interface'
import { LunaExecutionContext, LunaInterceptor } from '../../src/interceptors/interceptor.interface'
import { USE_INTERCEPTORS_METADATA, UseInterceptors } from '../../src/interceptors/use-interceptors.decorator'

const makeMessage = (payload: unknown = {}): LunaMessage => ({
  context: 'test',
  payload,
  metadata: { headers: {} },
})

describe('LunaInterceptor', () => {
  it('intercept calls next and returns its result', async () => {
    class PassthroughInterceptor implements LunaInterceptor {
      async intercept(_ctx: LunaExecutionContext, next: () => Promise<unknown>): Promise<unknown> {
        return next()
      }
    }

    const interceptor = new PassthroughInterceptor()
    const context: LunaExecutionContext = {
      getMessage: () => makeMessage(),
      getHandler: () => 'handle',
    }
    const result = await interceptor.intercept(context, async () => 'value')
    expect(result).toBe('value')
  })

  it('intercept can transform the result', async () => {
    class TransformInterceptor implements LunaInterceptor {
      async intercept(_ctx: LunaExecutionContext, next: () => Promise<unknown>): Promise<unknown> {
        const result = await next()
        return { data: result }
      }
    }

    const interceptor = new TransformInterceptor()
    const context: LunaExecutionContext = {
      getMessage: () => makeMessage(),
      getHandler: () => 'handle',
    }
    const result = await interceptor.intercept(context, async () => 'raw')
    expect(result).toEqual({ data: 'raw' })
  })

  it('LunaExecutionContext exposes message and handler name', () => {
    const message = makeMessage({ id: 1 })
    const context: LunaExecutionContext = {
      getMessage: () => message,
      getHandler: () => 'findOne',
    }
    expect(context.getMessage()).toBe(message)
    expect(context.getHandler()).toBe('findOne')
  })
})

describe('@UseInterceptors', () => {
  class InterceptorA implements LunaInterceptor {
    intercept(_ctx: LunaExecutionContext, next: () => Promise<unknown>) { return next() }
  }
  class InterceptorB implements LunaInterceptor {
    intercept(_ctx: LunaExecutionContext, next: () => Promise<unknown>) { return next() }
  }

  it('stores interceptor metadata on a class', () => {
    @UseInterceptors(InterceptorA)
    class MyController {}

    const meta = Reflect.getMetadata(USE_INTERCEPTORS_METADATA, MyController)
    expect(meta).toEqual([InterceptorA])
  })

  it('stores interceptor metadata on a method', () => {
    class MyController {
      @UseInterceptors(InterceptorA, InterceptorB)
      handle(_message: LunaMessage) { return {} }
    }

    const meta = Reflect.getMetadata(USE_INTERCEPTORS_METADATA, MyController.prototype, 'handle')
    expect(meta).toEqual([InterceptorA, InterceptorB])
  })

  it('class and method metadata are independent', () => {
    @UseInterceptors(InterceptorA)
    class MyController {
      @UseInterceptors(InterceptorB)
      handle(_message: LunaMessage) { return {} }
    }

    expect(Reflect.getMetadata(USE_INTERCEPTORS_METADATA, MyController)).toEqual([InterceptorA])
    expect(Reflect.getMetadata(USE_INTERCEPTORS_METADATA, MyController.prototype, 'handle')).toEqual([InterceptorB])
  })
})

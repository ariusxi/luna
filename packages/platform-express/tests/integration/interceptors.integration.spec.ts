import 'reflect-metadata'
import { Injectable, Module } from '@lunafw/core'
import {
  Controller,
  LunaExecutionContext,
  LunaFactory,
  LunaInterceptor,
  LunaMessage,
  On,
  UseInterceptors,
} from '@lunafw/common'
import { ExpressAdapter } from '../../src'

class WrapInterceptor implements LunaInterceptor {
  async intercept(_ctx: LunaExecutionContext, next: () => Promise<unknown>): Promise<unknown> {
    const result = await next()
    return { data: result }
  }
}

class TimingInterceptor implements LunaInterceptor {
  async intercept(_ctx: LunaExecutionContext, next: () => Promise<unknown>): Promise<unknown> {
    const result = await next()
    return { ...(result as object), timing: true }
  }
}

@Injectable()
@UseInterceptors(WrapInterceptor)
@Controller('posts')
class PostController {
  @On('get', '/')
  findAll(_message: LunaMessage) {
    return [{ id: 1 }]
  }

  @UseInterceptors(TimingInterceptor)
  @On('get', '/:id')
  findOne(_message: LunaMessage) {
    return { id: 1 }
  }
}

@Module({ providers: [PostController] })
class AppModule {}

describe('Interceptors integration', () => {
  let adapter: ExpressAdapter
  let baseUrl: string

  beforeAll(async () => {
    adapter = new ExpressAdapter({ port: 0 })
    const app = await LunaFactory.createApplication(AppModule, adapter)
    await app.start()
    baseUrl = `http://localhost:${adapter.getPort()}`
  })

  afterAll(async () => {
    await adapter.close()
  })

  it('wraps response with controller-level interceptor (WrapInterceptor)', async () => {
    const res = await fetch(`${baseUrl}/posts/`)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toEqual({ data: [{ id: 1 }] })
  })

  it('applies controller + method interceptors in order', async () => {
    const res = await fetch(`${baseUrl}/posts/1`)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toEqual({ data: { id: 1, timing: true } })
  })
})

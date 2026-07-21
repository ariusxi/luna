import 'reflect-metadata'
import { Injectable, Module } from '@lunafw/core'
import {
  Catch,
  Controller,
  LunaExceptionFilter,
  LunaFactory,
  LunaGuard,
  LunaInterceptor,
  LunaExecutionContext,
  LunaMessage,
  LunaPipe,
  On,
} from '@lunafw/common'
import { ExpressAdapter } from '../../src'
import { UnauthorizedException } from '@lunafw/common'

// ── global guard ──────────────────────────────────────────────────────────────

class TokenGuard implements LunaGuard {
  canActivate(message: LunaMessage): boolean {
    const headers = message.metadata.headers as Record<string, string>
    return !!headers['x-token']
  }
}

// ── global pipe ───────────────────────────────────────────────────────────────

class TagPipe implements LunaPipe {
  transform(message: LunaMessage): LunaMessage {
    return { ...message, payload: { ...(message.payload as object), tagged: true } }
  }
}

// ── global interceptor ────────────────────────────────────────────────────────

class WrapInterceptor implements LunaInterceptor {
  async intercept(_ctx: LunaExecutionContext, next: () => Promise<unknown>): Promise<unknown> {
    return { wrapped: await next() }
  }
}

// ── global filter ─────────────────────────────────────────────────────────────

class DomainError extends Error {}

@Catch(DomainError)
class GlobalDomainFilter implements LunaExceptionFilter<DomainError> {
  catch(exception: DomainError, _message: LunaMessage) {
    throw new UnauthorizedException(exception.message)
  }
}

// ── controller ────────────────────────────────────────────────────────────────

@Injectable()
@Controller('ping')
class PingController {
  @On('get', '/')
  ping(message: LunaMessage) {
    return { ok: true, payload: message.payload }
  }

  @On('post', '/')
  error(_message: LunaMessage) {
    throw new DomainError('global filter caught me')
  }
}

@Module({ providers: [PingController] })
class AppModule {}

describe('Global middleware integration', () => {
  let adapter: ExpressAdapter
  let baseUrl: string

  beforeAll(async () => {
    adapter = new ExpressAdapter({ port: 0 })
    const app = await LunaFactory.createApplication(AppModule, adapter)
    app
      .useGlobalGuards(new TokenGuard())
      .useGlobalPipes(new TagPipe())
      .useGlobalInterceptors(new WrapInterceptor())
      .useGlobalFilters(new GlobalDomainFilter())
    await app.start()
    baseUrl = `http://localhost:${adapter.getPort()}`
  })

  afterAll(async () => {
    await adapter.close()
  })

  it('global guard rejects request without x-token header (401)', async () => {
    const res = await fetch(`${baseUrl}/ping/`)
    expect(res.status).toBe(401)
  })

  it('global guard allows request with x-token header', async () => {
    const res = await fetch(`${baseUrl}/ping/`, { headers: { 'x-token': 'secret' } })
    expect(res.status).toBe(200)
  })

  it('global pipe tags payload', async () => {
    const res = await fetch(`${baseUrl}/ping/`, {
      headers: { 'x-token': 'secret', 'content-type': 'application/json' },
    })
    const body = await res.json()
    expect(body.wrapped.payload).toMatchObject({ tagged: true })
  })

  it('global interceptor wraps response', async () => {
    const res = await fetch(`${baseUrl}/ping/`, { headers: { 'x-token': 'secret' } })
    const body = await res.json()
    expect(body).toHaveProperty('wrapped')
  })

  it('global filter catches DomainError and throws UnauthorizedException (401)', async () => {
    const res = await fetch(`${baseUrl}/ping/`, {
      method: 'POST',
      headers: { 'x-token': 'secret' },
    })
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.message).toBe('global filter caught me')
  })
})

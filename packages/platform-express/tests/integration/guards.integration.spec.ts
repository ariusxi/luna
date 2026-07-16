import 'reflect-metadata'
import { Injectable, Module } from '@lunafw/core'
import { Controller, LunaFactory, LunaGuard, LunaMessage, On, UseGuards } from '@lunafw/common'
import { ExpressAdapter } from '../../src'

class AuthGuard implements LunaGuard {
  canActivate(message: LunaMessage): boolean {
    const headers = message.metadata.headers as Record<string, string>
    return !!headers['authorization']
  }
}

class RolesGuard implements LunaGuard {
  canActivate(message: LunaMessage): boolean {
    const headers = message.metadata.headers as Record<string, string>
    return headers['x-role'] === 'admin'
  }
}

@Injectable()
@UseGuards(AuthGuard)
@Controller('protected')
class ProtectedController {
  @On('get', '/')
  findAll(_message: LunaMessage) {
    return { data: 'secret' }
  }

  @UseGuards(RolesGuard)
  @On('delete', '/:id')
  remove(_message: LunaMessage) {
    return { removed: true }
  }
}

@Module({ providers: [ProtectedController] })
class AppModule {}

describe('Guards integration', () => {
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

  describe('controller-level guard', () => {
    it('allows request when authorization header is present', async () => {
      const res = await fetch(`${baseUrl}/protected/`, {
        headers: { authorization: 'Bearer token123' },
      })
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body).toEqual({ data: 'secret' })
    })

    it('rejects request when authorization header is missing', async () => {
      const res = await fetch(`${baseUrl}/protected/`)
      const body = await res.json()
      expect(res.status).toBe(401)
      expect(body).toEqual({ statusCode: 401, message: 'Unauthorized' })
    })
  })

  describe('method-level guard stacked on controller guard', () => {
    it('allows request when both guards pass', async () => {
      const res = await fetch(`${baseUrl}/protected/1`, {
        method: 'DELETE',
        headers: { authorization: 'Bearer token123', 'x-role': 'admin' },
      })
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body).toEqual({ removed: true })
    })

    it('rejects when controller guard fails', async () => {
      const res = await fetch(`${baseUrl}/protected/1`, {
        method: 'DELETE',
        headers: { 'x-role': 'admin' },
      })
      expect(res.status).toBe(401)
    })

    it('rejects when method guard fails', async () => {
      const res = await fetch(`${baseUrl}/protected/1`, {
        method: 'DELETE',
        headers: { authorization: 'Bearer token123', 'x-role': 'user' },
      })
      expect(res.status).toBe(401)
    })
  })
})

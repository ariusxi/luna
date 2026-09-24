import 'reflect-metadata'
import { Injectable, Module } from '@lunafw/core'
import { Controller, LunaFactory, On, Param } from '@lunafw/common'

import { ExpressAdapter } from '../../src'

@Injectable()
@Controller('files')
class FileController {
  @On('get', '/health')
  health() {
    return { status: 'ok' }
  }

  @On('get', '/*filepath')
  file(@Param('filepath') filepath: string) {
    return { filepath }
  }
}

@Injectable()
@Controller()
class FallbackController {
  @On('get', '*')
  fallback(@Param('wildcard') wildcard: string) {
    return { wildcard }
  }
}

@Module({ providers: [FileController, FallbackController] })
class AppModule {}

describe('Express wildcard routes', () => {
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

  it('exposes a named multi-segment wildcard through @Param', async () => {
    const response = await fetch(`${baseUrl}/files/images/avatars/user.png`)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ filepath: 'images/avatars/user.png' })
  })

  it('keeps concrete routes ahead of wildcard routes', async () => {
    const response = await fetch(`${baseUrl}/files/health`)

    expect(await response.json()).toEqual({ status: 'ok' })
  })

  it('supports an anonymous application-wide fallback', async () => {
    const response = await fetch(`${baseUrl}/missing/nested/path`)

    expect(await response.json()).toEqual({ wildcard: 'missing/nested/path' })
  })
})

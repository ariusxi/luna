import 'reflect-metadata'
import { Module, Injectable } from '@lunafw/core'
import { Controller, HttpCode, LunaFactory, On } from '@lunafw/common'

import { ExpressAdapter } from '../../src'

@Injectable()
@Controller('widgets')
class WidgetController {
  @On('post', '/')
  @HttpCode(201)
  create(): { created: boolean } {
    return { created: true }
  }

  @On('get', '/')
  list(): { items: [] } {
    return { items: [] }
  }
}

@Module({ providers: [WidgetController] })
class AppModule {}

describe('@HttpCode integration', () => {
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

  it('applies the @HttpCode status on success', async () => {
    const res = await fetch(`${baseUrl}/widgets/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ created: true })
  })

  it('defaults to 200 for handlers without @HttpCode', async () => {
    const res = await fetch(`${baseUrl}/widgets/`)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ items: [] })
  })
})

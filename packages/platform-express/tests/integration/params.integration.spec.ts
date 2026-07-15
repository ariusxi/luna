import 'reflect-metadata'
import { Injectable, Module } from '@lunafw/core'
import {
  Body,
  Controller,
  Headers,
  LunaFactory,
  LunaMessage,
  Message,
  On,
  Param,
  Query,
} from '@lunafw/common'
import { ExpressAdapter } from '../../src'

@Injectable()
@Controller('items')
class ItemController {
  @On('post', '/')
  create(@Body() body: unknown) {
    return { received: body }
  }

  @On('get', '/search')
  search(@Query() query: unknown) {
    return { query }
  }

  @On('get', '/:id')
  findOne(@Param('id') id: string, @Query('expand') expand: string) {
    return { id, expand }
  }

  @On('get', '/auth/me')
  me(@Headers('authorization') token: string) {
    return { token }
  }

  @On('delete', '/:id')
  remove(@Param('id') id: string, @Message() message: LunaMessage) {
    return { id, context: message.context }
  }
}

@Module({ providers: [ItemController] })
class AppModule {}

describe('Parameter decorators integration', () => {
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

  it('@Body() injects the full request body', async () => {
    const res = await fetch(`${baseUrl}/items/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'luna' }),
    })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json).toEqual({ received: { name: 'luna' } })
  })

  it('@Query() injects the full query string object', async () => {
    const res = await fetch(`${baseUrl}/items/search?page=1&sort=asc`)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.query).toMatchObject({ page: '1', sort: 'asc' })
  })

  it('@Param("id") and @Query("expand") inject specific values', async () => {
    const res = await fetch(`${baseUrl}/items/42?expand=true`)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json).toEqual({ id: '42', expand: 'true' })
  })

  it('@Headers("authorization") injects the header value', async () => {
    const res = await fetch(`${baseUrl}/items/auth/me`, {
      headers: { authorization: 'Bearer secret' },
    })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.token).toBe('Bearer secret')
  })

  it('@Message() injects the full LunaMessage alongside @Param', async () => {
    const res = await fetch(`${baseUrl}/items/7`, { method: 'DELETE' })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json).toEqual({ id: '7', context: 'http' })
  })
})

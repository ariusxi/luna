import 'reflect-metadata'
import { Injectable, Module } from '@lunafw/core'
import {
  Controller,
  LunaFactory,
  LunaMessage,
  LunaPipe,
  On,
  UsePipes,
} from '@lunafw/common'
import { ExpressAdapter } from '../../src'

class UppercasePipe implements LunaPipe {
  transform(message: LunaMessage): LunaMessage {
    const payload = message.payload as { name?: string }
    return { ...message, payload: { ...payload, name: String(payload?.name ?? '').toUpperCase() } }
  }
}

class TrimPipe implements LunaPipe {
  transform(message: LunaMessage): LunaMessage {
    const payload = message.payload as { name?: string }
    return { ...message, payload: { ...payload, name: String(payload?.name ?? '').trim() } }
  }
}

@Injectable()
@UsePipes(TrimPipe)
@Controller('items')
class ItemController {
  @On('post', '/trim')
  findAll(message: LunaMessage) {
    const payload = message.payload as { name?: string }
    return { name: payload?.name ?? '' }
  }

  @UsePipes(UppercasePipe)
  @On('post', '/upper')
  create(message: LunaMessage) {
    const payload = message.payload as { name?: string }
    return { name: payload?.name ?? '' }
  }
}

@Module({ providers: [ItemController] })
class AppModule {}

describe('Pipes integration', () => {
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

  it('applies controller-level pipe (TrimPipe) to POST /trim', async () => {
    const res = await fetch(`${baseUrl}/items/trim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '  hello  ' }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.name).toBe('hello')
  })

  it('applies controller + method pipes in order (TrimPipe then UppercasePipe) to POST /upper', async () => {
    const res = await fetch(`${baseUrl}/items/upper`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '  world  ' }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.name).toBe('WORLD')
  })
})

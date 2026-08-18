import 'reflect-metadata'
import { Module, Injectable } from '@lunafw/core'
import { Body, Controller, LunaFactory, On, RawBody } from '@lunafw/common'

import { ExpressAdapter } from '../../src'

@Injectable()
@Controller('hooks')
class HookController {
  @On('post', '/')
  receive(
    @RawBody() raw: Buffer | undefined,
    @Body() parsed: { name?: string },
  ): { isBuffer: boolean; raw: string; parsedName: string } {
    return {
      isBuffer: Buffer.isBuffer(raw),
      raw: raw ? raw.toString('utf8') : '',
      parsedName: parsed?.name ?? '',
    }
  }
}

@Module({ providers: [HookController] })
class AppModule {}

describe('@RawBody integration', () => {
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

  it('exposes the exact received bytes to @RawBody while still parsing @Body', async () => {
    // A deliberately non-canonical JSON string: extra spaces a re-serialize
    // would drop. @RawBody must preserve it byte-for-byte (what signature
    // verification depends on), while @Body sees the parsed object.
    const payload = '{"name":   "luna"}'

    const res = await fetch(`${baseUrl}/hooks/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.isBuffer).toBe(true)
    expect(body.raw).toBe(payload)
    expect(body.parsedName).toBe('luna')
  })
})

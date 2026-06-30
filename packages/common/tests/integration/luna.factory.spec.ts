import 'reflect-metadata'
import { Module, Injectable } from '@lunafw/core'
import { LunaFactory } from '../../src/factory/luna.factory'
import { LunaApplication } from '../../src/factory/luna.application'
import { AbstractAdapter } from '../../src/types/adapter.abstract'
import { LunaHandler } from '../../src/types/handler.interface'

class MockAdapter extends AbstractAdapter {
  public listening = false
  public closed = false
  register(_handler: LunaHandler, _metadata: Record<string, unknown>): void {}
  async listen() { this.listening = true }
  async close() { this.closed = true }
}

@Injectable()
class AppService {
  greet() { return 'hello' }
}

@Module({ providers: [AppService] })
class AppModule {}

describe('LunaFactory.createApplication', () => {
  it('returns a LunaApplication instance', async () => {
    const app = await LunaFactory.createApplication(AppModule, new MockAdapter())
    expect(app).toBeInstanceOf(LunaApplication)
  })

  it('accepts a single adapter', async () => {
    const adapter = new MockAdapter()
    const app = await LunaFactory.createApplication(AppModule, adapter)
    await app.start()
    expect(adapter.listening).toBe(true)
  })

  it('accepts an array of adapters and starts all of them', async () => {
    const adapter1 = new MockAdapter()
    const adapter2 = new MockAdapter()
    const app = await LunaFactory.createApplication(AppModule, [adapter1, adapter2])
    await app.start()
    expect(adapter1.listening).toBe(true)
    expect(adapter2.listening).toBe(true)
  })

  it('calls close on all adapters', async () => {
    const adapter1 = new MockAdapter()
    const adapter2 = new MockAdapter()
    const app = await LunaFactory.createApplication(AppModule, [adapter1, adapter2])
    await app.close()
    expect(adapter1.closed).toBe(true)
    expect(adapter2.closed).toBe(true)
  })
})

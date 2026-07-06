import { LunaApplication } from '../../src/factory/luna.application'
import { AbstractAdapter } from '../../src/types/adapter.abstract'
import { HandlerMetadata } from '../../src/types/handler-metadata.interface'
import { LunaHandler } from '../../src/types/handler.interface'

class MockCoreApplication {
  public started = false
  async start() { this.started = true }
  getTokens() { return [] }
  get<T>(_token: any): T { return {} as T }
}

class MockAdapter extends AbstractAdapter {
  public listening = false
  public closed = false
  register(_handler: LunaHandler, _metadata: HandlerMetadata): void {}
  async listen() { this.listening = true }
  async close() { this.closed = true }
}

describe('LunaApplication', () => {
  it('calls core.start() and listen() on all adapters when start() is called', async () => {
    const core = new MockCoreApplication()
    const adapter1 = new MockAdapter()
    const adapter2 = new MockAdapter()
    const app = new LunaApplication(core as any, [adapter1, adapter2])

    await app.start()

    expect(core.started).toBe(true)
    expect(adapter1.listening).toBe(true)
    expect(adapter2.listening).toBe(true)
  })

  it('calls close() on all adapters when close() is called', async () => {
    const core = new MockCoreApplication()
    const adapter1 = new MockAdapter()
    const adapter2 = new MockAdapter()
    const app = new LunaApplication(core as any, [adapter1, adapter2])

    await app.close()

    expect(adapter1.closed).toBe(true)
    expect(adapter2.closed).toBe(true)
  })

  it('handles a single adapter', async () => {
    const core = new MockCoreApplication()
    const adapter = new MockAdapter()
    const app = new LunaApplication(core as any, [adapter])

    await app.start()
    await app.close()

    expect(adapter.listening).toBe(true)
    expect(adapter.closed).toBe(true)
  })
})

import { AbstractAdapter } from '../../src/types/adapter.abstract'
import { HandlerMetadata } from '../../src/types/handler-metadata.interface'
import { LunaHandler } from '../../src/types/handler.interface'

class TestAdapter extends AbstractAdapter {
  public registered: Array<{ handler: LunaHandler; metadata: HandlerMetadata }> = []
  public listening = false
  public closed = false

  register(handler: LunaHandler, metadata: HandlerMetadata): void {
    this.registered.push({ handler, metadata })
  }

  async listen(): Promise<void> {
    this.listening = true
  }

  async close(): Promise<void> {
    this.closed = true
  }
}

describe('AbstractAdapter', () => {
  it('can be extended and register is called with handler and metadata', () => {
    const adapter = new TestAdapter()
    const handler: LunaHandler = { handle: async () => 'ok' }
    const metadata: HandlerMetadata = { event: 'get', prefix: 'users', path: '/' }

    adapter.register(handler, metadata)

    expect(adapter.registered).toHaveLength(1)
    expect(adapter.registered[0].handler).toBe(handler)
    expect(adapter.registered[0].metadata).toEqual(metadata)
  })

  it('sets listening to true after listen()', async () => {
    const adapter = new TestAdapter()
    await adapter.listen()
    expect(adapter.listening).toBe(true)
  })

  it('sets closed to true after close()', async () => {
    const adapter = new TestAdapter()
    await adapter.close()
    expect(adapter.closed).toBe(true)
  })

  it('accepts multiple handler registrations', () => {
    const adapter = new TestAdapter()
    const h1: LunaHandler = { handle: async () => 1 }
    const h2: LunaHandler = { handle: async () => 2 }

    adapter.register(h1, { event: 'get', prefix: 'users', path: '/' })
    adapter.register(h2, { event: 'post', prefix: 'users', path: '/' })

    expect(adapter.registered).toHaveLength(2)
  })
})

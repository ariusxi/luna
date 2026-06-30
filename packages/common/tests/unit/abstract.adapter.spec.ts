import { AbstractAdapter } from '../../src/types/adapter.abstract'
import { LunaHandler } from '../../src/types/handler.interface'
import { LunaMessage } from '../../src/types/message.interface'

class TestAdapter extends AbstractAdapter {
  public registered: Array<{ handler: LunaHandler; metadata: Record<string, unknown> }> = []
  public listening = false
  public closed = false

  register(handler: LunaHandler, metadata: Record<string, unknown>): void {
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
    const metadata = { method: 'GET', path: '/users' }

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

    adapter.register(h1, { event: 'connect' })
    adapter.register(h2, { event: 'message' })

    expect(adapter.registered).toHaveLength(2)
  })
})

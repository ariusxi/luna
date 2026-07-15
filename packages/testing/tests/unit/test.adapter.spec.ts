import 'reflect-metadata'

import { HandlerMetadata, LunaHandler, LunaMessage } from '@lunafw/common'

import { TestAdapter } from '../../src/adapters/test.adapter'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHandler(returnValue: unknown): LunaHandler {
  return {
    handle: async (_message: LunaMessage) => returnValue,
  }
}

function makeMetadata(event: string, prefix: string, path: string): HandlerMetadata {
  return { event, prefix, path }
}

const sampleMessage: LunaMessage = { context: 'test', payload: {}, metadata: {} }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TestAdapter', () => {
  let adapter: TestAdapter

  beforeEach(() => {
    adapter = new TestAdapter()
  })

  describe('register + dispatch', () => {
    it('dispatches a message to a registered handler and returns the result', async () => {
      adapter.register(makeHandler('pong'), makeMetadata('get', 'health', '/'))

      const result = await adapter.dispatch('get', 'health', '/', sampleMessage)

      expect(result).toBe('pong')
    })

    it('passes the message to the handler unchanged', async () => {
      let received: LunaMessage | undefined

      const handler: LunaHandler = {
        handle: async (msg: LunaMessage) => {
          received = msg
          return null
        },
      }

      adapter.register(handler, makeMetadata('post', 'items', '/create'))

      const message: LunaMessage = { context: 'ctx', payload: { foo: 'bar' }, metadata: { x: '1' } }
      await adapter.dispatch('post', 'items', '/create', message)

      expect(received).toBe(message)
    })

    it('supports multiple handlers on different routes', async () => {
      adapter.register(makeHandler('a'), makeMetadata('get', 'x', '/a'))
      adapter.register(makeHandler('b'), makeMetadata('get', 'x', '/b'))

      expect(await adapter.dispatch('get', 'x', '/a', sampleMessage)).toBe('a')
      expect(await adapter.dispatch('get', 'x', '/b', sampleMessage)).toBe('b')
    })
  })

  describe('dispatch errors', () => {
    it('throws a descriptive error when no handler matches the route', async () => {
      await expect(
        adapter.dispatch('delete', 'users', '/99', sampleMessage),
      ).rejects.toThrow(/no handler registered for route "delete:users:\/99"/)
    })

    it('throws an error that mentions the missing route key', async () => {
      await expect(
        adapter.dispatch('put', 'orders', '/update', sampleMessage),
      ).rejects.toThrow('put:orders:/update')
    })
  })

  describe('listen / close', () => {
    it('listen resolves without error (no-op)', async () => {
      await expect(adapter.listen()).resolves.toBeUndefined()
    })

    it('close resolves without error (no-op)', async () => {
      await expect(adapter.close()).resolves.toBeUndefined()
    })
  })
})

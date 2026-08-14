import 'reflect-metadata'
import { HandlerMetadata, LunaHandler, LunaMessage } from '@lunafw/common'

import { ExpressAdapter } from '../../src/adapters'

describe('ExpressAdapter', () => {
  let adapter: ExpressAdapter

  beforeEach(() => {
    adapter = new ExpressAdapter({ port: 0 })
  })

  afterEach(async () => {
    await adapter.close().catch(() => {})
  })

  describe('register', () => {
    it('stores a handler with its metadata', () => {
      const handler: LunaHandler = { handle: async () => ({ ok: true }) }
      const metadata: HandlerMetadata = { event: 'get', prefix: 'users', path: '/' }

      adapter.register(handler, metadata)

      expect(adapter.getHandlers()).toHaveLength(1)
      expect(adapter.getHandlers()[0].handler).toBe(handler)
      expect(adapter.getHandlers()[0].metadata).toEqual(metadata)
    })

    it('stores multiple handlers', () => {
      const h1: LunaHandler = { handle: async () => 'a' }
      const h2: LunaHandler = { handle: async () => 'b' }

      adapter.register(h1, { event: 'get', prefix: 'users', path: '/' })
      adapter.register(h2, { event: 'post', prefix: 'users', path: '/' })

      expect(adapter.getHandlers()).toHaveLength(2)
    })
  })

  describe('listen / close', () => {
    it('starts and closes the server without error', async () => {
      await expect(adapter.listen()).resolves.toBeUndefined()
      await expect(adapter.close()).resolves.toBeUndefined()
    })

    it('exposes the port after listen()', async () => {
      await adapter.listen()
      expect(adapter.getPort()).toBeGreaterThan(0)
      await adapter.close()
    })

    it('throws when getPort() is called before listen()', () => {
      expect(() => adapter.getPort()).toThrow('Server is not listening')
    })
  })

  describe('route handling', () => {
    it('calls handler.handle with a LunaMessage and returns json', async () => {
      const handle = jest.fn(async (msg: LunaMessage) => ({ received: msg.payload }))
      adapter.register({ handle }, { event: 'post', prefix: 'items', path: '/' })

      await adapter.listen()

      const res = await fetch(`http://localhost:${adapter.getPort()}/items/`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'luna' }),
      })

      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body).toEqual({ received: { name: 'luna' } })
      expect(handle).toHaveBeenCalledTimes(1)

      const message: LunaMessage = handle.mock.calls[0][0]
      expect(message.context).toBe('http')
      expect(message.payload).toEqual({ name: 'luna' })

      await adapter.close()
    })

    it('passes params, query and headers in metadata', async () => {
      const handle = jest.fn(async (msg: LunaMessage) => msg.metadata)
      adapter.register({ handle }, { event: 'get', prefix: 'users', path: '/:id' })

      await adapter.listen()

      await fetch(`http://localhost:${adapter.getPort()}/users/42?page=2`, {
        headers: { 'x-custom': 'yes' },
      })

      const message: LunaMessage = handle.mock.calls[0][0]
      expect((message.metadata.params as Record<string, string>).id).toBe('42')
      expect((message.metadata.query as Record<string, string>).page).toBe('2')
      expect((message.metadata.headers as Record<string, string>)['x-custom']).toBe('yes')

      await adapter.close()
    })
  })

  describe('getApp', () => {
    it('exposes the underlying express app for raw (non-JSON) middleware', async () => {
      adapter.getApp().get('/raw-docs', (_request, response) => {
        response.status(200).type('html').send('<h1>docs</h1>')
      })

      await adapter.listen()

      const res = await fetch(`http://localhost:${adapter.getPort()}/raw-docs`)
      const text = await res.text()
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/html')
      expect(text).toContain('<h1>docs</h1>')

      await adapter.close()
    })
  })
})

import { createServer, type Server } from 'http'
import { WebSocket } from 'ws'

import { WsAdapter } from '../../src'

// Verifies the WsAdapter can attach to an existing HTTP server and share its
// port (the single-port setup required by hosts like Render), serving the WS
// upgrade on a path alongside plain HTTP on the same port.
describe('WsAdapter attached to a shared HTTP server', () => {
  let httpServer: Server
  let adapter: WsAdapter
  let port: number

  beforeAll(async () => {
    httpServer = createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/plain' })
      res.end('http-ok')
    })
    await new Promise<void>((resolve) => httpServer.listen(0, resolve))
    const address = httpServer.address()
    port = typeof address === 'object' && address ? address.port : 0

    adapter = new WsAdapter({ server: () => httpServer, path: '/ws' })
    await adapter.listen()
  })

  afterAll(async () => {
    await adapter.close()
    await new Promise<void>((resolve) => httpServer.close(() => resolve()))
  })

  it('reports the shared HTTP port', () => {
    expect(adapter.getPort()).toBe(port)
  })

  it('still serves plain HTTP on the same port', async () => {
    const res = await fetch(`http://localhost:${port}/`)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('http-ok')
  })

  it('accepts a WebSocket upgrade on /ws and delivers a broadcast', async () => {
    const socket = new WebSocket(`ws://localhost:${port}/ws`)
    await new Promise<void>((resolve, reject) => {
      socket.once('open', () => resolve())
      socket.once('error', reject)
    })
    expect(socket.readyState).toBe(WebSocket.OPEN)

    const received = new Promise<string>((resolve) => socket.once('message', (raw) => resolve(raw.toString())))
    adapter.broadcast({ event: 'ping', data: { hello: true } })
    expect(JSON.parse(await received)).toEqual({ event: 'ping', data: { hello: true } })

    socket.close()
  })
})

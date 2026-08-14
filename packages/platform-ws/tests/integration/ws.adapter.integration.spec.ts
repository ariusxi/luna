import 'reflect-metadata'
import WebSocket from 'ws'
import { Module, Injectable } from '@lunafw/core'
import { Controller, LunaFactory, LunaMessage, On } from '@lunafw/common'

import { WsAdapter } from '../../src'

interface EchoResponse {
  echo: unknown
}

interface SumPayload {
  a: number
  b: number
}

interface SumResponse {
  result: number
}

interface SocketIdentityResponse {
  socketId: string
}

@Injectable()
class ChatService {
  echo(data: unknown): EchoResponse {
    return { echo: data }
  }

  sum(payload: SumPayload): SumResponse {
    return { result: payload.a + payload.b }
  }
}

@Injectable()
@Controller('chat')
class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @On('send', '/')
  send(message: LunaMessage): EchoResponse {
    return this.chatService.echo(message.payload)
  }

  @On('sum', '/')
  sum(message: LunaMessage): SumResponse {
    return this.chatService.sum(message.payload as SumPayload)
  }

  @On('identity', '/')
  identity(message: LunaMessage): SocketIdentityResponse {
    return { socketId: message.metadata.socketId as string }
  }
}

@Module({ providers: [ChatService, ChatController] })
class AppModule {}

/** Opens a WS connection and returns a helper that sends / awaits the next message. */
function connect(port: number): Promise<{
  send: (event: string, data: unknown) => void
  nextMessage: () => Promise<string>
  close: () => void
}> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}`)

    const messageQueue: string[] = []
    const waiters: Array<(msg: string) => void> = []

    ws.on('message', (raw: Buffer) => {
      const msg = raw.toString('utf8')
      const waiter = waiters.shift()
      if (waiter) {
        waiter(msg)
      } else {
        messageQueue.push(msg)
      }
    })

    ws.on('open', () => {
      resolve({
        send(event: string, data: unknown): void {
          ws.send(JSON.stringify({ event, data }))
        },
        nextMessage(): Promise<string> {
          return new Promise((res) => {
            const queued = messageQueue.shift()
            if (queued !== undefined) {
              res(queued)
            } else {
              waiters.push(res)
            }
          })
        },
        close(): void {
          ws.close()
        },
      })
    })

    ws.on('error', reject)
  })
}

describe('WsAdapter integration', () => {
  let adapter: WsAdapter

  beforeAll(async () => {
    adapter = new WsAdapter({ port: 0 })
    const app = await LunaFactory.createApplication(AppModule, adapter)
    await app.start()
  })

  afterAll(async () => {
    await adapter.close()
  })

  it('routes chat.send to ChatController.send and returns the echo', async () => {
    const client = await connect(adapter.getPort())

    client.send('chat.send', { message: 'hello' })
    const raw = await client.nextMessage()
    const response = JSON.parse(raw) as EchoResponse

    expect(response).toEqual({ echo: { message: 'hello' } })

    client.close()
  })

  it('routes chat.sum to ChatController.sum and returns the sum', async () => {
    const client = await connect(adapter.getPort())

    client.send('chat.sum', { a: 3, b: 7 })
    const raw = await client.nextMessage()
    const response = JSON.parse(raw) as SumResponse

    expect(response).toEqual({ result: 10 })

    client.close()
  })

  it('silently ignores unknown events without crashing', async () => {
    const client = await connect(adapter.getPort())

    client.send('unknown.event', { foo: 'bar' })

    // Give the server a moment to process — no response expected
    await new Promise<void>((resolve) => setTimeout(resolve, 100))

    // Server is still up: a valid message still works
    client.send('chat.send', 'ping')
    const raw = await client.nextMessage()
    const response = JSON.parse(raw) as EchoResponse
    expect(response).toEqual({ echo: 'ping' })

    client.close()
  })

  it('handles multiple concurrent clients independently', async () => {
    const clientA = await connect(adapter.getPort())
    const clientB = await connect(adapter.getPort())

    clientA.send('chat.send', 'from-A')
    clientB.send('chat.send', 'from-B')

    const [rawA, rawB] = await Promise.all([clientA.nextMessage(), clientB.nextMessage()])

    expect(JSON.parse(rawA)).toEqual({ echo: 'from-A' })
    expect(JSON.parse(rawB)).toEqual({ echo: 'from-B' })

    clientA.close()
    clientB.close()
  })

  it('broadcasts server-originated events to connected clients', async () => {
    const clientA = await connect(adapter.getPort())
    const clientB = await connect(adapter.getPort())

    const delivered = adapter.broadcast({
      event: 'mind-map.changed',
      data: { room: 'study-room' },
    })
    const [rawA, rawB] = await Promise.all([clientA.nextMessage(), clientB.nextMessage()])

    expect(delivered).toBe(2)
    expect(JSON.parse(rawA)).toEqual({
      event: 'mind-map.changed',
      data: { room: 'study-room' },
    })
    expect(JSON.parse(rawB)).toEqual({
      event: 'mind-map.changed',
      data: { room: 'study-room' },
    })

    clientA.close()
    clientB.close()
  })

  it('sends a server-originated event to one socket', async () => {
    const client = await connect(adapter.getPort())
    client.send('chat.identity', null)
    const identity = JSON.parse(await client.nextMessage()) as SocketIdentityResponse

    const delivered = adapter.send(identity.socketId, {
      event: 'mind-map.changed',
      data: { room: 'study-room' },
    })

    expect(delivered).toBe(true)
    expect(JSON.parse(await client.nextMessage())).toEqual({
      event: 'mind-map.changed',
      data: { room: 'study-room' },
    })

    client.close()
  })

  it('getPort returns the OS-assigned port', () => {
    const port = adapter.getPort()
    expect(typeof port).toBe('number')
    expect(port).toBeGreaterThan(0)
  })
})

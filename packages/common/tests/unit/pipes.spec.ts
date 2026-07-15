import 'reflect-metadata'
import { LunaMessage } from '../../src/types/message.interface'
import { LunaPipe } from '../../src/pipes/pipe.interface'
import { USE_PIPES_METADATA, UsePipes } from '../../src/pipes/use-pipes.decorator'

const makeMessage = (payload: unknown = {}): LunaMessage => ({
  context: 'test',
  payload,
  metadata: { headers: {} },
})

describe('LunaPipe', () => {
  it('transform returns the message synchronously', () => {
    class UppercasePipe implements LunaPipe {
      transform(message: LunaMessage): LunaMessage {
        return { ...message, payload: String(message.payload).toUpperCase() }
      }
    }

    const pipe = new UppercasePipe()
    const result = pipe.transform(makeMessage('hello'))
    expect(result.payload).toBe('HELLO')
  })

  it('transform can return a promise', async () => {
    class AsyncPipe implements LunaPipe {
      async transform(message: LunaMessage): Promise<LunaMessage> {
        return { ...message, payload: 'async' }
      }
    }

    const pipe = new AsyncPipe()
    const result = await pipe.transform(makeMessage())
    expect(result.payload).toBe('async')
  })
})

describe('@UsePipes', () => {
  class PipeA implements LunaPipe {
    transform(m: LunaMessage): LunaMessage { return m }
  }
  class PipeB implements LunaPipe {
    transform(m: LunaMessage): LunaMessage { return m }
  }

  it('stores pipe metadata on a class', () => {
    @UsePipes(PipeA)
    class MyController {}

    const meta = Reflect.getMetadata(USE_PIPES_METADATA, MyController)
    expect(meta).toEqual([PipeA])
  })

  it('stores pipe metadata on a method', () => {
    class MyController {
      @UsePipes(PipeA, PipeB)
      handle(_message: LunaMessage) { return {} }
    }

    const meta = Reflect.getMetadata(USE_PIPES_METADATA, MyController.prototype, 'handle')
    expect(meta).toEqual([PipeA, PipeB])
  })

  it('class and method metadata are independent', () => {
    @UsePipes(PipeA)
    class MyController {
      @UsePipes(PipeB)
      handle(_message: LunaMessage) { return {} }
    }

    expect(Reflect.getMetadata(USE_PIPES_METADATA, MyController)).toEqual([PipeA])
    expect(Reflect.getMetadata(USE_PIPES_METADATA, MyController.prototype, 'handle')).toEqual([PipeB])
  })
})

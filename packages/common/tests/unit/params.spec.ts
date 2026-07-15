import 'reflect-metadata'
import { LunaMessage } from '../../src/types/message.interface'
import {
  Body,
  Headers,
  Message,
  PARAM_METADATA,
  Param,
  ParamMetadata,
  Query,
  resolveParams,
} from '../../src/params/param.decorator'

const msg = (overrides: Partial<LunaMessage> = {}): LunaMessage => ({
  context: 'test',
  payload: { name: 'luna', age: 1 },
  metadata: {
    params: { id: '42' },
    query: { page: '2', limit: '10' },
    headers: { authorization: 'Bearer token', 'x-role': 'admin' },
  },
  ...overrides,
})

// ── decorator metadata storage ────────────────────────────────────────────────

describe('Parameter decorator metadata', () => {
  it('@Body() stores metadata at the correct index', () => {
    class Ctrl {
      handle(@Body() _body: unknown) {}
    }
    const meta: ParamMetadata[] = Reflect.getMetadata(PARAM_METADATA, Ctrl.prototype, 'handle')
    expect(meta).toContainEqual({ index: 0, type: 'body', key: undefined })
  })

  it('@Body("name") stores key', () => {
    class Ctrl {
      handle(@Body('name') _name: string) {}
    }
    const meta: ParamMetadata[] = Reflect.getMetadata(PARAM_METADATA, Ctrl.prototype, 'handle')
    expect(meta).toContainEqual({ index: 0, type: 'body', key: 'name' })
  })

  it('@Query() stores metadata', () => {
    class Ctrl {
      handle(@Query() _q: unknown) {}
    }
    const meta: ParamMetadata[] = Reflect.getMetadata(PARAM_METADATA, Ctrl.prototype, 'handle')
    expect(meta).toContainEqual({ index: 0, type: 'query', key: undefined })
  })

  it('@Param("id") stores key', () => {
    class Ctrl {
      handle(@Param('id') _id: string) {}
    }
    const meta: ParamMetadata[] = Reflect.getMetadata(PARAM_METADATA, Ctrl.prototype, 'handle')
    expect(meta).toContainEqual({ index: 0, type: 'param', key: 'id' })
  })

  it('@Headers("authorization") stores key', () => {
    class Ctrl {
      handle(@Headers('authorization') _auth: string) {}
    }
    const meta: ParamMetadata[] = Reflect.getMetadata(PARAM_METADATA, Ctrl.prototype, 'handle')
    expect(meta).toContainEqual({ index: 0, type: 'headers', key: 'authorization' })
  })

  it('@Message() stores metadata', () => {
    class Ctrl {
      handle(@Message() _m: LunaMessage) {}
    }
    const meta: ParamMetadata[] = Reflect.getMetadata(PARAM_METADATA, Ctrl.prototype, 'handle')
    expect(meta).toContainEqual({ index: 0, type: 'message', key: undefined })
  })

  it('multiple decorators on the same method store multiple entries', () => {
    class Ctrl {
      handle(@Body() _b: unknown, @Param('id') _id: string, @Query('page') _p: string) {}
    }
    const meta: ParamMetadata[] = Reflect.getMetadata(PARAM_METADATA, Ctrl.prototype, 'handle')
    expect(meta).toHaveLength(3)
  })
})

// ── resolveParams ─────────────────────────────────────────────────────────────

describe('resolveParams', () => {
  const message = msg()

  it('returns [message] when no param metadata', () => {
    const args = resolveParams(message, [])
    expect(args).toEqual([message])
  })

  it('extracts full body', () => {
    const args = resolveParams(message, [{ index: 0, type: 'body' }])
    expect(args[0]).toEqual({ name: 'luna', age: 1 })
  })

  it('extracts a body key', () => {
    const args = resolveParams(message, [{ index: 0, type: 'body', key: 'name' }])
    expect(args[0]).toBe('luna')
  })

  it('extracts full query', () => {
    const args = resolveParams(message, [{ index: 0, type: 'query' }])
    expect(args[0]).toEqual({ page: '2', limit: '10' })
  })

  it('extracts a query key', () => {
    const args = resolveParams(message, [{ index: 0, type: 'query', key: 'page' }])
    expect(args[0]).toBe('2')
  })

  it('extracts a param key', () => {
    const args = resolveParams(message, [{ index: 0, type: 'param', key: 'id' }])
    expect(args[0]).toBe('42')
  })

  it('extracts a header key', () => {
    const args = resolveParams(message, [{ index: 0, type: 'headers', key: 'authorization' }])
    expect(args[0]).toBe('Bearer token')
  })

  it('@Message() injects the full message', () => {
    const args = resolveParams(message, [{ index: 0, type: 'message' }])
    expect(args[0]).toBe(message)
  })

  it('places values at correct indices for mixed decorators', () => {
    const meta: ParamMetadata[] = [
      { index: 0, type: 'param', key: 'id' },
      { index: 1, type: 'body', key: 'name' },
      { index: 2, type: 'query', key: 'page' },
    ]
    const args = resolveParams(message, meta)
    expect(args[0]).toBe('42')
    expect(args[1]).toBe('luna')
    expect(args[2]).toBe('2')
  })
})

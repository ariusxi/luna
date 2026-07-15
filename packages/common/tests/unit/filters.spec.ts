import 'reflect-metadata'
import { LunaMessage } from '../../src/types/message.interface'
import { LunaExceptionFilter } from '../../src/filters/filter.interface'
import { CATCH_METADATA, Catch } from '../../src/filters/catch.decorator'
import { USE_FILTERS_METADATA, UseFilters } from '../../src/filters/use-filters.decorator'

const msg = (): LunaMessage => ({ context: 'test', payload: {}, metadata: {} })

class DomainError extends Error {}
class AuthError extends Error {}

// ── @Catch ────────────────────────────────────────────────────────────────────

describe('@Catch', () => {
  it('stores exception types as class metadata', () => {
    @Catch(DomainError)
    class MyFilter implements LunaExceptionFilter {
      catch(_e: unknown, _m: LunaMessage) { return {} }
    }
    expect(Reflect.getMetadata(CATCH_METADATA, MyFilter)).toEqual([DomainError])
  })

  it('stores multiple exception types', () => {
    @Catch(DomainError, AuthError)
    class MultiFilter implements LunaExceptionFilter {
      catch(_e: unknown, _m: LunaMessage) { return {} }
    }
    expect(Reflect.getMetadata(CATCH_METADATA, MultiFilter)).toEqual([DomainError, AuthError])
  })

  it('stores an empty array when called with no arguments (catch-all)', () => {
    @Catch()
    class CatchAll implements LunaExceptionFilter {
      catch(_e: unknown, _m: LunaMessage) { return {} }
    }
    expect(Reflect.getMetadata(CATCH_METADATA, CatchAll)).toEqual([])
  })
})

// ── @UseFilters ───────────────────────────────────────────────────────────────

describe('@UseFilters', () => {
  class FilterA implements LunaExceptionFilter {
    catch(_e: unknown, _m: LunaMessage) { return {} }
  }
  class FilterB implements LunaExceptionFilter {
    catch(_e: unknown, _m: LunaMessage) { return {} }
  }

  it('stores filter class as controller-level metadata', () => {
    @UseFilters(FilterA)
    class Ctrl {}
    expect(Reflect.getMetadata(USE_FILTERS_METADATA, Ctrl)).toEqual([FilterA])
  })

  it('stores filter instance as controller-level metadata', () => {
    const instance = new FilterA()
    @UseFilters(instance)
    class Ctrl {}
    const [stored] = Reflect.getMetadata(USE_FILTERS_METADATA, Ctrl)
    expect(stored).toBe(instance)
  })

  it('stores filter metadata on a method', () => {
    class Ctrl {
      @UseFilters(FilterA, FilterB)
      handle(_m: LunaMessage) {}
    }
    const meta = Reflect.getMetadata(USE_FILTERS_METADATA, Ctrl.prototype, 'handle')
    expect(meta).toEqual([FilterA, FilterB])
  })

  it('class and method metadata are independent', () => {
    @UseFilters(FilterA)
    class Ctrl {
      @UseFilters(FilterB)
      handle(_m: LunaMessage) {}
    }
    expect(Reflect.getMetadata(USE_FILTERS_METADATA, Ctrl)).toEqual([FilterA])
    expect(Reflect.getMetadata(USE_FILTERS_METADATA, Ctrl.prototype, 'handle')).toEqual([FilterB])
  })
})

// ── LunaExceptionFilter contract ──────────────────────────────────────────────

describe('LunaExceptionFilter', () => {
  it('catch receives the exception and message', async () => {
    const error = new DomainError('oops')
    const message = msg()
    let captured: unknown

    @Catch(DomainError)
    class LogFilter implements LunaExceptionFilter<DomainError> {
      catch(exception: DomainError, _m: LunaMessage) {
        captured = exception
        return { error: exception.message }
      }
    }

    const filter = new LogFilter()
    const result = await filter.catch(error, message)
    expect(captured).toBe(error)
    expect(result).toEqual({ error: 'oops' })
  })
})

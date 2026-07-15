import 'reflect-metadata'
import { LunaMessage } from '../../src/types/message.interface'
import { SetMetadata } from '../../src/metadata/set-metadata.decorator'
import { Reflector } from '../../src/metadata/reflector'

const reflector = new Reflector()

describe('@SetMetadata', () => {
  it('stores a value on a class', () => {
    @SetMetadata('roles', ['admin'])
    class Ctrl {}
    expect(Reflect.getMetadata('roles', Ctrl)).toEqual(['admin'])
  })

  it('stores a value on a method', () => {
    class Ctrl {
      @SetMetadata('roles', ['user'])
      handle(_m: LunaMessage) {}
    }
    expect(Reflect.getMetadata('roles', Ctrl.prototype, 'handle')).toEqual(['user'])
  })

  it('does not bleed between classes', () => {
    @SetMetadata('key', 'a')
    class A {}
    @SetMetadata('key', 'b')
    class B {}
    expect(Reflect.getMetadata('key', A)).toBe('a')
    expect(Reflect.getMetadata('key', B)).toBe('b')
  })
})

describe('Reflector', () => {
  it('get() reads class-level metadata', () => {
    @SetMetadata('limit', 100)
    class Ctrl {}
    expect(reflector.get<number>('limit', Ctrl)).toBe(100)
  })

  it('get() reads method-level metadata', () => {
    class Ctrl {
      @SetMetadata('roles', ['admin'])
      delete(_m: LunaMessage) {}
    }
    expect(reflector.get<string[]>('roles', Ctrl.prototype, 'delete')).toEqual(['admin'])
  })

  it('get() returns undefined when key is absent', () => {
    class Ctrl {}
    expect(reflector.get('missing', Ctrl)).toBeUndefined()
  })

  it('getWithFallback() returns method value when present', () => {
    @SetMetadata('roles', ['user'])
    class Ctrl {
      @SetMetadata('roles', ['admin'])
      delete(_m: LunaMessage) {}
    }
    expect(reflector.getWithFallback<string[]>('roles', Ctrl.prototype, 'delete')).toEqual(['admin'])
  })

  it('getWithFallback() falls back to class value when method has none', () => {
    @SetMetadata('roles', ['user'])
    class Ctrl {
      handle(_m: LunaMessage) {}
    }
    expect(reflector.getWithFallback<string[]>('roles', Ctrl.prototype, 'handle')).toEqual(['user'])
  })

  it('getAll() collects values from multiple targets', () => {
    @SetMetadata('tag', 'a')
    class A {}
    @SetMetadata('tag', 'b')
    class B {}
    class C {}
    expect(reflector.getAll<string>('tag', [A, B, C])).toEqual(['a', 'b'])
  })
})

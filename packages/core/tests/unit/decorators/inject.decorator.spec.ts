import 'reflect-metadata'
import { Inject } from '../../../src/core/decorators/inject.decorator'
import { Injectable } from '../../../src/core/decorators/injectable.decorator'

describe('@Inject', () => {
  it('should store token at the correct parameter index', () => {
    @Injectable()
    class MyService {
      constructor(@Inject('TOKEN') public value: string) {}
    }

    const tokens = Reflect.getMetadata('luna:inject', MyService)
    expect(tokens[0]).toBe('TOKEN')
  })

  it('should store multiple tokens at correct indexes', () => {
    @Injectable()
    class MyService {
      constructor(
        @Inject('A') public a: string,
        @Inject('B') public b: string,
      ) {}
    }

    const tokens = Reflect.getMetadata('luna:inject', MyService)
    expect(tokens[0]).toBe('A')
    expect(tokens[1]).toBe('B')
  })

  it('should work with symbol tokens', () => {
    const TOKEN = Symbol('TOKEN')

    @Injectable()
    class MyService {
      constructor(@Inject(TOKEN) public value: string) {}
    }

    const tokens = Reflect.getMetadata('luna:inject', MyService)
    expect(tokens[0]).toBe(TOKEN)
  })

  it('should not interfere with other parameters without @Inject', () => {
    @Injectable()
    class Dep {}

    @Injectable()
    class MyService {
      constructor(
        public dep: Dep,
        @Inject('TOKEN') public token: string,
      ) {}
    }

    const tokens = Reflect.getMetadata('luna:inject', MyService)
    expect(tokens[0]).toBeUndefined()
    expect(tokens[1]).toBe('TOKEN')
  })
})

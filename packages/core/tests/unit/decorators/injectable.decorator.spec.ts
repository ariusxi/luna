import 'reflect-metadata'
import { Injectable } from '../../../src/core/decorators/injectable.decorator'
import { ProviderScope } from '../../../src/core/types'

describe('@Injectable', () => {
  it('should mark class as injectable', () => {
    @Injectable()
    class MyService {}

    expect(Reflect.getMetadata('luna:injectable', MyService)).toBe(true)
  })

  it('should default to Singleton scope', () => {
    @Injectable()
    class MyService {}

    expect(Reflect.getMetadata('luna:scope', MyService)).toBe(ProviderScope.Singleton)
  })

  it('should set Transient scope when specified', () => {
    @Injectable({ scope: ProviderScope.Transient })
    class MyService {}

    expect(Reflect.getMetadata('luna:scope', MyService)).toBe(ProviderScope.Transient)
  })

  it('should not affect other classes', () => {
    @Injectable()
    class A {}

    class B {}

    expect(Reflect.getMetadata('luna:injectable', B)).toBeUndefined()
  })
})

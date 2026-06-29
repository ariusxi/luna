import 'reflect-metadata'
import { defineProvider, composeProviders } from '../../../src/core/providers/define-provider'

describe('defineProvider', () => {
  it('should return a FactoryProvider with a Symbol token', () => {
    const provider = defineProvider({ useFactory: () => ({}) })

    expect(typeof provider.provide).toBe('symbol')
    expect(typeof provider.useFactory).toBe('function')
  })

  it('should generate unique symbols for each call', () => {
    const a = defineProvider({ useFactory: () => ({}) })
    const b = defineProvider({ useFactory: () => ({}) })

    expect(a.provide).not.toBe(b.provide)
  })

  it('should preserve the factory function', () => {
    const factory = () => ({ value: 42 })
    const provider = defineProvider({ useFactory: factory })

    expect(provider.useFactory()).toEqual({ value: 42 })
  })

  it('should normalize Token[] inject', () => {
    const provider = defineProvider({
      inject: ['TOKEN'],
      useFactory: (val: string) => val,
    })

    expect(provider.inject).toEqual(['TOKEN'])
  })

  it('should normalize ProviderDefinitionFunction inject to its Symbol', () => {
    const dep = defineProvider({ useFactory: () => 'dep' })
    const provider = defineProvider({
      inject: [dep],
      useFactory: (val: string) => val,
    })

    expect(provider.inject?.[0]).toBe(dep.provide)
  })

  it('should handle empty inject', () => {
    const provider = defineProvider({ useFactory: () => ({}) })
    expect(provider.inject).toBeUndefined()
  })

  describe('when (conditional)', () => {
    it('should set when function on the provider', () => {
      const condition = () => true
      const provider = defineProvider({ useFactory: () => ({}), when: condition })

      expect(provider.when).toBe(condition)
    })

    it('should have no when by default', () => {
      const provider = defineProvider({ useFactory: () => ({}) })
      expect(provider.when).toBeUndefined()
    })
  })

  describe('lazy', () => {
    it('should set lazy flag on the provider', () => {
      const provider = defineProvider({ useFactory: () => ({}), lazy: true })
      expect(provider.lazy).toBe(true)
    })

    it('should not set lazy by default', () => {
      const provider = defineProvider({ useFactory: () => ({}) })
      expect(provider.lazy).toBeUndefined()
    })
  })
})

describe('composeProviders', () => {
  it('should return a FactoryProvider with a Symbol token', () => {
    const provider = composeProviders([], () => ({}))
    expect(typeof provider.provide).toBe('symbol')
  })

  it('should inject and compose multiple providers', () => {
    const A = defineProvider({ useFactory: () => 'a' })
    const B = defineProvider({ useFactory: () => 'b' })

    const composed = composeProviders([A, B], (a, b) => `${a}-${b}`)

    expect(composed.inject).toEqual([A.provide, B.provide])
    expect(composed.useFactory('a', 'b')).toBe('a-b')
  })

  it('should generate a unique symbol per call', () => {
    const a = composeProviders([], () => ({}))
    const b = composeProviders([], () => ({}))

    expect(a.provide).not.toBe(b.provide)
  })
})

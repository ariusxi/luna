import 'reflect-metadata'
import { defineProvider } from '../../../src/core/providers/define-provider'

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
})

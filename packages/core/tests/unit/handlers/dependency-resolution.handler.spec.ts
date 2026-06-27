import 'reflect-metadata'
import { DependencyResolutionError } from '../../../src/core/handlers/dependency-resolution.handler'

describe('DependencyResolutionError', () => {
  class TestModule {}

  it('should format error with class token', () => {
    class MyService {}
    const error = new DependencyResolutionError(MyService, TestModule)

    expect(error.message).toContain('[Luna] Cannot resolve MyService in TestModule')
  })

  it('should format error with string token', () => {
    const error = new DependencyResolutionError('API_KEY', TestModule)

    expect(error.message).toContain('[Luna] Cannot resolve API_KEY in TestModule')
  })

  it('should format error with symbol token', () => {
    const token = Symbol('MyToken')
    const error = new DependencyResolutionError(token, TestModule)

    expect(error.message).toContain('Symbol(MyToken)')
  })

  it('should include dependencyOf hint when provided', () => {
    class Missing {}
    class Parent {}

    const error = new DependencyResolutionError(Missing, TestModule, Parent)

    expect(error.message).toContain('Required by Parent')
    expect(error.message).toContain('Did you forget to add Missing to providers')
  })

  it('should include hint without dependencyOf', () => {
    class Missing {}

    const error = new DependencyResolutionError(Missing, TestModule)

    expect(error.message).toContain('Did you forget to add Missing to providers')
  })

  it('should be an instance of Error', () => {
    class MyService {}
    const error = new DependencyResolutionError(MyService, TestModule)

    expect(error).toBeInstanceOf(Error)
  })
})

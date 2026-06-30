import 'reflect-metadata'
import { Controller, CONTROLLER_METADATA } from '../../src/decorators/controller.decorator'

describe('Controller decorator', () => {
  it('stores the given context string as metadata', () => {
    @Controller('users')
    class UserController {}

    expect(Reflect.getMetadata(CONTROLLER_METADATA, UserController)).toBe('users')
  })

  it('stores an empty string when no context is provided', () => {
    @Controller()
    class RootController {}

    expect(Reflect.getMetadata(CONTROLLER_METADATA, RootController)).toBe('')
  })

  it('does not bleed metadata across decorated classes', () => {
    @Controller('a')
    class A {}

    @Controller('b')
    class B {}

    expect(Reflect.getMetadata(CONTROLLER_METADATA, A)).toBe('a')
    expect(Reflect.getMetadata(CONTROLLER_METADATA, B)).toBe('b')
  })
})

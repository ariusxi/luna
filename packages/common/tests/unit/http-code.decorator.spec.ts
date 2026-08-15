import 'reflect-metadata'
import { HTTP_CODE_METADATA, HttpCode } from '../../src/decorators/http-code.decorator'
import { ConflictException, HttpException } from '../../src/exceptions'

describe('@HttpCode', () => {
  it('stores the status code as method metadata', () => {
    class Controller {
      @HttpCode(201)
      create(): void {}

      plain(): void {}
    }

    const prototype = Controller.prototype
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, prototype, 'create')).toBe(201)
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, prototype, 'plain')).toBeUndefined()
  })
})

describe('HttpException details', () => {
  it('carries an optional details payload', () => {
    const error = new ConflictException('stale', { currentVersion: 7 })
    expect(error).toBeInstanceOf(HttpException)
    expect(error.statusCode).toBe(409)
    expect(error.details).toEqual({ currentVersion: 7 })
  })

  it('leaves details undefined when omitted', () => {
    expect(new ConflictException('stale').details).toBeUndefined()
  })
})

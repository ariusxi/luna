import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
  InternalServerErrorException,
  MethodNotAllowedException,
  NotFoundException,
  NotImplementedException,
  RequestTimeoutException,
  ServiceUnavailableException,
  TooManyRequestsException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@lunafw/common'

class TeapotException extends HttpException {
  constructor() { super(418, "I'm a teapot") }
}

describe('HttpException', () => {
  it('sets statusCode and message', () => {
    const error = new TeapotException()
    expect(error.statusCode).toBe(418)
    expect(error.message).toBe("I'm a teapot")
    expect(error).toBeInstanceOf(Error)
  })

  it('sets name to the subclass name', () => {
    const error = new NotFoundException()
    expect(error.name).toBe('NotFoundException')
  })

  const cases: [new (message?: string) => HttpException, number, string][] = [
    [BadRequestException,           400, 'Bad Request'],
    [UnauthorizedException,         401, 'Unauthorized'],
    [ForbiddenException,            403, 'Forbidden'],
    [NotFoundException,             404, 'Not Found'],
    [MethodNotAllowedException,     405, 'Method Not Allowed'],
    [RequestTimeoutException,       408, 'Request Timeout'],
    [ConflictException,             409, 'Conflict'],
    [GoneException,                 410, 'Gone'],
    [UnprocessableEntityException,  422, 'Unprocessable Entity'],
    [TooManyRequestsException,      429, 'Too Many Requests'],
    [InternalServerErrorException,  500, 'Internal Server Error'],
    [NotImplementedException,       501, 'Not Implemented'],
    [ServiceUnavailableException,   503, 'Service Unavailable'],
  ]

  it.each(cases)('%s uses default status %i and message "%s"', (ExceptionClass, statusCode, message) => {
    const error = new ExceptionClass()
    expect(error.statusCode).toBe(statusCode)
    expect(error.message).toBe(message)
    expect(error).toBeInstanceOf(HttpException)
  })

  it.each(cases)('%s accepts a custom message', (ExceptionClass, _statusCode, _default) => {
    const error = new ExceptionClass('custom message')
    expect(error.message).toBe('custom message')
  })
})

describe('ExpressAdapter exception handling', () => {
  const { ExpressAdapter } = require('../../src/adapters/express.adapter')

  let adapter: InstanceType<typeof ExpressAdapter>

  beforeEach(() => {
    adapter = new ExpressAdapter({ port: 0 })
  })

  afterEach(async () => {
    await adapter.close().catch(() => {})
  })

  it('returns the correct status code when an HttpException is thrown', async () => {
    adapter.register(
      { handle: async () => { throw new NotFoundException('User not found') } },
      { event: 'get', prefix: 'users', path: '/:id' },
    )

    await adapter.listen()

    const res = await fetch(`http://localhost:${adapter.getPort()}/users/99`)
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body).toEqual({ statusCode: 404, message: 'User not found' })

    await adapter.close()
  })

  it('returns 500 when an unknown error is thrown', async () => {
    adapter.register(
      { handle: async () => { throw new Error('Something went wrong') } },
      { event: 'get', prefix: 'test', path: '/' },
    )

    await adapter.listen()

    const res = await fetch(`http://localhost:${adapter.getPort()}/test/`)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body).toEqual({ statusCode: 500, message: 'Internal Server Error' })

    await adapter.close()
  })
})

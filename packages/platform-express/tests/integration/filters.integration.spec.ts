import 'reflect-metadata'
import { Injectable, Module } from '@lunafw/core'
import {
  Catch,
  Controller,
  LunaExceptionFilter,
  LunaFactory,
  LunaMessage,
  On,
  UseFilters,
} from '@lunafw/common'
import { ExpressAdapter } from '../../src'
import { BadRequestException, NotFoundException } from '@lunafw/common'

// ── domain errors ─────────────────────────────────────────────────────────────

class UserNotFoundError extends Error {
  constructor(id: string) { super(`User ${id} not found`) }
}

class ValidationError extends Error {
  constructor(field: string) { super(`Field "${field}" is invalid`) }
}

// ── filters ───────────────────────────────────────────────────────────────────

@Catch(UserNotFoundError)
class UserNotFoundFilter implements LunaExceptionFilter<UserNotFoundError> {
  catch(exception: UserNotFoundError, _message: LunaMessage) {
    throw new NotFoundException(exception.message)
  }
}

@Catch(ValidationError)
class ValidationFilter implements LunaExceptionFilter<ValidationError> {
  catch(exception: ValidationError, _message: LunaMessage) {
    throw new BadRequestException(exception.message)
  }
}

@Catch()
class CatchAllFilter implements LunaExceptionFilter {
  catch(_exception: unknown, _message: LunaMessage) {
    return { caught: true }
  }
}

// ── controllers ───────────────────────────────────────────────────────────────

@Injectable()
@UseFilters(UserNotFoundFilter)
@Controller('users')
class UserController {
  @On('get', '/:id')
  findOne(_message: LunaMessage) {
    throw new UserNotFoundError('99')
  }

  @UseFilters(ValidationFilter)
  @On('post', '/')
  create(_message: LunaMessage) {
    throw new ValidationError('email')
  }

  @UseFilters(new CatchAllFilter())
  @On('delete', '/:id')
  remove(_message: LunaMessage) {
    throw new Error('unexpected')
  }
}

@Module({ providers: [UserController] })
class AppModule {}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Exception filters integration', () => {
  let adapter: ExpressAdapter
  let baseUrl: string

  beforeAll(async () => {
    adapter = new ExpressAdapter({ port: 0 })
    const app = await LunaFactory.createApplication(AppModule, adapter)
    await app.start()
    baseUrl = `http://localhost:${adapter.getPort()}`
  })

  afterAll(async () => {
    await adapter.close()
  })

  it('controller-level filter maps UserNotFoundError to 404', async () => {
    const res = await fetch(`${baseUrl}/users/99`)
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body.message).toBe('User 99 not found')
  })

  it('method-level filter maps ValidationError to 400', async () => {
    const res = await fetch(`${baseUrl}/users/`, { method: 'POST' })
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.message).toBe('Field "email" is invalid')
  })

  it('catch-all instance filter returns custom body', async () => {
    const res = await fetch(`${baseUrl}/users/1`, { method: 'DELETE' })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toEqual({ caught: true })
  })
})

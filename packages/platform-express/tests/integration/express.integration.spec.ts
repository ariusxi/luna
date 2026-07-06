import 'reflect-metadata'
import { Module, Injectable } from '@lunafw/core'
import { Controller, LunaFactory, LunaMessage, On } from '@lunafw/common'

import { ExpressAdapter } from '../../src'

interface User {
  id: number | string
  name: string
}

interface CreateUserDto {
  name: string
}

@Injectable()
class UserService {
  findAll(): User[] {
    return [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
  }

  findOne(id: string): User {
    return { id, name: 'Alice' }
  }

  create(data: CreateUserDto): User {
    return { id: 3, ...data }
  }
}

@Injectable()
@Controller('users')
class UserController {
  constructor(private readonly userService: UserService) {}

  @On('get', '/')
  findAll(_message: LunaMessage): User[] {
    return this.userService.findAll()
  }

  @On('get', '/:id')
  findOne(message: LunaMessage): User {
    const { id } = message.metadata.params as { id: string }
    return this.userService.findOne(id)
  }

  @On('post', '/')
  create(message: LunaMessage): User {
    return this.userService.create(message.payload as CreateUserDto)
  }
}

@Module({ providers: [UserService, UserController] })
class AppModule {}

describe('ExpressAdapter integration', () => {
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

  it('GET /users returns the full list', async () => {
    const res = await fetch(`${baseUrl}/users/`)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }])
  })

  it('GET /users/:id returns a single user', async () => {
    const res = await fetch(`${baseUrl}/users/1`)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ id: '1', name: 'Alice' })
  })

  it('POST /users creates a user', async () => {
    const res = await fetch(`${baseUrl}/users/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Charlie' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ id: 3, name: 'Charlie' })
  })

  it('injects UserService into UserController correctly', async () => {
    const res = await fetch(`${baseUrl}/users/`)
    const body = await res.json()
    expect(body).toHaveLength(2)
  })
})

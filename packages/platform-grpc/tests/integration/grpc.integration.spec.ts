import 'reflect-metadata'
import * as path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { Injectable, Module } from '@lunafw/core'
import { Controller, LunaFactory, LunaMessage, On } from '@lunafw/common'
import { GrpcAdapter } from '../../src'

const PROTO_PATH = path.join(__dirname, 'users.proto')

interface User { id: string; name: string; email: string }

@Injectable()
class UserService {
  private users: User[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
  ]

  findOne(id: string): User {
    const user = this.users.find((u) => u.id === id)
    if (!user) throw new Error(`User ${id} not found`)
    return user
  }

  create(name: string, email: string): User {
    const user: User = { id: String(this.users.length + 1), name, email }
    this.users.push(user)
    return user
  }

  remove(id: string): boolean {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) throw new Error(`User ${id} not found`)
    this.users.splice(index, 1)
    return true
  }
}

@Injectable()
@Controller('UserService')
class UserController {
  constructor(private readonly userService: UserService) {}

  @On('GetUser')
  getUser(message: LunaMessage) {
    const { id } = message.payload as { id: string }
    return this.userService.findOne(id)
  }

  @On('CreateUser')
  createUser(message: LunaMessage) {
    const { name, email } = message.payload as { name: string; email: string }
    return this.userService.create(name, email)
  }

  @On('DeleteUser')
  deleteUser(message: LunaMessage) {
    const { id } = message.payload as { id: string }
    const deleted = this.userService.remove(id)
    return { deleted }
  }
}

@Module({ providers: [UserService, UserController] })
class AppModule {}

function loadClient(port: number) {
  const packageDef = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
  })
  const grpcObject = grpc.loadPackageDefinition(packageDef) as Record<string, unknown>
  const pkg = grpcObject['users'] as Record<string, grpc.ServiceClientConstructor>
  return new pkg['UserService'](`localhost:${port}`, grpc.credentials.createInsecure())
}

describe('GrpcAdapter integration', () => {
  let adapter: GrpcAdapter
  let client: grpc.Client & Record<string, Function>

  beforeAll(async () => {
    adapter = new GrpcAdapter({
      port: 0,
      protoPath: PROTO_PATH,
      packageName: 'users',
    })

    const app = await LunaFactory.createApplication(AppModule, adapter)
    await app.start()

    client = loadClient(adapter.getPort()) as grpc.Client & Record<string, Function>
  })

  afterAll(async () => {
    client.close()
    await adapter.close()
  })

  function call<T>(method: string, request: object): Promise<T> {
    return new Promise((resolve, reject) => {
      client[method](request, (err: grpc.ServiceError | null, response: T) => {
        if (err) return reject(err)
        resolve(response)
      })
    })
  }

  it('GetUser — returns existing user', async () => {
    const res = await call<User>('GetUser', { id: '1' })
    expect(res).toMatchObject({ id: '1', name: 'Alice', email: 'alice@example.com' })
  })

  it('CreateUser — creates and returns new user', async () => {
    const res = await call<User>('CreateUser', { name: 'Bob', email: 'bob@example.com' })
    expect(res).toMatchObject({ name: 'Bob', email: 'bob@example.com' })
    expect(res.id).toBeDefined()
  })

  it('DeleteUser — removes user and returns deleted flag', async () => {
    const res = await call<{ deleted: boolean }>('DeleteUser', { id: '1' })
    expect(res.deleted).toBe(true)
  })

  it('GetUser — returns INTERNAL error for missing user', async () => {
    await expect(call('GetUser', { id: '999' })).rejects.toMatchObject({
      code: grpc.status.INTERNAL,
    })
  })

  it('getPort — returns bound port', () => {
    expect(adapter.getPort()).toBeGreaterThan(0)
  })
})

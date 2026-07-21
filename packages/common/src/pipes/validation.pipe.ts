import { Injectable } from '@lunafw/core'
import { BadRequestException } from '../exceptions/http.exception'
import { LunaMessage } from '../types/message.interface'
import { LunaPipe } from './pipe.interface'

type ClassConstructor<T> = new (...args: unknown[]) => T

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let plainToInstance: ((cls: any, plain: any) => any) | undefined
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let validate: ((object: object) => Promise<any[]>) | undefined

const loadDeps = (): void => {
  if (plainToInstance) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    plainToInstance = require('class-transformer').plainToInstance
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    validate = require('class-validator').validate
  } catch {
    throw new Error(
      'ValidationPipe requires "class-validator" and "class-transformer". ' +
      'Run: npm install class-validator class-transformer',
    )
  }
}

/**
 * Transforms `message.payload` into an instance of `target` and validates it
 * using class-validator decorators.
 *
 * Requires `class-validator` and `class-transformer` to be installed.
 *
 * @example
 * @On('CreateUser')
 * @UsePipes(new ValidationPipe(CreateUserDto))
 * createUser(@Body() dto: CreateUserDto) { ... }
 */
@Injectable()
export class ValidationPipe<T extends object> implements LunaPipe {
  constructor(private readonly target: ClassConstructor<T>) {}

  async transform(message: LunaMessage): Promise<LunaMessage> {
    loadDeps()

    const instance = plainToInstance!(this.target, message.payload)
    const errors = await validate!(instance)

    if (!errors.length) return { ...message, payload: instance }

    const details = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('; ')

    throw new BadRequestException(details || 'Validation failed')
  }
}

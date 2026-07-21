import { Injectable } from '@lunafw/core'
import { BadRequestException } from '../exceptions'
import { LunaMessage } from '../types/message.interface'
import { LunaPipe } from './pipe.interface'

type ClassConstructor<T> = new (...args: unknown[]) => T
type PlainToInstance = (cls: ClassConstructor<object>, plain: unknown) => object
type Validate = (object: object) => Promise<{ constraints?: Record<string, string> }[]>

let plainToInstance: PlainToInstance | undefined
let validate: Validate | undefined

const loadDeps = async (): Promise<void> => {
  if (plainToInstance) return
  try {
    const ct = await import('class-transformer')
    const cv = await import('class-validator')
    plainToInstance = ct.plainToInstance as PlainToInstance
    validate = cv.validate as Validate
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
    await loadDeps()

    const instance = plainToInstance!(this.target as ClassConstructor<object>, message.payload)
    const errors = await validate!(instance)

    if (!errors.length) return { ...message, payload: instance }

    const details = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('; ')

    throw new BadRequestException(details || 'Validation failed')
  }
}

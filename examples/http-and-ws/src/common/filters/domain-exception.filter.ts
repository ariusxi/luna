import { Injectable } from '@lunafw/core'
import { Catch, LunaExceptionFilter, LunaMessage } from '@lunafw/common'
import { NotFoundException } from '@lunafw/platform-express'

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id "${id}" not found`)
  }
}

@Catch(NotFoundError)
@Injectable()
export class DomainExceptionFilter implements LunaExceptionFilter<NotFoundError> {
  catch(exception: NotFoundError, _message: LunaMessage): never {
    throw new NotFoundException(exception.message)
  }
}

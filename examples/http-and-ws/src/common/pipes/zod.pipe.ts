import { LunaMessage, LunaPipe } from '@lunafw/common'
import { BadRequestException } from '@lunafw/platform-express'
import { ZodSchema } from 'zod'

export class ZodPipe<T> implements LunaPipe {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(message: LunaMessage): LunaMessage {
    const result = this.schema.safeParse(message.payload)
    if (!result.success) {
      throw new BadRequestException(result.error.issues[0]?.message ?? 'Validation failed')
    }
    return { ...message, payload: result.data }
  }
}

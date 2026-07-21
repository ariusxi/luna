import { Injectable } from '@lunafw/core'
import { LunaExecutionContext, LunaInterceptor } from '@lunafw/common'

@Injectable()
export class LoggingInterceptor implements LunaInterceptor {
  async intercept(context: LunaExecutionContext, next: () => Promise<unknown>): Promise<unknown> {
    const message = context.getMessage()
    const handler = context.getHandler()

    console.log(`[gRPC] → ${handler}`, message.payload)

    const result = await next()

    console.log(`[gRPC] ← ${handler}`, result)

    return result
  }
}

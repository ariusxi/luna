import { Injectable } from '@lunafw/core'
import { LunaExecutionContext, LunaInterceptor } from '@lunafw/common'

@Injectable()
export class LoggingInterceptor implements LunaInterceptor {
  async intercept(context: LunaExecutionContext, next: () => Promise<unknown>): Promise<unknown> {
    const start = Date.now()
    const result = await next()
    console.log(`[${context.getHandler()}] ${Date.now() - start}ms`)
    return result
  }
}

import { LunaMessage } from '../types/message.interface'

/**
 * Execution context passed to every interceptor.
 * Provides access to the current message and the handler name.
 */
export interface LunaExecutionContext {
  getMessage(): LunaMessage
  getHandler(): string
}

/**
 * Interface that all Luna interceptors must implement.
 *
 * An interceptor wraps the handler execution — it can transform the message
 * before the handler runs, transform the response after, measure execution
 * time, or catch and rethrow errors.
 *
 * @example
 * @Injectable()
 * class LoggingInterceptor implements LunaInterceptor {
 *   async intercept(context: LunaExecutionContext, next: () => Promise<unknown>) {
 *     const start = Date.now()
 *     const result = await next()
 *     console.log(`${context.getHandler()} took ${Date.now() - start}ms`)
 *     return result
 *   }
 * }
 */
export interface LunaInterceptor {
  intercept(context: LunaExecutionContext, next: () => Promise<unknown>): Promise<unknown>
}

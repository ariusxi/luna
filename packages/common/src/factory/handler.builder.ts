import { CATCH_METADATA } from '../filters/catch.decorator'
import { LunaExceptionFilter } from '../filters/filter.interface'
import { GuardRejectionError, LunaGuard } from '../guards'
import { LunaExecutionContext, LunaInterceptor } from '../interceptors'
import { PARAM_METADATA, ParamMetadata, resolveParams } from '../params/param.decorator'
import { LunaPipe } from '../pipes'
import { ClassOrInstance, LunaHandler, LunaMessage } from '../types'
import { ControllerMiddleware } from './middleware.registry'

/**
 * Compiles a `ControllerMiddleware` snapshot into a live `LunaHandler`.
 *
 * Separated from `MiddlewareRegistry` so that stack management (global arrays +
 * collect) and handler compilation (resolve instances + build pipeline) are each
 * cohesive on their own.
 */
export class HandlerBuilder {
  constructor(
    private readonly resolver: <T>(items: ClassOrInstance<T>[]) => T[],
  ) {}

  build(
    instance: Record<string, (...args: unknown[]) => unknown>,
    methodName: string,
    prototype: object,
    middleware: ControllerMiddleware,
  ): LunaHandler {
    const guards = this.resolver<LunaGuard>(middleware.guards)
    const pipes = this.resolver<LunaPipe>(middleware.pipes)
    const interceptors = this.resolver<LunaInterceptor>(middleware.interceptors)
    const filters = this.resolver<LunaExceptionFilter>(middleware.filters)

    const paramsMeta: ParamMetadata[] =
      Reflect.getMetadata(PARAM_METADATA, prototype, methodName) ?? []

    return {
      handle: async (message: LunaMessage) => {
        try {
          for (const guard of guards) {
            const allowed = await guard.canActivate(message)
            if (!allowed) throw new GuardRejectionError()
          }

          let transformedMessage = message
          for (const pipe of pipes) {
            transformedMessage = await pipe.transform(transformedMessage)
          }

          const context: LunaExecutionContext = {
            getMessage: () => transformedMessage,
            getHandler: () => methodName,
          }

          const chain = interceptors.reduceRight<() => Promise<unknown>>(
            (next, interceptor) => () => interceptor.intercept(context, next),
            async () => {
              const args = resolveParams(transformedMessage, paramsMeta)
              return instance[methodName](...args)
            },
          )

          return await chain()
        } catch (error) {
          return this.runFilters(error, message, filters)
        }
      },
    }
  }

  private async runFilters(
    exception: unknown,
    message: LunaMessage,
    filters: LunaExceptionFilter[],
  ): Promise<unknown> {
    for (const filter of filters) {
      const caughtTypes: (abstract new (...args: unknown[]) => unknown)[] =
        Reflect.getMetadata(CATCH_METADATA, filter.constructor) ?? []

      const matches =
        caughtTypes.length === 0 ||
        caughtTypes.some((ExType) => exception instanceof ExType)

      if (matches) return filter.catch(exception, message)
    }
    throw exception
  }
}

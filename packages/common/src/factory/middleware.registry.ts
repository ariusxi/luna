import { CATCH_METADATA } from '../filters/catch.decorator'
import { LunaExceptionFilter } from '../filters/filter.interface'
import { USE_FILTERS_METADATA } from '../filters/use-filters.decorator'
import { GuardRejectionError, LunaGuard, USE_GUARDS_METADATA } from '../guards'
import { LunaExecutionContext, LunaInterceptor, USE_INTERCEPTORS_METADATA } from '../interceptors'
import { PARAM_METADATA, ParamMetadata, resolveParams } from '../params/param.decorator'
import { LunaPipe, USE_PIPES_METADATA } from '../pipes'
import { ClassOrInstance, HandlerMetadata, LunaHandler, LunaMessage } from '../types'

export interface ControllerMiddleware {
  guards: ClassOrInstance<LunaGuard>[]
  pipes: ClassOrInstance<LunaPipe>[]
  interceptors: ClassOrInstance<LunaInterceptor>[]
  filters: ClassOrInstance<LunaExceptionFilter>[]
}

/**
 * Holds the global middleware stacks and assembles the per-handler pipeline.
 *
 * Separated from `LunaApplication` so that lifecycle concerns (`start`, `close`,
 * adapter management) stay in one cohesive class while middleware concerns
 * (global stacks, `collectMiddleware`, `buildHandler`, `runFilters`) live here.
 */
export class MiddlewareRegistry {
  private globalGuards: ClassOrInstance<LunaGuard>[] = []
  private globalPipes: ClassOrInstance<LunaPipe>[] = []
  private globalInterceptors: ClassOrInstance<LunaInterceptor>[] = []
  private globalFilters: ClassOrInstance<LunaExceptionFilter>[] = []

  constructor(
    private readonly resolver: <T>(items: ClassOrInstance<T>[]) => T[],
  ) {}

  addGuards(...guards: ClassOrInstance<LunaGuard>[]): void {
    this.globalGuards.push(...guards)
  }

  addPipes(...pipes: ClassOrInstance<LunaPipe>[]): void {
    this.globalPipes.push(...pipes)
  }

  addInterceptors(...interceptors: ClassOrInstance<LunaInterceptor>[]): void {
    this.globalInterceptors.push(...interceptors)
  }

  addFilters(...filters: ClassOrInstance<LunaExceptionFilter>[]): void {
    this.globalFilters.push(...filters)
  }

  collect(
    token: Function,
    prototype: object,
    methodName: string,
  ): ControllerMiddleware {
    const controllerGuards: ClassOrInstance<LunaGuard>[] = Reflect.getMetadata(USE_GUARDS_METADATA, token) ?? []
    const controllerPipes: ClassOrInstance<LunaPipe>[] = Reflect.getMetadata(USE_PIPES_METADATA, token) ?? []
    const controllerInterceptors: ClassOrInstance<LunaInterceptor>[] = Reflect.getMetadata(USE_INTERCEPTORS_METADATA, token) ?? []
    const controllerFilters: ClassOrInstance<LunaExceptionFilter>[] = Reflect.getMetadata(USE_FILTERS_METADATA, token) ?? []

    const methodGuards: ClassOrInstance<LunaGuard>[] = Reflect.getMetadata(USE_GUARDS_METADATA, prototype, methodName) ?? []
    const methodPipes: ClassOrInstance<LunaPipe>[] = Reflect.getMetadata(USE_PIPES_METADATA, prototype, methodName) ?? []
    const methodInterceptors: ClassOrInstance<LunaInterceptor>[] = Reflect.getMetadata(USE_INTERCEPTORS_METADATA, prototype, methodName) ?? []
    const methodFilters: ClassOrInstance<LunaExceptionFilter>[] = Reflect.getMetadata(USE_FILTERS_METADATA, prototype, methodName) ?? []

    return {
      guards:       [...this.globalGuards,       ...controllerGuards,       ...methodGuards],
      pipes:        [...this.globalPipes,        ...controllerPipes,        ...methodPipes],
      interceptors: [...this.globalInterceptors, ...controllerInterceptors, ...methodInterceptors],
      filters:      [...methodFilters, ...controllerFilters, ...this.globalFilters],
    }
  }

  buildHandler(
    instance: Record<string, (...args: unknown[]) => unknown>,
    methodName: string,
    prototype: object,
    middleware: ControllerMiddleware,
    _metadata: HandlerMetadata,
  ): LunaHandler {
    const guards       = this.resolver<LunaGuard>(middleware.guards)
    const pipes        = this.resolver<LunaPipe>(middleware.pipes)
    const interceptors = this.resolver<LunaInterceptor>(middleware.interceptors)
    const filters      = this.resolver<LunaExceptionFilter>(middleware.filters)

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const caughtTypes: (abstract new (...args: any[]) => unknown)[] =
        Reflect.getMetadata(CATCH_METADATA, filter.constructor) ?? []

      const matches =
        caughtTypes.length === 0 ||
        caughtTypes.some((ExType) => exception instanceof ExType)

      if (matches) return filter.catch(exception, message)
    }
    throw exception
  }
}

import { LunaExceptionFilter } from '../filters/filter.interface'
import { USE_FILTERS_METADATA } from '../filters/use-filters.decorator'
import { LunaGuard, USE_GUARDS_METADATA } from '../guards'
import { LunaInterceptor, USE_INTERCEPTORS_METADATA } from '../interceptors'
import { LunaPipe, USE_PIPES_METADATA } from '../pipes'
import { ClassOrInstance } from '../types'

export interface ControllerMiddleware {
  guards: ClassOrInstance<LunaGuard>[]
  pipes: ClassOrInstance<LunaPipe>[]
  interceptors: ClassOrInstance<LunaInterceptor>[]
  filters: ClassOrInstance<LunaExceptionFilter>[]
}

/**
 * Manages the global middleware stacks and merges them with controller- and
 * method-level metadata to produce a per-handler `ControllerMiddleware` snapshot.
 */
export class MiddlewareRegistry {
  private globalGuards: ClassOrInstance<LunaGuard>[] = []
  private globalPipes: ClassOrInstance<LunaPipe>[] = []
  private globalInterceptors: ClassOrInstance<LunaInterceptor>[] = []
  private globalFilters: ClassOrInstance<LunaExceptionFilter>[] = []

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

  collect(token: Function, prototype: object, methodName: string): ControllerMiddleware {
    const controllerGuards: ClassOrInstance<LunaGuard>[] = Reflect.getMetadata(USE_GUARDS_METADATA, token) ?? []
    const controllerPipes: ClassOrInstance<LunaPipe>[] = Reflect.getMetadata(USE_PIPES_METADATA, token) ?? []
    const controllerInterceptors: ClassOrInstance<LunaInterceptor>[] = Reflect.getMetadata(USE_INTERCEPTORS_METADATA, token) ?? []
    const controllerFilters: ClassOrInstance<LunaExceptionFilter>[] = Reflect.getMetadata(USE_FILTERS_METADATA, token) ?? []

    const methodGuards: ClassOrInstance<LunaGuard>[] = Reflect.getMetadata(USE_GUARDS_METADATA, prototype, methodName) ?? []
    const methodPipes: ClassOrInstance<LunaPipe>[] = Reflect.getMetadata(USE_PIPES_METADATA, prototype, methodName) ?? []
    const methodInterceptors: ClassOrInstance<LunaInterceptor>[] = Reflect.getMetadata(USE_INTERCEPTORS_METADATA, prototype, methodName) ?? []
    const methodFilters: ClassOrInstance<LunaExceptionFilter>[] = Reflect.getMetadata(USE_FILTERS_METADATA, prototype, methodName) ?? []

    return {
      guards: [...this.globalGuards, ...controllerGuards, ...methodGuards],
      pipes: [...this.globalPipes, ...controllerPipes, ...methodPipes],
      interceptors: [...this.globalInterceptors, ...controllerInterceptors, ...methodInterceptors],
      filters: [...methodFilters, ...controllerFilters, ...this.globalFilters],
    }
  }
}

import * as grpc from '@grpc/grpc-js'
import { HandlerMetadata, LunaHandler } from '@lunafw/common'

interface GrpcHandlerEntry {
  handler: LunaHandler
  service: string
  method: string
}

/**
 * Collects gRPC handler entries and compiles them into service implementations.
 *
 * Separated from `GrpcAdapter` so that registration concerns (`register`,
 * `groupByService`, `buildServiceImpl`) stay cohesive while server lifecycle
 * (`listen`, `getPort`, `close`, `bindServer`) lives in the adapter.
 */
export class GrpcHandlerRegistry {
  private readonly entries: GrpcHandlerEntry[] = []

  register(handler: LunaHandler, metadata: HandlerMetadata): void {
    this.entries.push({
      handler,
      service: metadata.prefix,
      method: metadata.event,
    })
  }

  buildServices(pkg: Record<string, unknown>, server: grpc.Server): void {
    const servicesByName = this.groupByService()
    for (const [serviceName, methods] of Object.entries(servicesByName)) {
      const ServiceCtor = pkg[serviceName] as grpc.ServiceClientConstructor | undefined
      if (!ServiceCtor?.service) continue
      server.addService(ServiceCtor.service, this.buildServiceImpl(methods))
    }
  }

  private groupByService(): Record<string, Record<string, LunaHandler>> {
    const result: Record<string, Record<string, LunaHandler>> = {}
    for (const { service, method, handler } of this.entries) {
      if (!result[service]) result[service] = {}
      result[service][method] = handler
    }
    return result
  }

  private buildServiceImpl(methods: Record<string, LunaHandler>): grpc.UntypedServiceImplementation {
    const impl: grpc.UntypedServiceImplementation = {}
    for (const [methodName, handler] of Object.entries(methods)) {
      impl[methodName] = this.buildUnaryHandler(handler)
    }
    return impl
  }

  private buildUnaryHandler(handler: LunaHandler): grpc.handleUnaryCall<unknown, unknown> {
    return async (call, callback) => {
      try {
        const result = await handler.handle({
          context: 'grpc',
          payload: call.request,
          metadata: { grpcMetadata: call.metadata.getMap() },
        })
        callback(null, result as object)
      } catch (error) {
        callback({
          code: grpc.status.INTERNAL,
          message: error instanceof Error ? error.message : 'Internal error',
        })
      }
    }
  }
}

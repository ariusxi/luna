import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { AbstractAdapter, HandlerMetadata, LunaHandler } from '@lunafw/common'

import { GrpcAdapterOptions } from '../types'

interface GrpcHandlerEntry {
  handler: LunaHandler
  service: string
  method: string
}

/**
 * gRPC adapter for Luna based on `@grpc/grpc-js`.
 *
 * Loads `.proto` definitions at startup and maps each registered handler to a
 * unary RPC method. The route key is `<prefix>/<event>`, matching the service
 * name from `@Controller` and the RPC method name from `@On`.
 *
 * Only **unary** RPCs are supported. Streaming RPCs are not handled.
 *
 * @example
 * const app = await LunaFactory.createApplication(AppModule, new GrpcAdapter({
 *   port: 50051,
 *   protoPath: path.join(__dirname, 'users.proto'),
 *   packageName: 'users',
 * }))
 * await app.start()
 */
export class GrpcAdapter extends AbstractAdapter {
  private server?: grpc.Server
  private boundPort?: number
  private readonly entries: GrpcHandlerEntry[] = []

  constructor(private readonly options: GrpcAdapterOptions) {
    super()
  }

  /**
   * Registers a handler for a gRPC service method.
   *
   * The `metadata.prefix` is treated as the gRPC service name and `metadata.event`
   * as the RPC method name. Handlers for unknown services or methods registered
   * in the proto are silently skipped at `listen()` time.
   */
  public register(handler: LunaHandler, metadata: HandlerMetadata): void {
    this.entries.push({
      handler,
      service: metadata.prefix,
      method: metadata.event,
    })
  }

  /**
   * Loads the `.proto` definitions, builds the gRPC service implementations from
   * registered handlers, and starts the server.
   */
  public async listen(): Promise<void> {
    const protoPaths = Array.isArray(this.options.protoPath)
      ? this.options.protoPath
      : [this.options.protoPath]

    const packageDef = protoLoader.loadSync(protoPaths, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    })

    const grpcObject = grpc.loadPackageDefinition(packageDef)
    const pkg = grpcObject[this.options.packageName] as Record<string, unknown>

    if (!pkg) throw new Error(`gRPC package "${this.options.packageName}" not found in proto definition`)

    this.server = new grpc.Server()

    const servicesByName = this.groupByService()
    for (const [serviceName, methods] of Object.entries(servicesByName)) {
      const ServiceCtor = pkg[serviceName] as grpc.ServiceClientConstructor | undefined
      if (!ServiceCtor?.service) continue

      const impl = this.buildServiceImpl(methods)
      this.server.addService(ServiceCtor.service, impl)
    }

    await this.bindServer()
  }

  /**
   * Returns the TCP port the server is bound to.
   * Useful when `port: 0` was passed (OS-assigned port).
   *
   * @throws {Error} If the server has not started yet.
   */
  public getPort(): number {
    if (!this.boundPort) throw new Error('gRPC server is not listening')
    return this.boundPort
  }

  /**
   * Shuts down the gRPC server gracefully.
   */
  public async close(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.server?.tryShutdown((error) => (error ? reject(error) : resolve()))
    })
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

  private buildServiceImpl(methods: Record<string, LunaHandler>): grpc.UntypedServiceImplementation {
    const impl: grpc.UntypedServiceImplementation = {}
    for (const [methodName, handler] of Object.entries(methods)) {
      impl[methodName] = this.buildUnaryHandler(handler)
    }
    return impl
  }

  private bindServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server!.bindAsync(
        `0.0.0.0:${this.options.port}`,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) return reject(error)
          this.boundPort = port
          resolve()
        },
      )
    })
  }

  private groupByService(): Record<string, Record<string, LunaHandler>> {
    const result: Record<string, Record<string, LunaHandler>> = {}
    for (const { service, method, handler } of this.entries) {
      if (!result[service]) result[service] = {}
      result[service][method] = handler
    }
    return result
  }
}

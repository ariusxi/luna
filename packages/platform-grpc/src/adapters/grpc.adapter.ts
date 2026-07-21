import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { AbstractAdapter, HandlerMetadata, LunaHandler } from '@lunafw/common'

import { GrpcAdapterOptions } from '../types'
import { GrpcHandlerRegistry } from './grpc.handler.registry'

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
  private readonly registry = new GrpcHandlerRegistry()

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
    this.registry.register(handler, metadata)
  }

  /**
   * Loads the `.proto` definitions, builds the gRPC service implementations from
   * registered handlers, and starts the server.
   */
  public async listen(): Promise<void> {
    const pkg = this.loadProtoPackage()
    this.server = new grpc.Server()
    this.registry.buildServices(pkg, this.server)
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

  private loadProtoPackage(): Record<string, unknown> {
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

    return pkg
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
}

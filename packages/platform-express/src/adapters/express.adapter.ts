import { Server } from 'http'
import express, { Application, Request } from 'express'
import { AbstractAdapter, HandlerMetadata, LunaHandler } from '@lunafw/common'

import { ExpressAdapterOptions, ExpressHandler } from '../types'
import { ExpressHandlerRegistry } from './express.handler.registry'

/**
 * HTTP adapter for Luna based on Express.
 *
 * Translates incoming HTTP requests into `LunaMessage` instances, dispatches
 * them to the registered handlers, and writes the response back to the client.
 *
 * HTTP exceptions (`HttpException` subclasses) thrown from handlers are mapped
 * to the appropriate HTTP status codes. Guard rejections become 401. Any other
 * unhandled error becomes 500.
 *
 * @example
 * const app = await LunaFactory.createApplication(AppModule, new ExpressAdapter({ port: 3000 }))
 * await app.start()
 */
export class ExpressAdapter extends AbstractAdapter {
  private server?: Server
  private readonly app: Application = express()
  private readonly registry = new ExpressHandlerRegistry()

  constructor(private readonly options: ExpressAdapterOptions) {
    super()
    // Keep the raw bytes alongside the parsed JSON so handlers can verify a
    // signature over the exact payload (webhooks) via `@RawBody()`. `verify`
    // runs before parsing, so the buffer is the untouched request body.
    this.app.use(express.json({
      verify: (request: Request, _response, buffer: Buffer) => {
        request.rawBody = buffer
      },
    }))
  }

  /**
   * Queues a handler for registration.
   *
   * Routes are not mounted until `listen()` is called so that all handlers are
   * registered before the Express application starts accepting requests.
   */
  public register(handler: LunaHandler, metadata: HandlerMetadata): void {
    this.registry.register(handler, metadata)
  }

  /**
   * Mounts all queued routes and starts the HTTP server.
   *
   * Each handler is mounted under `/<prefix><path>` using the `event` value as
   * the Express HTTP method. After all routes are mounted the server begins
   * accepting connections on the configured port.
   */
  public async listen(): Promise<void> {
    this.registry.mountRoutes(this.app)

    const server = this.app.listen(this.options.port)
    this.server = server

    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve)
      server.once('error', reject)
    })
  }

  /**
   * Returns the TCP port the server is currently bound to.
   *
   * Useful when the adapter was created with `port: 0` (OS-assigned port).
   *
   * @throws {Error} If the server has not started yet.
   */
  public getPort(): number {
    const address = this.server?.address()
    if (!address || typeof address === 'string') throw new Error('Server is not listening')
    return address.port
  }

  /** Returns the list of handlers registered so far (before or after `listen()`). */
  public getHandlers(): ExpressHandler[] {
    return this.registry.getHandlers()
  }

  /**
   * Returns the underlying Express application.
   *
   * Lets integrations mount raw Express middleware or static assets that the
   * message/handler pipeline does not cover — for example serving an interactive
   * API documentation UI (`@lunafw/swagger`).
   */
  public getApp(): Application {
    return this.app
  }

  /**
   * Returns the underlying Node HTTP server, available after {@link listen}.
   *
   * Lets another adapter share this server and port — e.g. `@lunafw/platform-ws`
   * attaching its WebSocket server so upgrades happen on the same HTTP port,
   * which single-port hosts (Render, Heroku, …) require.
   */
  public getHttpServer(): Server | undefined {
    return this.server
  }

  /** Closes the HTTP server and releases the port. */
  public async close(): Promise<void> {
    if (!this.server) return
    await new Promise<void>((resolve, reject) => {
      this.server!.close((err) => (err ? reject(err) : resolve()))
    })
  }
}

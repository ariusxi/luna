import { Server } from 'http'
import express, { Application, Request, Response, Router } from 'express'
import { AbstractAdapter, GuardRejectionError, HandlerMetadata, LunaHandler } from '@lunafw/common'

import { ExpressAdapterOptions, ExpressHandler } from '../types'
import { HttpException } from '../exceptions'
import { HttpMethod } from '../types/http-method.type'

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
  private handlers: ExpressHandler[] = []
  private readonly app: Application = express()

  constructor(private readonly options: ExpressAdapterOptions) {
    super()
    this.app.use(express.json())
  }

  /**
   * Queues a handler for registration.
   *
   * Routes are not mounted until `listen()` is called so that all handlers are
   * registered before the Express application starts accepting requests.
   */
  public register(handler: LunaHandler, metadata: HandlerMetadata): void {
    this.handlers.push({ handler, metadata })
  }

  /**
   * Mounts all queued routes and starts the HTTP server.
   *
   * Each handler is mounted under `/<prefix><path>` using the `event` value as
   * the Express HTTP method. After all routes are mounted the server begins
   * accepting connections on the configured port.
   */
  public async listen(): Promise<void> {
    for (const { handler, metadata } of this.handlers) {
      const { event, prefix, path } = metadata
      const router = Router()

      router[event as HttpMethod](path, async (request: Request, response: Response) => {
        try {
          const result = await handler.handle({
            context: 'http',
            payload: request.body,
            metadata: {
              params: request.params,
              query: request.query,
              headers: request.headers,
            },
          })

          return response.json(result)
        } catch (error) {
          if (error instanceof HttpException) {
            return response.status(error.statusCode).json({
              statusCode: error.statusCode,
              message: error.message,
            })
          }
          if (error instanceof GuardRejectionError) {
            return response.status(401).json({
              statusCode: 401,
              message: 'Unauthorized',
            })
          }
          return response.status(500).json({
            statusCode: 500,
            message: 'Internal Server Error',
          })
        }
      })

      this.app.use(`/${prefix}`, router)
    }

    this.server = this.app.listen(this.options.port)
    await new Promise<void>((resolve, reject) => {
      this.server!.once('listening', resolve)
      this.server!.once('error', reject)
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
    if (!address || typeof address === 'string') {
      throw new Error('Server is not listening')
    }
    return address.port
  }

  /** Returns the list of handlers registered so far (before or after `listen()`). */
  public getHandlers(): ExpressHandler[] {
    return this.handlers
  }

  /** Closes the HTTP server and releases the port. */
  public async close(): Promise<void> {
    this.server?.close()
    await new Promise<void>((resolve, reject) => {
      this.server!.once('close', resolve)
      this.server!.once('error', reject)
    })
  }
}

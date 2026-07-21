import { Server } from 'http'
import express, { Application, Request, Response, Router } from 'express'
import { AbstractAdapter, GuardRejectionError, HandlerMetadata, HttpException, LunaHandler } from '@lunafw/common'

import { ExpressAdapterOptions, ExpressHandler } from '../types'
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
  private static readonly HTTP_METHODS: ReadonlySet<string> = new Set([
    'get', 'post', 'put', 'patch', 'delete', 'options', 'head',
  ])

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
      if (!ExpressAdapter.HTTP_METHODS.has(event)) continue

      const router = Router()
      router[event as HttpMethod](path, this.buildRoute(handler))
      this.app.use(`/${prefix}`, router)
    }

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
    return this.handlers
  }

  /** Closes the HTTP server and releases the port. */
  public async close(): Promise<void> {
    if (!this.server) return
    await new Promise<void>((resolve, reject) => {
      this.server!.close((err) => (err ? reject(err) : resolve()))
    })
  }

  private buildRoute(handler: LunaHandler) {
    return async (request: Request, response: Response) => {
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
        response.json(result)
      } catch (error) {
        this.handleError(error, response)
      }
    }
  }

  private handleError(error: unknown, response: Response): void {
    if (this.isHttpException(error)) {
      response.status(error.statusCode).json({ statusCode: error.statusCode, message: error.message })
      return
    }
    if (error instanceof GuardRejectionError) {
      response.status(401).json({ statusCode: 401, message: 'Unauthorized' })
      return
    }
    console.error('[LunaAdapter] Unhandled error:', error)
    response.status(500).json({ statusCode: 500, message: 'Internal Server Error' })
  }

  private isHttpException(error: unknown): error is HttpException {
    return error instanceof Error && typeof (error as HttpException).statusCode === 'number'
  }
}

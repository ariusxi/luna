import { Application, Router, Request, Response } from 'express'
import { GuardRejectionError, HttpException, HandlerMetadata, LunaHandler } from '@lunafw/common'

import { ExpressHandler } from '../types'
import { HttpExceptionResponse } from '../exceptions'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head'

const HTTP_METHODS: ReadonlySet<string> = new Set([
  'get', 'post', 'put', 'patch', 'delete', 'options', 'head',
])

/**
 * Collects Express handler entries and mounts them onto an Express application.
 *
 * Separated from `ExpressAdapter` so that handler registration/routing concerns
 * stay cohesive while server lifecycle (`listen`, `getPort`, `close`) lives in
 * the adapter.
 */
export class ExpressHandlerRegistry {
  private readonly handlers: ExpressHandler[] = []

  register(handler: LunaHandler, metadata: HandlerMetadata): void {
    this.handlers.push({ handler, metadata })
  }

  getHandlers(): ExpressHandler[] {
    return this.handlers
  }

  mountRoutes(app: Application): void {
    for (const { handler, metadata } of this.handlers) {
      const { event, prefix, path } = metadata
      if (!HTTP_METHODS.has(event)) continue

      const router = Router()
      router[event as HttpMethod](path, this.buildRoute(handler))
      app.use(`/${prefix}`, router)
    }
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
      const body: HttpExceptionResponse = { statusCode: error.statusCode, message: error.message }
      response.status(error.statusCode).json(body)
      return
    }
    if (error instanceof GuardRejectionError) {
      const body: HttpExceptionResponse = { statusCode: 401, message: 'Unauthorized' }
      response.status(401).json(body)
      return
    }
    console.error('[LunaAdapter] Unhandled error:', error)
    const body: HttpExceptionResponse = { statusCode: 500, message: 'Internal Server Error' }
    response.status(500).json(body)
  }

  private isHttpException(error: unknown): error is HttpException {
    return error instanceof Error && typeof (error as HttpException).statusCode === 'number'
  }
}

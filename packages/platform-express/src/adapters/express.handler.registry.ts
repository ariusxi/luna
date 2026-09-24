import { Application, Router, Request, RequestHandler, Response } from 'express'
import multer from 'multer'
import { GuardRejectionError, HttpException, HandlerMetadata, LunaHandler } from '@lunafw/common'

import { ExpressHandler } from '../types'
import { HttpExceptionResponse } from '../exceptions'
import { compileExpressRoutePath } from '../routing/express-route-path'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head'

/** Shared in-memory multipart parser; files land on `req.file` as Buffers. */
const upload = multer()

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
    const entry = { handler, metadata }
    if (metadata.path.includes('*')) {
      this.handlers.push(entry)
      return
    }

    const firstWildcard = this.handlers.findIndex(({ metadata: item }) => item.path.includes('*'))
    if (firstWildcard === -1) this.handlers.push(entry)
    else this.handlers.splice(firstWildcard, 0, entry)
  }

  getHandlers(): ExpressHandler[] {
    return this.handlers
  }

  mountRoutes(app: Application): void {
    for (const { handler, metadata } of this.handlers) {
      const { event, prefix, path } = metadata
      if (!HTTP_METHODS.has(event)) continue

      const router = Router()
      const middleware = this.uploadMiddleware(metadata.uploadField)
      const route = compileExpressRoutePath(path)
      router[event as HttpMethod](
        route.path,
        ...route.paramsMiddleware,
        ...middleware,
        this.buildRoute(handler, metadata.successStatusCode),
      )
      app.use(`/${prefix}`, router)
    }
  }

  /** Multipart parser for routes with an `@UploadedFile` param; empty otherwise. */
  private uploadMiddleware(uploadField?: string): RequestHandler[] {
    if (!uploadField) return []
    return [upload.single(uploadField)]
  }

  private buildRoute(handler: LunaHandler, successStatusCode?: number) {
    return async (request: Request, response: Response) => {
      try {
        const result = await handler.handle({
          context: 'http',
          payload: request.body,
          metadata: {
            params: request.params,
            query: request.query,
            headers: request.headers,
            file: request.file,
          },
        })
        response.status(successStatusCode ?? 200).json(result)
      } catch (error) {
        this.handleError(error, response)
      }
    }
  }

  private handleError(error: unknown, response: Response): void {
    if (this.isHttpException(error)) {
      const body: HttpExceptionResponse = { statusCode: error.statusCode, message: error.message, ...error.details }
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

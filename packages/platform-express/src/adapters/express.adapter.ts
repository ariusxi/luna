import { Server } from 'http'
import express, { Application, Request, Response, Router } from 'express'
import { AbstractAdapter, HandlerMetadata, LunaHandler } from '@lunafw/common'

import { ExpressAdapterOptions, ExpressHandler } from '../types'
import { HttpException } from '../exceptions'
import { HttpMethod } from '../types/http-method.type'

export class ExpressAdapter extends AbstractAdapter {
  private server?: Server
  private handlers: ExpressHandler[] = []
  private readonly app: Application = express()

  constructor(private readonly options: ExpressAdapterOptions) {
    super()
    this.app.use(express.json())
  }

  public register(handler: LunaHandler, metadata: HandlerMetadata): void {
    this.handlers.push({ handler, metadata })
  }

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

  public getPort(): number {
    const address = this.server?.address()
    if (!address || typeof address === 'string') {
      throw new Error('Server is not listening')
    }
    return address.port
  }

  public getHandlers(): ExpressHandler[] {
    return this.handlers
  }

  public async close(): Promise<void> {
    this.server?.close()
    await new Promise<void>((resolve, reject) => {
      this.server!.once('close', resolve)
      this.server!.once('error', reject)
    })
  }
}

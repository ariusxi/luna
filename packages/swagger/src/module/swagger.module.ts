import { Injectable, Module } from '@lunafw/core'
import type { AbstractAdapter, OnAdapterInit } from '@lunafw/common'
import swaggerUi from 'swagger-ui-express'

import {
  buildOpenApiDocument,
  type BuildOpenApiDocumentOptions,
} from '../document/build-open-api-document'

/** Options passed to `SwaggerModule.forRoot`. The Express app is resolved from the adapter at boot. */
export interface SwaggerForRootOptions extends BuildOpenApiDocumentOptions {
  /** Base route for the UI (default `/docs`); the raw JSON is served at `<route>-json`. */
  route?: string
}

interface SwaggerResponse {
  json(body: unknown): unknown
}

interface ExpressLikeApp {
  use(path: string, ...handlers: unknown[]): unknown
  get(path: string, handler: (request: unknown, response: SwaggerResponse) => unknown): unknown
}

interface HttpAdapterWithApp {
  getApp(): ExpressLikeApp
}

// One docs configuration per process, set by forRoot() and consumed by the
// bootstrap provider once the adapters are available.
let registeredOptions: SwaggerForRootOptions | undefined

function hasGetApp(adapter: AbstractAdapter): adapter is AbstractAdapter & HttpAdapterWithApp {
  return typeof (adapter as unknown as HttpAdapterWithApp).getApp === 'function'
}

/**
 * Mounts the Swagger UI (`/docs`) and the raw OpenAPI document (`/docs-json`) on
 * the HTTP adapter's Express app once the application has resolved. Runs through
 * the `onAdapterInit` lifecycle hook so `SwaggerModule` can live in a module's
 * `imports` like any other module.
 */
@Injectable()
export class SwaggerBootstrap implements OnAdapterInit {
  public onAdapterInit(adapters: AbstractAdapter[]): void {
    if (!registeredOptions) return

    const httpAdapter = adapters.find(hasGetApp)
    if (!httpAdapter) return

    const options = registeredOptions
    const route = options.route ?? '/docs'
    const document = buildOpenApiDocument({
      info: options.info,
      tags: options.tags,
      controllers: options.controllers,
      schemas: options.schemas,
    })

    const app = httpAdapter.getApp()
    app.get(`${route}-json`, (_request, response) => response.json(document))
    app.use(
      route,
      ...swaggerUi.serve,
      swaggerUi.setup(document as unknown as Parameters<typeof swaggerUi.setup>[0]),
    )
  }
}

@Module({ providers: [SwaggerBootstrap] })
export class SwaggerModule {
  /**
   * Registers the documentation configuration and returns the module so it can
   * be added to another module's `imports`.
   *
   * @example
   * @Module({
   *   imports: [SwaggerModule.forRoot({
   *     info: { title: 'Mokafi API', version: '1.0.0' },
   *     controllers: [HealthController, MindMapController],
   *     schemas: [HealthResponseDto],
   *   })],
   * })
   * export class AppModule {}
   */
  public static forRoot(options: SwaggerForRootOptions): typeof SwaggerModule {
    registeredOptions = options
    return SwaggerModule
  }
}

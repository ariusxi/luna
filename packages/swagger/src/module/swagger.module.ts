import swaggerUi from 'swagger-ui-express'

import {
  buildOpenApiDocument,
  type BuildOpenApiDocumentOptions,
  type OpenApiDocument,
} from '../document/build-open-api-document'

/** Minimal response surface used to serve the raw document as JSON. */
interface SwaggerResponse {
  json(body: unknown): unknown
}

/**
 * The subset of an Express application `SwaggerModule` needs. Satisfied by
 * `ExpressAdapter.getApp()`; kept structural so the module never hard-depends on
 * a specific Express version.
 */
export interface SwaggerApp {
  use(path: string, ...handlers: unknown[]): unknown
  get(path: string, handler: (request: unknown, response: SwaggerResponse) => unknown): unknown
}

export interface SwaggerSetupOptions extends BuildOpenApiDocumentOptions {
  /** The Express app, e.g. `expressAdapter.getApp()`. */
  app: SwaggerApp
  /** Base route for the UI (default `/docs`); the raw JSON is served at `<route>-json`. */
  route?: string
}

export class SwaggerModule {
  /**
   * Builds the OpenAPI document from the given controllers/schemas and mounts the
   * interactive Swagger UI at `route` plus the raw document at `<route>-json`.
   *
   * @returns the generated document (useful for tests or exporting to a file).
   *
   * @example
   * const adapter = new ExpressAdapter({ port })
   * const app = await LunaFactory.createApplication(AppModule, [adapter])
   * await app.start()
   * SwaggerModule.forRoot({
   *   app: adapter.getApp(),
   *   info: { title: 'Mokafi API', version: '1.0.0' },
   *   controllers: [HealthController, MindMapController],
   *   schemas: [MindMapNodeDto],
   * })
   */
  public static forRoot(options: SwaggerSetupOptions): OpenApiDocument {
    const route = options.route ?? '/docs'
    const document = buildOpenApiDocument({
      info: options.info,
      tags: options.tags,
      controllers: options.controllers,
      schemas: options.schemas,
    })

    options.app.get(`${route}-json`, (_request, response) => response.json(document))
    options.app.use(
      route,
      ...swaggerUi.serve,
      swaggerUi.setup(document as unknown as Parameters<typeof swaggerUi.setup>[0]),
    )

    return document
  }
}

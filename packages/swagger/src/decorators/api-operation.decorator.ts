import { type ApiOperationOptions, SWAGGER_OPERATION } from '../swagger.metadata'

/**
 * Documents a controller handler: summary, tags, and whether it requires the
 * bearer security scheme. Read by `buildOpenApiDocument` alongside the route's
 * `@On` metadata.
 *
 * @example
 * @ApiOperation({ summary: 'List users', tags: ['users'], isAuthenticated: true })
 * @On('get', '/')
 * findAll(message: LunaMessage) { ... }
 */
export const ApiOperation = (options: ApiOperationOptions): MethodDecorator => {
  return (target, propertyKey) => {
    Reflect.defineMetadata(SWAGGER_OPERATION, options, target, propertyKey)
  }
}

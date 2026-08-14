import { type ApiBodyOptions, SWAGGER_BODY } from '../swagger.metadata'

/**
 * Documents the request body of a handler, referencing a schema registered with
 * `@ApiSchema`.
 *
 * @example
 * @ApiBody({ schema: 'MutateMindMapDto' })
 * @On('post', '/')
 * mutate(message: LunaMessage) { ... }
 */
export const ApiBody = (options: ApiBodyOptions): MethodDecorator => {
  return (target, propertyKey) => {
    Reflect.defineMetadata(SWAGGER_BODY, options, target, propertyKey)
  }
}

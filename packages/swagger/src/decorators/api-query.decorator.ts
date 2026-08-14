import { type ApiQueryOptions, SWAGGER_QUERIES } from '../swagger.metadata'

/**
 * Documents one query-string parameter of a handler. Apply once per parameter;
 * each call is accumulated.
 *
 * @example
 * @ApiQuery({ name: 'page', type: 'integer', required: false })
 * @ApiQuery({ name: 'search', type: 'string' })
 */
export const ApiQuery = (options: ApiQueryOptions): MethodDecorator => {
  return (target, propertyKey) => {
    const existing = (Reflect.getMetadata(SWAGGER_QUERIES, target, propertyKey) as ApiQueryOptions[]) ?? []
    Reflect.defineMetadata(SWAGGER_QUERIES, [...existing, options], target, propertyKey)
  }
}

import { type ApiResponseOptions, SWAGGER_RESPONSES } from '../swagger.metadata'

/**
 * Documents one response of a handler. Apply once per status code; each call is
 * accumulated so a handler can declare several responses.
 *
 * @example
 * @ApiResponse({ status: 200, description: 'The user', schema: 'UserDto' })
 * @ApiResponse({ status: 404, description: 'Not found' })
 */
export const ApiResponse = (options: ApiResponseOptions): MethodDecorator => {
  return (target, propertyKey) => {
    const existing = (Reflect.getMetadata(SWAGGER_RESPONSES, target, propertyKey) as ApiResponseOptions[]) ?? []
    Reflect.defineMetadata(SWAGGER_RESPONSES, [...existing, options], target, propertyKey)
  }
}

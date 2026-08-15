export const HTTP_CODE_METADATA = 'luna:http-code'

/**
 * Overrides the success status code for a handler's response.
 *
 * By default adapters respond to a successful handler with `200`. Apply
 * `@HttpCode` to send a different status on success — e.g. `201` for a resource
 * that was created. Error responses are unaffected; they keep the status of the
 * thrown `HttpException`.
 *
 * @param statusCode - Status to send when the handler resolves successfully.
 *
 * @example
 * @On('post', '/')
 * @HttpCode(201)
 * create(@Body() body: CreateUserDto) { ... }
 */
export const HttpCode = (statusCode: number): MethodDecorator => {
  return (target, propertyKey) => {
    Reflect.defineMetadata(HTTP_CODE_METADATA, statusCode, target, propertyKey)
  }
}

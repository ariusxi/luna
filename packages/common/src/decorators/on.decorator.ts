export const ON_METADATA = 'luna:on'

/**
 * Marks a controller method as a message handler for a specific event and path.
 *
 * The `event` value is adapter-defined — each adapter interprets it according
 * to its protocol (e.g. HTTP method, WebSocket event name, gRPC procedure).
 *
 * @param event - Protocol-specific event identifier (e.g. `'get'`, `'post'`, `'message'`, `'FindUser'`).
 * @param path - Optional path or topic (e.g. `'/'`, `'/:id'`, `'user.created'`).
 *
 * @example
 * @Controller('users')
 * class UserController {
 *   @On('get', '/')
 *   findAll(message: LunaMessage) { ... }
 *
 *   @On('post', '/')
 *   create(message: LunaMessage) { ... }
 * }
 */
export const On = (event: string, path?: string): MethodDecorator => {
  return (target, propertyKey) => {
    Reflect.defineMetadata(ON_METADATA, { event, path: path ?? '' }, target, propertyKey)
  }
}

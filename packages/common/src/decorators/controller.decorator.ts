export const CONTROLLER_METADATA = 'luna:controller'

/**
 * Marks a class as a Luna controller and associates it with a protocol context.
 *
 * The `context` string is adapter-defined — adapters read this metadata during
 * handler registration to decide how to route incoming messages to the class.
 *
 * @param context - Optional protocol context identifier (e.g. `'users'`, `'chat'`).
 *
 * @example
 * @Controller('users')
 * class UserController { ... }
 */
export const Controller = (context?: string): ClassDecorator => {
  return (target: any) => {
    Reflect.defineMetadata(CONTROLLER_METADATA, context ?? '', target)
  }
}
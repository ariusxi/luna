import { LunaPipe } from './pipe.interface'

export const USE_PIPES_METADATA = 'luna:pipes'

type ClassConstructor<T> = new (...args: unknown[]) => T

/**
 * Applies one or more pipes to a controller class or a handler method.
 *
 * Pipes are executed in the order they are provided, after guards and before
 * the handler. Each pipe receives the `LunaMessage` and returns a
 * (possibly transformed) message for the next pipe or handler.
 *
 * @param pipes - One or more pipe classes to apply.
 *
 * @example
 * @UsePipes(ValidationPipe)
 * @Controller('users')
 * class UserController {
 *   @UsePipes(ParseIntPipe)
 *   @On('get', '/:id')
 *   findOne(message: LunaMessage) { ... }
 * }
 */
export const UsePipes = (...pipes: ClassConstructor<LunaPipe>[]): ClassDecorator & MethodDecorator => {
  return (target: object, propertyKey?: string | symbol) => {
    if (propertyKey !== undefined) {
      Reflect.defineMetadata(USE_PIPES_METADATA, pipes, target, propertyKey)
    } else {
      Reflect.defineMetadata(USE_PIPES_METADATA, pipes, target)
    }
  }
}

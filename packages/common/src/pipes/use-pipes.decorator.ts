import { ClassOrInstance } from '../types/class-or-instance.type'
import { LunaPipe } from './pipe.interface'

export const USE_PIPES_METADATA = 'luna:pipes'

/**
 * Applies one or more pipes to a controller class or a handler method.
 *
 * Each pipe can be provided as a **class** (resolved from the DI container,
 * falling back to direct instantiation) or as a pre-built **instance** (useful
 * when the pipe needs configuration such as a Zod schema or a DTO class).
 *
 * Pipes execute in declaration order, after guards and before the handler. Each
 * pipe receives the current `LunaMessage` and returns a (possibly transformed)
 * message that is forwarded to the next pipe or to the handler.
 *
 * @param pipes - One or more pipe classes or instances.
 *
 * @example
 * // class — resolved via DI
 * @UsePipes(ValidationPipe)
 * @Controller('users')
 * class UserController {
 *   // instance — Zod schema passed at decoration time
 *   @UsePipes(new ZodPipe(CreateUserSchema))
 *   @On('post', '/')
 *   create(message: LunaMessage) { ... }
 * }
 */
export const UsePipes = (...pipes: ClassOrInstance<LunaPipe>[]): ClassDecorator & MethodDecorator => {
  return (target: object, propertyKey?: string | symbol) => {
    if (propertyKey !== undefined) {
      Reflect.defineMetadata(USE_PIPES_METADATA, pipes, target, propertyKey)
    } else {
      Reflect.defineMetadata(USE_PIPES_METADATA, pipes, target)
    }
  }
}

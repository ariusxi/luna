import { ModuleProperties } from '../types'
import { ModuleManager } from '../managers'

/**
 * Declares a class as a Luna module.
 *
 * Modules are the primary unit of organization in Luna. Each module encapsulates
 * a related set of providers and can import or export providers to other modules.
 *
 * @example
 * @Module({
 *   imports: [DatabaseModule],
 *   providers: [UserService, UserController],
 *   exports: [UserService],
 * })
 * export class UserModule {}
 */
export function Module(properties: ModuleProperties): ClassDecorator {
  return (target) => {
    ModuleManager.register(target, properties)
  }
}

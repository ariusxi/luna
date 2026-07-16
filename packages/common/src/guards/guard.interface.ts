import { LunaMessage } from '../types/message.interface'

/**
 * Interface that all Luna guards must implement.
 *
 * A guard decides whether a handler should be executed based on the incoming
 * message. It runs before the handler and can be applied at controller or
 * method level via `@UseGuards`.
 *
 * @example
 * @Injectable()
 * class AuthGuard implements LunaGuard {
 *   canActivate(message: LunaMessage): boolean {
 *     const auth = (message.metadata.headers as Record<string, string>)['authorization']
 *     return !!auth
 *   }
 * }
 */
export interface LunaGuard {
  canActivate(message: LunaMessage): boolean | Promise<boolean>
}

import { LunaMessage } from '../types/message.interface'

/**
 * Interface that all Luna pipes must implement.
 *
 * A pipe transforms or validates the incoming `LunaMessage` before it reaches
 * the handler. It can modify the payload, throw an exception to reject the
 * request, or return the message unchanged.
 *
 * @example
 * @Injectable()
 * class ValidationPipe implements LunaPipe {
 *   transform(message: LunaMessage): LunaMessage {
 *     if (!message.payload) throw new BadRequestException('Payload is required')
 *     return message
 *   }
 * }
 */
export interface LunaPipe {
  transform(message: LunaMessage): LunaMessage | Promise<LunaMessage>
}

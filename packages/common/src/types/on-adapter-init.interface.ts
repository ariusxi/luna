import { AbstractAdapter } from './adapter.abstract'

/**
 * Lifecycle hook for providers that need access to the protocol adapters after
 * the application has resolved but before the adapters start listening.
 *
 * Implement it on an `@Injectable` provider to enrich an adapter with behaviour
 * the message/handler pipeline cannot express — for example mounting an
 * interactive API documentation UI on the HTTP adapter (`@lunafw/swagger`).
 *
 * @example
 * @Injectable()
 * class SwaggerBootstrap implements OnAdapterInit {
 *   onAdapterInit(adapters: AbstractAdapter[]): void {
 *     const http = adapters.find((adapter) => 'getApp' in adapter)
 *     // mount middleware on the HTTP adapter's app…
 *   }
 * }
 */
export interface OnAdapterInit {
  onAdapterInit(adapters: AbstractAdapter[]): void | Promise<void>
}

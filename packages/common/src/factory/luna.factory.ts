import { LunaFactory as CoreFactory } from '@lunafw/core'

import { AbstractAdapter } from '../types'
import { LunaApplication } from './luna.application'

export class LunaFactory {
  /**
   * Bootstraps a Luna application with one or more protocol adapters.
   *
   * Internally calls `@lunafw/core`'s `LunaFactory.create` to resolve the module
   * tree and DI container, then wraps the result in a `LunaApplication` that
   * manages the adapter lifecycle.
   *
   * @param module - The root module that defines the application structure.
   * @param adapters - A single adapter or an array of adapters to register.
   *
   * @example
   * const app = await LunaFactory.createApplication(AppModule, new HttpAdapter({ port: 3000 }))
   * await app.start()
   *
   * @example
   * const app = await LunaFactory.createApplication(AppModule, [
   *   new HttpAdapter({ port: 3000 }),
   *   new WebSocketAdapter({ port: 3001 }),
   * ])
   * await app.start()
   */
  public static async createApplication(module: Function, adapters: AbstractAdapter | AbstractAdapter[]): Promise<LunaApplication> {
    const container = await CoreFactory.create(module)
    const applicationAdapters = Array.isArray(adapters) ? adapters : [adapters]

    return new LunaApplication(container, applicationAdapters)
  }
}
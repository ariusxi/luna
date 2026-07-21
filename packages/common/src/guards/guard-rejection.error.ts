export interface GuardRejection {
  name: string
  message: string
}

/**
 * Thrown by `LunaApplication` when a guard's `canActivate` returns `false`.
 *
 * Adapters should catch this error and respond with an appropriate
 * "access denied" response for their protocol (e.g. 401 for HTTP).
 */
export class GuardRejectionError extends Error implements GuardRejection {
  constructor() {
    super('Guard rejected the request')
    this.name = 'GuardRejectionError'
  }
}

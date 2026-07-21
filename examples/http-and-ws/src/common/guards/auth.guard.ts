import { Injectable } from '@lunafw/core'
import { LunaGuard, LunaMessage } from '@lunafw/common'

@Injectable()
export class AuthGuard implements LunaGuard {
  canActivate(message: LunaMessage): boolean {
    const headers = (message.metadata.headers ?? {}) as Record<string, string>
    return !!headers['authorization']
  }
}

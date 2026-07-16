import { Token } from "../types";

/**
 * Thrown when the DI container cannot resolve a provider for a given token.
 *
 * The error message includes the module name and, when available, the name of
 * the provider that required the unresolved dependency, making it easy to
 * trace the injection chain.
 *
 * @example
 * // thrown automatically by DependencyContainer.resolve()
 * // → [Luna] Cannot resolve UserRepository in AppModule
 * //    → Required by UserService
 * //    → Did you forget to add UserRepository to providers in AppModule?
 */
export class DependencyResolutionError extends Error {
  constructor(token: Token, moduleClass: Function, dependencyOf?: Token) {
    const moduleName = moduleClass.name
    const tokenName = DependencyResolutionError.getTokenName(token)
    const hint = DependencyResolutionError.getHintMessage(tokenName, moduleName, dependencyOf)

    super(`[Luna] Cannot resolve ${tokenName} in ${moduleName}\n${hint}`)
  }

  private static getHintMessage(tokenName: string, moduleName: string, dependencyOf?: Token): string {
    if (dependencyOf) {
      const dependencyName = this.getTokenName(dependencyOf)
      return ` → Required by ${dependencyName}\n → Did you forget to add ${tokenName} to providers in ${moduleName}?`
    }
    return ` → Did you forget to add ${tokenName} to providers in ${moduleName}`
  }

  private static getTokenName(token: Token): string {
    if (typeof token === 'string') return token
    if (typeof token === 'symbol') return token.toString()
    return token.name
  }
}

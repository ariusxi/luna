import { Token } from "../types";

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
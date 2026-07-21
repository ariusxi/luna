import { Injectable } from '@lunafw/core'

export interface IConfigService {
  get<T = string>(key: string): T | undefined
  get<T = string>(key: string, defaultValue: T): T
}

@Injectable()
export class ConfigService implements IConfigService {
  get<T = string>(key: string): T | undefined
  get<T = string>(key: string, defaultValue: T): T
  get<T = string>(key: string, defaultValue?: T): T | undefined {
    const value = process.env[key]
    if (value === undefined) return defaultValue
    return value as unknown as T
  }
}

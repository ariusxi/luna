import fs from 'fs'
import path from 'path'
import { Module } from '@lunafw/core'
import { ConfigService } from './config.service'
import { ConfigModuleOptions } from './config.types'

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {
  static load(options: ConfigModuleOptions = {}): void {
    if (options.ignoreEnvFile) return

    const envPaths = Array.isArray(options.envFilePath)
      ? options.envFilePath
      : [options.envFilePath ?? '.env']

    for (const envPath of envPaths) {
      const resolved = path.resolve(process.cwd(), envPath)
      if (!fs.existsSync(resolved)) continue
      parseEnvFile(resolved)
    }
  }
}

const parseEnvFile = (filePath: string): void => {
  const content = fs.readFileSync(filePath, 'utf-8')

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.slice(0, eqIndex).trim()
    const raw = trimmed.slice(eqIndex + 1).trim()
    const value = stripQuotes(raw)

    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}

const stripQuotes = (value: string): string => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

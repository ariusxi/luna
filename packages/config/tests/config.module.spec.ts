import 'reflect-metadata'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { ConfigModule } from '../src/config.module'

let _counter = 0

const writeEnvFile = (content: string): string => {
  const filePath = path.join(os.tmpdir(), `.env.test.${_counter++}`)
  fs.writeFileSync(filePath, content, 'utf-8')
  return filePath
}

describe('ConfigModule.load', () => {
  afterEach(() => {
    delete process.env.LOADED_KEY
    delete process.env.QUOTED_KEY
    delete process.env.SINGLE_QUOTED
    delete process.env.COMMENT_KEY
  })

  it('loads key=value pairs into process.env', () => {
    const filePath = writeEnvFile('LOADED_KEY=loaded_value\n')
    ConfigModule.load({ envFilePath: filePath })
    expect(process.env.LOADED_KEY).toBe('loaded_value')
    fs.unlinkSync(filePath)
  })

  it('strips double quotes from values', () => {
    const filePath = writeEnvFile('QUOTED_KEY="quoted value"\n')
    ConfigModule.load({ envFilePath: filePath })
    expect(process.env.QUOTED_KEY).toBe('quoted value')
    fs.unlinkSync(filePath)
  })

  it('strips single quotes from values', () => {
    const filePath = writeEnvFile("SINGLE_QUOTED='single'\n")
    ConfigModule.load({ envFilePath: filePath })
    expect(process.env.SINGLE_QUOTED).toBe('single')
    fs.unlinkSync(filePath)
  })

  it('ignores comment lines', () => {
    const filePath = writeEnvFile('# this is a comment\nCOMMENT_KEY=value\n')
    ConfigModule.load({ envFilePath: filePath })
    expect(process.env.COMMENT_KEY).toBe('value')
    fs.unlinkSync(filePath)
  })

  it('does not override already-set env vars', () => {
    process.env.LOADED_KEY = 'original'
    const filePath = writeEnvFile('LOADED_KEY=override\n')
    ConfigModule.load({ envFilePath: filePath })
    expect(process.env.LOADED_KEY).toBe('original')
    fs.unlinkSync(filePath)
  })

  it('silently skips a missing .env file', () => {
    expect(() => ConfigModule.load({ envFilePath: '/nonexistent/.env' })).not.toThrow()
  })

  it('skips loading when ignoreEnvFile is true', () => {
    const filePath = writeEnvFile('LOADED_KEY=should_not_load\n')
    ConfigModule.load({ envFilePath: filePath, ignoreEnvFile: true })
    expect(process.env.LOADED_KEY).toBeUndefined()
    fs.unlinkSync(filePath)
  })

  it('loads multiple env files in order', () => {
    const file1 = writeEnvFile('LOADED_KEY=from_file1\n')
    const file2 = writeEnvFile('COMMENT_KEY=from_file2\n')
    ConfigModule.load({ envFilePath: [file1, file2] })
    expect(process.env.LOADED_KEY).toBe('from_file1')
    expect(process.env.COMMENT_KEY).toBe('from_file2')
    fs.unlinkSync(file1)
    fs.unlinkSync(file2)
  })
})

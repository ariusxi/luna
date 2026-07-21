import 'reflect-metadata'
import { ConfigService } from '../src/config.service'

describe('ConfigService', () => {
  let service: ConfigService

  beforeEach(() => {
    service = new ConfigService()
  })

  afterEach(() => {
    delete process.env.TEST_KEY
    delete process.env.TEST_NUMBER
  })

  it('returns a string value from process.env', () => {
    process.env.TEST_KEY = 'hello'
    expect(service.get('TEST_KEY')).toBe('hello')
  })

  it('returns undefined for a missing key with no default', () => {
    expect(service.get('MISSING_KEY')).toBeUndefined()
  })

  it('returns the default value when the key is missing', () => {
    expect(service.get('MISSING_KEY', 'fallback')).toBe('fallback')
  })

  it('returns the env value over the default when the key exists', () => {
    process.env.TEST_KEY = 'real'
    expect(service.get('TEST_KEY', 'fallback')).toBe('real')
  })

  it('casts numeric env values via generic type', () => {
    process.env.TEST_NUMBER = '3000'
    const port = service.get<number>('TEST_NUMBER', 0)
    expect(port).toBe('3000')
  })
})

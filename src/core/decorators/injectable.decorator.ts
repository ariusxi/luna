import { InjectableProperties, ProviderScope } from '../types'

export function Injectable(properties?: InjectableProperties): ClassDecorator {
  return (target) => {
    const scope = properties?.scope ?? ProviderScope.Singleton

    Reflect.defineMetadata('luna:injectable', true, target)
    Reflect.defineMetadata('luna:scope', scope, target)
  }
}
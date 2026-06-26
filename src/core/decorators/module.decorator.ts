import { ModuleProperties } from '../types'
import { ModuleManager } from '../managers'

export function Module(properties: ModuleProperties): ClassDecorator {
  return (target) => {
    ModuleManager.register(target, properties)
  }
}
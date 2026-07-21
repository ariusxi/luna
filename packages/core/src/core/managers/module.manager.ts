import { ModuleProperties } from '../types'

export interface IModuleRegistry {
  register(moduleClass: Function, options: ModuleProperties): void
  get(moduleClass: Function): ModuleProperties | undefined
  has(moduleClass: Function): boolean
  getAll(): Map<Function, ModuleProperties>
}

class ModuleManagerImpl implements IModuleRegistry {
  private readonly modules = new Map<Function, ModuleProperties>()

  register(moduleClass: Function, options: ModuleProperties): void {
    this.modules.set(moduleClass, options)
  }

  get(moduleClass: Function): ModuleProperties | undefined {
    return this.modules.get(moduleClass)
  }

  has(moduleClass: Function): boolean {
    return this.modules.has(moduleClass)
  }

  getAll(): Map<Function, ModuleProperties> {
    return this.modules
  }
}

export const ModuleManager = new ModuleManagerImpl()

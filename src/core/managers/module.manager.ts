import { ModuleProperties } from "../types";

export class ModuleManager {
  private static modules = new Map<Function, ModuleProperties>()

  public static register(moduleClass: Function, options: ModuleProperties): void {
    this.modules.set(moduleClass, options)
  }

  public static get(moduleClass: Function): ModuleProperties | void {
    return this.modules.get(moduleClass)
  }

  public static has(moduleClass: Function): boolean {
    return this.modules.has(moduleClass)
  } 

  public static getAll(): Map<Function, ModuleProperties> {
    return this.modules
  }

}
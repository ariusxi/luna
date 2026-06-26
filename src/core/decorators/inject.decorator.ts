import { Token } from '../types'

export function Inject(token: Token): ParameterDecorator {
  return (target, _, parameterIndex: number) => {
    const tokens = Reflect.getMetadata('luna:inject', target) ?? []
    
    tokens[parameterIndex] = token

    Reflect.defineMetadata('luna:inject', tokens, target)
  } 
}
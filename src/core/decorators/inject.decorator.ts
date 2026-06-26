import { Token } from '../types'

/**
 * Injects a provider by token into a constructor parameter.
 *
 * Use `@Inject` when the dependency token is a string or symbol — cases where
 * TypeScript cannot infer the type automatically (e.g. `ValueProvider`, `FactoryProvider`).
 *
 * @param token - The token used when the provider was registered (`provide` field).
 *
 * @example
 * @Injectable()
 * export class UserController {
 *   constructor(
 *     private readonly userService: UserService,          // resolved automatically
 *     @Inject('API_KEY') private readonly apiKey: string, // resolved by token
 *   ) {}
 * }
 */
export function Inject(token: Token): ParameterDecorator {
  return (target, _, parameterIndex: number) => {
    const tokens = Reflect.getMetadata('luna:inject', target) ?? []

    tokens[parameterIndex] = token

    Reflect.defineMetadata('luna:inject', tokens, target)
  }
}

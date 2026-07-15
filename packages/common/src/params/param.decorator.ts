import { LunaMessage } from '../types/message.interface'

export const PARAM_METADATA = 'luna:params'

/** The source from which a parameter value is extracted. */
export type ParamType = 'body' | 'query' | 'param' | 'headers' | 'message'

/** Describes a single decorated parameter on a handler method. */
export interface ParamMetadata {
  /** Zero-based index of the parameter in the method signature. */
  index: number
  /** Where to extract the value from. */
  type: ParamType
  /** Optional key to pick from the source (e.g. `'id'` for `@Param('id')`). */
  key?: string
}

function createParamDecorator(type: ParamType, key?: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey === undefined) return
    const existing: ParamMetadata[] =
      Reflect.getMetadata(PARAM_METADATA, target, propertyKey) ?? []
    existing.push({ index: parameterIndex, type, key })
    Reflect.defineMetadata(PARAM_METADATA, existing, target, propertyKey)
  }
}

/**
 * Extracts the full request payload (`message.payload`) or a specific key.
 *
 * @param key - Optional property to pick from `message.payload`.
 *
 * @example
 * create(@Body() dto: CreateUserDto) { ... }
 * create(@Body('name') name: string) { ... }
 */
export const Body = (key?: string): ParameterDecorator => createParamDecorator('body', key)

/**
 * Extracts a value from `message.metadata.query`.
 *
 * @param key - Optional query string key to pick.
 *
 * @example
 * findAll(@Query() query: Record<string, string>) { ... }
 * findAll(@Query('page') page: string) { ... }
 */
export const Query = (key?: string): ParameterDecorator => createParamDecorator('query', key)

/**
 * Extracts a value from `message.metadata.params` (URL path parameters).
 *
 * @param key - Optional param key to pick (e.g. `'id'`).
 *
 * @example
 * findOne(@Param('id') id: string) { ... }
 */
export const Param = (key?: string): ParameterDecorator => createParamDecorator('param', key)

/**
 * Extracts a value from `message.metadata.headers`.
 *
 * @param key - Optional header name to pick (e.g. `'authorization'`).
 *
 * @example
 * create(@Headers('authorization') token: string) { ... }
 */
export const Headers = (key?: string): ParameterDecorator => createParamDecorator('headers', key)

/**
 * Injects the full `LunaMessage` into the parameter.
 *
 * Use this when you need access to the entire message, bypassing extraction.
 *
 * @example
 * handle(@Message() message: LunaMessage) { ... }
 */
export const Message = (): ParameterDecorator => createParamDecorator('message')

/**
 * Builds the argument list for a handler method call based on stored param
 * metadata. Falls back to passing the full `LunaMessage` as the first argument
 * when no param decorators are present.
 */
export function resolveParams(
  message: LunaMessage,
  paramsMeta: ParamMetadata[],
): unknown[] {
  if (paramsMeta.length === 0) return [message]

  const args: unknown[] = []

  for (const { index, type, key } of paramsMeta) {
    let value: unknown

    switch (type) {
      case 'body':
        value = key
          ? (message.payload as Record<string, unknown>)[key]
          : message.payload
        break
      case 'query':
        value = key
          ? (message.metadata.query as Record<string, unknown>)?.[key]
          : message.metadata.query
        break
      case 'param':
        value = key
          ? (message.metadata.params as Record<string, unknown>)?.[key]
          : message.metadata.params
        break
      case 'headers':
        value = key
          ? (message.metadata.headers as Record<string, unknown>)?.[key]
          : message.metadata.headers
        break
      case 'message':
        value = message
        break
    }

    args[index] = value
  }

  return args
}

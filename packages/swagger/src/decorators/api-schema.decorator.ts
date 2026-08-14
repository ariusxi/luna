import { type ApiSchemaOptions, SWAGGER_SCHEMA } from '../swagger.metadata'

/**
 * Marks a DTO class as a reusable OpenAPI schema. The schema name defaults to
 * the class name and is referenced from `@ApiResponse({ schema })` and request
 * bodies.
 *
 * @example
 * @ApiSchema()
 * class UserDto {
 *   @ApiProperty({ type: 'string' })
 *   name!: string
 * }
 */
export const ApiSchema = (options: ApiSchemaOptions = {}): ClassDecorator => {
  return (target) => {
    const name = options.name ?? (target as unknown as { name: string }).name
    Reflect.defineMetadata(SWAGGER_SCHEMA, { name, description: options.description }, target)
  }
}

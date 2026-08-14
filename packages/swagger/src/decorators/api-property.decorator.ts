import { type ApiPropertyOptions, SWAGGER_PROPERTIES } from '../swagger.metadata'

/**
 * Documents one field of a DTO decorated with `@ApiSchema`. Metadata is stored
 * on the constructor so `buildOpenApiDocument` can assemble the schema.
 *
 * @example
 * @ApiSchema()
 * class UserDto {
 *   @ApiProperty({ type: 'string', description: 'Display name' })
 *   name!: string
 * }
 */
export const ApiProperty = (options: ApiPropertyOptions = {}): PropertyDecorator => {
  return (target, propertyKey) => {
    const constructor = target.constructor
    const existing = (Reflect.getMetadata(SWAGGER_PROPERTIES, constructor) as Record<string, ApiPropertyOptions>) ?? {}
    Reflect.defineMetadata(SWAGGER_PROPERTIES, { ...existing, [propertyKey.toString()]: options }, constructor)
  }
}

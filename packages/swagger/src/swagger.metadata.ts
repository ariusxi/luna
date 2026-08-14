/** Reflect metadata keys used by the Swagger decorators. */
export const SWAGGER_OPERATION = 'luna:swagger:operation'
export const SWAGGER_RESPONSES = 'luna:swagger:responses'
export const SWAGGER_QUERIES = 'luna:swagger:queries'
export const SWAGGER_SCHEMA = 'luna:swagger:schema'
export const SWAGGER_PROPERTIES = 'luna:swagger:properties'

export type ApiScalarType = 'string' | 'number' | 'integer' | 'boolean'
export type ApiPropertyType = ApiScalarType | 'array' | 'object'

/** Options for `@ApiOperation`. */
export interface ApiOperationOptions {
  summary?: string
  description?: string
  tags?: string[]
  isAuthenticated?: boolean
}

/** Options for `@ApiResponse` (one per status code). */
export interface ApiResponseOptions {
  status: number
  description?: string
  /** Name of a schema registered with `@ApiSchema` to reference in the body. */
  schema?: string
}

/** Options for `@ApiQuery` (one per query parameter). */
export interface ApiQueryOptions {
  name: string
  description?: string
  required?: boolean
  type?: ApiScalarType
}

/** Options for `@ApiSchema` (marks a DTO class as a reusable schema). */
export interface ApiSchemaOptions {
  name?: string
  description?: string
}

/** Options for `@ApiProperty` (one per DTO field). */
export interface ApiPropertyOptions {
  type?: ApiPropertyType
  description?: string
  required?: boolean
  example?: unknown
  enum?: Array<string | number>
  format?: string
  items?: { type?: ApiScalarType; $ref?: string }
}

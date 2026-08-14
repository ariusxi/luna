import { CONTROLLER_METADATA, ON_METADATA, type OnMetadata } from '@lunafw/common'

import {
  type ApiOperationOptions,
  type ApiPropertyOptions,
  type ApiQueryOptions,
  type ApiResponseOptions,
  SWAGGER_OPERATION,
  SWAGGER_PROPERTIES,
  SWAGGER_QUERIES,
  SWAGGER_RESPONSES,
  SWAGGER_SCHEMA,
} from '../swagger.metadata'

/* eslint-disable @typescript-eslint/no-explicit-any */
type ClassLike = { name: string; prototype: any }

export interface OpenApiInfo {
  title: string
  version: string
  description?: string
}

export interface OpenApiTag {
  name: string
  description?: string
}

export interface BuildOpenApiDocumentOptions {
  info: OpenApiInfo
  tags?: OpenApiTag[]
  /** Controller classes to document (their `@On` handlers become paths). */
  controllers: ClassLike[]
  /** DTO classes decorated with `@ApiSchema` to expose under components.schemas. */
  schemas?: ClassLike[]
}

export interface OpenApiDocument {
  openapi: '3.0.0'
  info: OpenApiInfo
  tags: OpenApiTag[]
  paths: Record<string, Record<string, unknown>>
  components: {
    schemas: Record<string, unknown>
    securitySchemes?: Record<string, unknown>
  }
}

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head'])

const BEARER_SCHEME = {
  bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
}

function normalizePath(prefix: string, path: string): string {
  const combined = `${prefix ?? ''}${path ?? ''}`.replace(/\/{2,}/g, '/')
  const withLeadingSlash = combined.startsWith('/') ? combined : `/${combined}`
  const trimmed = withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/$/, '') : withLeadingSlash
  return trimmed.replace(/:([a-zA-Z0-9_]+)/g, '{$1}')
}

function extractPathParameters(path: string): Array<Record<string, unknown>> {
  const matches = [...path.matchAll(/\{([a-zA-Z0-9_]+)\}/g)]
  return matches.map((match) => ({
    name: match[1],
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }))
}

function toQueryParameters(queries: ApiQueryOptions[]): Array<Record<string, unknown>> {
  return queries.map((query) => ({
    name: query.name,
    in: 'query',
    required: query.required ?? false,
    description: query.description,
    schema: { type: query.type ?? 'string' },
  }))
}

function toPropertySchema(options: ApiPropertyOptions): Record<string, unknown> {
  if (options.items) {
    return { type: 'array', description: options.description, items: options.items }
  }
  return {
    type: options.type ?? 'string',
    description: options.description,
    format: options.format,
    enum: options.enum,
    example: options.example,
  }
}

function toResponses(responses: ApiResponseOptions[]): Record<string, unknown> {
  if (responses.length === 0) {
    return { 200: { description: 'Successful response' } }
  }
  return responses.reduce((accumulator, response) => ({
    ...accumulator,
    [response.status]: {
      description: response.description ?? '',
      content: response.schema
        ? { 'application/json': { schema: { $ref: `#/components/schemas/${response.schema}` } } }
        : undefined,
    },
  }), {})
}

function buildSchemas(schemas: ClassLike[]): Record<string, unknown> {
  return schemas.reduce((accumulator, schema) => {
    const definition = Reflect.getMetadata(SWAGGER_SCHEMA, schema) as { name: string; description?: string } | undefined
    if (!definition) return accumulator

    const properties = (Reflect.getMetadata(SWAGGER_PROPERTIES, schema) as Record<string, ApiPropertyOptions>) ?? {}
    const propertyNames = Object.keys(properties)
    const required = propertyNames.filter((name) => properties[name].required)

    return {
      ...accumulator,
      [definition.name]: {
        type: 'object',
        description: definition.description,
        properties: propertyNames.reduce((shape, name) => ({
          ...shape,
          [name]: toPropertySchema(properties[name]),
        }), {}),
        required: required.length > 0 ? required : undefined,
      },
    }
  }, {})
}

function collectHandlerNames(controller: ClassLike): string[] {
  return Object.getOwnPropertyNames(controller.prototype).filter((name) => {
    if (name === 'constructor') return false
    return Reflect.hasMetadata(ON_METADATA, controller.prototype, name)
  })
}

/**
 * Assembles an OpenAPI 3.0 document from Luna controllers and DTO schemas by
 * reading the `@Controller`/`@On` route metadata together with the `@Api*`
 * documentation metadata. Pure and framework-agnostic: it neither reads the
 * network nor serves anything.
 */
export function buildOpenApiDocument(options: BuildOpenApiDocumentOptions): OpenApiDocument {
  const paths: Record<string, Record<string, unknown>> = {}
  let requiresBearer = false

  for (const controller of options.controllers) {
    const prefix = (Reflect.getMetadata(CONTROLLER_METADATA, controller) as string) ?? ''

    for (const handlerName of collectHandlerNames(controller)) {
      const route = Reflect.getMetadata(ON_METADATA, controller.prototype, handlerName) as OnMetadata
      const method = route.event.toLowerCase()
      if (!HTTP_METHODS.has(method)) continue

      const fullPath = normalizePath(prefix, route.path)
      const operation = (Reflect.getMetadata(SWAGGER_OPERATION, controller.prototype, handlerName) as ApiOperationOptions) ?? {}
      const responses = (Reflect.getMetadata(SWAGGER_RESPONSES, controller.prototype, handlerName) as ApiResponseOptions[]) ?? []
      const queries = (Reflect.getMetadata(SWAGGER_QUERIES, controller.prototype, handlerName) as ApiQueryOptions[]) ?? []

      if (operation.isAuthenticated) requiresBearer = true

      const parameters = [...extractPathParameters(fullPath), ...toQueryParameters(queries)]

      paths[fullPath] = {
        ...paths[fullPath],
        [method]: {
          summary: operation.summary,
          description: operation.description,
          tags: operation.tags,
          security: operation.isAuthenticated ? [{ bearerAuth: [] }] : undefined,
          parameters: parameters.length > 0 ? parameters : undefined,
          responses: toResponses(responses),
        },
      }
    }
  }

  return {
    openapi: '3.0.0',
    info: options.info,
    tags: options.tags ?? [],
    paths,
    components: {
      schemas: buildSchemas(options.schemas ?? []),
      securitySchemes: requiresBearer ? BEARER_SCHEME : undefined,
    },
  }
}

import 'reflect-metadata'

import { Controller, On } from '@lunafw/common'

import { ApiBody, ApiOperation, ApiProperty, ApiQuery, ApiResponse, ApiSchema } from '../src/decorators'
import { buildOpenApiDocument } from '../src/document/build-open-api-document'

@ApiSchema()
class UserDto {
  @ApiProperty({ type: 'string', required: true })
  name!: string

  @ApiProperty({ type: 'integer' })
  age?: number
}

@Controller('users')
class UsersController {
  @ApiOperation({ summary: 'List users', tags: ['users'], isAuthenticated: true })
  @ApiQuery({ name: 'page', type: 'integer' })
  @ApiResponse({ status: 200, description: 'The users', schema: 'UserDto' })
  @On('get', '/')
  findAll(): void {}

  @ApiOperation({ summary: 'Create user', tags: ['users'] })
  @ApiBody({ schema: 'UserDto' })
  @ApiResponse({ status: 201, description: 'Created', schema: 'UserDto' })
  @On('post', '/')
  create(): void {}

  @ApiOperation({ summary: 'Get user' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @On('get', '/:id')
  findOne(): void {}

  @On('message', '/ignored')
  nonHttpHandler(): void {}
}

const document = buildOpenApiDocument({
  info: { title: 'Test API', version: '1.0.0' },
  controllers: [UsersController],
  schemas: [UserDto],
})

describe('buildOpenApiDocument', () => {
  it('builds paths from @Controller prefix + @On route, converting :params', () => {
    expect(Object.keys(document.paths).sort()).toEqual(['/users', '/users/{id}'])
    expect((document.paths['/users'] as Record<string, unknown>).get).toBeDefined()
  })

  it('skips non-HTTP @On events', () => {
    const values = Object.values(document.paths).flatMap((item) => Object.keys(item))
    expect(values).not.toContain('message')
  })

  it('maps operation, query, path params and responses', () => {
    const list = (document.paths['/users'] as any).get
    expect(list.summary).toBe('List users')
    expect(list.tags).toEqual(['users'])
    expect(list.security).toEqual([{ bearerAuth: [] }])
    expect(list.parameters).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'page', in: 'query' }),
    ]))
    expect(list.responses['200'].content['application/json'].schema.$ref).toBe('#/components/schemas/UserDto')

    const one = (document.paths['/users/{id}'] as any).get
    expect(one.parameters).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'id', in: 'path', required: true }),
    ]))
    expect(one.responses['404']).toBeDefined()
  })

  it('documents the request body from @ApiBody as a schema $ref', () => {
    const create = (document.paths['/users'] as any).post
    expect(create.requestBody.required).toBe(true)
    expect(create.requestBody.content['application/json'].schema.$ref).toBe('#/components/schemas/UserDto')
  })

  it('adds the bearer security scheme when any operation is authenticated', () => {
    expect(document.components.securitySchemes).toEqual({
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    })
  })

  it('builds component schemas from @ApiSchema + @ApiProperty', () => {
    const schema = document.components.schemas.UserDto as any
    expect(schema.type).toBe('object')
    expect(schema.properties.name.type).toBe('string')
    expect(schema.required).toContain('name')
    expect(schema.required ?? []).not.toContain('age')
  })
})

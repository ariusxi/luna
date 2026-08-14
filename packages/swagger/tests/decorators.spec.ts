import 'reflect-metadata'

import { ApiProperty, ApiResponse, ApiSchema } from '../src/decorators'
import { SWAGGER_PROPERTIES, SWAGGER_RESPONSES, SWAGGER_SCHEMA } from '../src/swagger.metadata'

describe('swagger decorators store metadata', () => {
  it('@ApiResponse accumulates one entry per call', () => {
    class Controller {
      @ApiResponse({ status: 200, description: 'ok' })
      @ApiResponse({ status: 404, description: 'missing' })
      handler(): void {}
    }

    const responses = Reflect.getMetadata(SWAGGER_RESPONSES, Controller.prototype, 'handler')
    expect(responses).toHaveLength(2)
    expect(responses.map((response: { status: number }) => response.status).sort()).toEqual([200, 404])
  })

  it('@ApiSchema records the schema name (defaulting to the class name)', () => {
    @ApiSchema()
    class UserDto {}
    @ApiSchema({ name: 'Custom' })
    class Other {}

    expect(Reflect.getMetadata(SWAGGER_SCHEMA, UserDto)).toEqual({ name: 'UserDto', description: undefined })
    expect(Reflect.getMetadata(SWAGGER_SCHEMA, Other).name).toBe('Custom')
  })

  it('@ApiProperty accumulates fields on the constructor', () => {
    class UserDto {
      @ApiProperty({ type: 'string', required: true })
      name!: string

      @ApiProperty({ type: 'integer' })
      age?: number
    }

    const properties = Reflect.getMetadata(SWAGGER_PROPERTIES, UserDto)
    expect(Object.keys(properties).sort()).toEqual(['age', 'name'])
    expect(properties.name.required).toBe(true)
  })
})

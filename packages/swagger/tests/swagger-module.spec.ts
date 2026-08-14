import 'reflect-metadata'

import express from 'express'
import request from 'supertest'
import { Controller, On } from '@lunafw/common'

import { ApiOperation, ApiResponse } from '../src/decorators'
import { SwaggerModule } from '../src/module/swagger.module'

@Controller('health')
class HealthController {
  @ApiOperation({ summary: 'Health check', tags: ['health'] })
  @ApiResponse({ status: 200, description: 'Service is up' })
  @On('get', '/')
  check(): void {}
}

describe('SwaggerModule.forRoot', () => {
  const app = express()
  const document = SwaggerModule.forRoot({
    app,
    info: { title: 'Mokafi API', version: '1.0.0' },
    controllers: [HealthController],
    route: '/docs',
  })

  it('serves the OpenAPI document as JSON at <route>-json', async () => {
    const response = await request(app).get('/docs-json')
    expect(response.status).toBe(200)
    expect(response.body.openapi).toBe('3.0.0')
    expect(response.body.info.title).toBe('Mokafi API')
    expect(response.body.paths['/health']).toBeDefined()
  })

  it('serves the interactive Swagger UI at the route', async () => {
    const response = await request(app).get('/docs/')
    expect(response.status).toBe(200)
    expect(response.text.toLowerCase()).toContain('swagger-ui')
  })

  it('returns the built document', () => {
    expect(document.info.title).toBe('Mokafi API')
    expect(document.paths['/health']).toBeDefined()
  })
})

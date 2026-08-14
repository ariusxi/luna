import 'reflect-metadata'

import express, { type Express } from 'express'
import request from 'supertest'
import type { AbstractAdapter } from '@lunafw/common'
import { Controller, On } from '@lunafw/common'

import { ApiOperation, ApiResponse } from '../src/decorators'
import { SwaggerBootstrap, SwaggerModule } from '../src/module/swagger.module'

@Controller('health')
class HealthController {
  @ApiOperation({ summary: 'Health check', tags: ['health'] })
  @ApiResponse({ status: 200, description: 'Service is up' })
  @On('get', '/')
  check(): void {}
}

/** Minimal fake HTTP adapter exposing a real Express app via getApp(). */
function fakeHttpAdapter(app: Express): AbstractAdapter {
  return { getApp: () => app } as unknown as AbstractAdapter
}

describe('SwaggerModule.forRoot + SwaggerBootstrap', () => {
  const app = express()

  beforeAll(() => {
    SwaggerModule.forRoot({
      info: { title: 'Mokafi API', version: '1.0.0' },
      controllers: [HealthController],
      route: '/docs',
    })
    new SwaggerBootstrap().onAdapterInit([fakeHttpAdapter(app)])
  })

  it('forRoot returns the module class so it can go in imports', () => {
    const returned = SwaggerModule.forRoot({ info: { title: 'X', version: '1' }, controllers: [] })
    expect(returned).toBe(SwaggerModule)
    // restore the documented config for the remaining assertions
    SwaggerModule.forRoot({ info: { title: 'Mokafi API', version: '1.0.0' }, controllers: [HealthController], route: '/docs' })
    new SwaggerBootstrap().onAdapterInit([fakeHttpAdapter(app)])
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

  it('is a no-op when no HTTP adapter exposes getApp()', () => {
    const wsOnly = { listen: async () => {} } as unknown as AbstractAdapter
    expect(() => new SwaggerBootstrap().onAdapterInit([wsOnly])).not.toThrow()
  })
})

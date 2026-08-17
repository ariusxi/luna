import 'reflect-metadata'
import { Module, Injectable } from '@lunafw/core'
import { Body, Controller, LunaFactory, On, UploadedFile, type UploadedFileData } from '@lunafw/common'

import { ExpressAdapter } from '../../src'

@Injectable()
@Controller('uploads')
class UploadController {
  @On('post', '/')
  create(
    @UploadedFile('image') image: UploadedFileData | undefined,
    @Body('label') label: string,
  ): { received: boolean; label: string; size: number; mimetype: string; text: string } {
    return {
      received: Boolean(image),
      label,
      size: image?.size ?? 0,
      mimetype: image?.mimetype ?? '',
      text: image ? image.buffer.toString('utf8') : '',
    }
  }
}

@Module({ providers: [UploadController] })
class AppModule {}

describe('@UploadedFile integration', () => {
  let adapter: ExpressAdapter
  let baseUrl: string

  beforeAll(async () => {
    adapter = new ExpressAdapter({ port: 0 })
    const app = await LunaFactory.createApplication(AppModule, adapter)
    await app.start()
    baseUrl = `http://localhost:${adapter.getPort()}`
  })

  afterAll(async () => {
    await adapter.close()
  })

  it('parses a multipart upload into @UploadedFile and text fields into @Body', async () => {
    const form = new FormData()
    form.set('label', 'avatar')
    form.set('image', new Blob(['hello-bytes'], { type: 'image/png' }), 'pic.png')

    const res = await fetch(`${baseUrl}/uploads/`, { method: 'POST', body: form })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ received: true, label: 'avatar', size: 11, mimetype: 'image/png', text: 'hello-bytes' })
  })

  it('leaves @UploadedFile undefined when no file is sent', async () => {
    const form = new FormData()
    form.set('label', 'none')

    const res = await fetch(`${baseUrl}/uploads/`, { method: 'POST', body: form })
    const body = await res.json()

    expect(body.received).toBe(false)
    expect(body.label).toBe('none')
  })
})

import 'reflect-metadata'
import { Injectable, Module } from '@lunafw/core'
import {
  Controller,
  LunaFactory,
  LunaMessage,
  LunaPipe,
  On,
  UsePipes,
} from '@lunafw/common'
import { z, ZodSchema } from 'zod'
import { plainToInstance } from 'class-transformer'
import { IsString, MinLength, validateOrReject } from 'class-validator'
import { ExpressAdapter } from '../../src'
import { BadRequestException } from '@lunafw/common'

// ── Zod pipe ─────────────────────────────────────────────────────────────────

class ZodPipe<T> implements LunaPipe {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(message: LunaMessage): LunaMessage {
    const result = this.schema.safeParse(message.payload)
    if (!result.success) {
      throw new BadRequestException(result.error.issues[0]?.message ?? 'Validation failed')
    }
    return { ...message, payload: result.data }
  }
}

// ── class-validator pipe ──────────────────────────────────────────────────────

class ClassValidatorPipe<T extends object> implements LunaPipe {
  constructor(private readonly cls: new () => T) {}

  async transform(message: LunaMessage): Promise<LunaMessage> {
    const instance = plainToInstance(this.cls, message.payload)
    try {
      await validateOrReject(instance)
    } catch (errors) {
      const first = (errors as { constraints?: Record<string, string> }[])[0]
      const message_ = Object.values(first?.constraints ?? {})[0] ?? 'Validation failed'
      throw new BadRequestException(message_)
    }
    return { ...message, payload: instance }
  }
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const CreatePostSchema = z.object({
  title: z.string().min(3, 'title must be at least 3 characters'),
  body: z.string().min(1, 'body is required'),
})

// ── class-validator DTOs ──────────────────────────────────────────────────────

class CreateCommentDto {
  @IsString()
  @MinLength(5, { message: 'content must be at least 5 characters' })
  content!: string
}

// ── controllers ───────────────────────────────────────────────────────────────

@Injectable()
@Controller('posts')
class PostController {
  @UsePipes(new ZodPipe(CreatePostSchema))
  @On('post', '/')
  create(message: LunaMessage) {
    return message.payload
  }
}

@Injectable()
@Controller('comments')
class CommentController {
  @UsePipes(new ClassValidatorPipe(CreateCommentDto))
  @On('post', '/')
  create(message: LunaMessage) {
    return message.payload
  }
}

@Module({ providers: [PostController, CommentController] })
class AppModule {}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Validation integration', () => {
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

  // ── Zod ────────────────────────────────────────────────────────────────────

  describe('ZodPipe', () => {
    const post = (body: object) =>
      fetch(`${baseUrl}/posts/`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

    it('passes valid payload through and returns it', async () => {
      const res = await post({ title: 'Hello Luna', body: 'Great framework' })
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json).toEqual({ title: 'Hello Luna', body: 'Great framework' })
    })

    it('rejects when title is too short', async () => {
      const res = await post({ title: 'Hi', body: 'ok' })
      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.message).toBe('title must be at least 3 characters')
    })

    it('rejects when a required field is missing', async () => {
      const res = await post({ title: 'Hello' })
      const json = await res.json()
      expect(res.status).toBe(400)
      expect(typeof json.message).toBe('string')
    })

    it('strips extra fields not in the schema', async () => {
      const res = await post({ title: 'Clean', body: 'payload', extra: 'ignored' })
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json).not.toHaveProperty('extra')
    })
  })

  // ── class-validator ────────────────────────────────────────────────────────

  describe('ClassValidatorPipe', () => {
    const post = (body: object) =>
      fetch(`${baseUrl}/comments/`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

    it('passes valid payload through and returns it', async () => {
      const res = await post({ content: 'Great post!' })
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.content).toBe('Great post!')
    })

    it('rejects when content is too short', async () => {
      const res = await post({ content: 'Hi' })
      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.message).toBe('content must be at least 5 characters')
    })

    it('rejects when content is missing', async () => {
      const res = await post({})
      const json = await res.json()
      expect(res.status).toBe(400)
    })
  })
})

import { Inject, Injectable } from '@lunafw/core'
import { PrismaClient, Post } from '@prisma/client'
import { NotFoundException } from '@lunafw/common'
import { PRISMA } from '../database/database.module'
import { CreatePostDto } from './dto/create-post.dto'

@Injectable()
export class PostsService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  findAll(): Promise<Post[]> {
    return this.prisma.post.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({ where: { id } })
    if (!post) throw new NotFoundException(`Post ${id} not found`)
    return post
  }

  create(dto: CreatePostDto): Promise<Post> {
    return this.prisma.post.create({ data: dto })
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.prisma.post.delete({ where: { id } })
  }
}

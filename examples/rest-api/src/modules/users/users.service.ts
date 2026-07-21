import { Inject, Injectable } from '@lunafw/core'
import { PrismaClient, User } from '@prisma/client'
import { NotFoundException } from '@lunafw/common'
import { PRISMA } from '../database/database.module'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  findAll(): Promise<User[]> {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundException(`User ${id} not found`)
    return user
  }

  create(dto: CreateUserDto): Promise<User> {
    return this.prisma.user.create({ data: dto })
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findOne(id)
    return this.prisma.user.update({ where: { id }, data: dto })
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.prisma.user.delete({ where: { id } })
  }
}

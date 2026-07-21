import { Injectable } from '@lunafw/core'
import { Body, Controller, On, Param, Query, UseFilters, UseGuards, UsePipes } from '@lunafw/common'
import { z } from 'zod'
import { DomainExceptionFilter } from '../../common/filters/domain-exception.filter'
import { AuthGuard } from '../../common/guards/auth.guard'
import { ZodPipe } from '../../common/pipes/zod.pipe'
import { UsersService } from './users.service'

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

@UseFilters(DomainExceptionFilter)
@Injectable()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @On('get', '/')
  findAll(@Query('limit') limit?: string) {
    const all = this.usersService.findAll()
    return limit ? all.slice(0, Number(limit)) : all
  }

  @On('get', '/:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id)
  }

  @UseGuards(AuthGuard)
  @UsePipes(new ZodPipe(CreateUserSchema))
  @On('post', '/')
  create(@Body() dto: { name: string; email: string }) {
    return this.usersService.create(dto)
  }

  @UseGuards(AuthGuard)
  @On('delete', '/:id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id)
  }
}

import { Injectable } from '@lunafw/core'
import { Body, Controller, On, Param, UsePipes, ValidationPipe } from '@lunafw/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @On('get', '/')
  findAll() {
    return this.usersService.findAll()
  }

  @On('get', '/:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id)
  }

  @On('post', '/')
  @UsePipes(new ValidationPipe(CreateUserDto))
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto)
  }

  @On('patch', '/:id')
  @UsePipes(new ValidationPipe(UpdateUserDto))
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto)
  }

  @On('delete', '/:id')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id)
    return { deleted: true }
  }
}

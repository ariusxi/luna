import { Injectable } from '@lunafw/core'
import { Body, Controller, On } from '@lunafw/common'
import { UsersService } from './users.service'
import { User } from './user.model'

@Injectable()
@Controller('UserService')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @On('GetUser')
  getUser(@Body('id') id: string) {
    const user = this.usersService.findOne(id)
    if (!user) return { id: '', name: '', email: '' }
    return user
  }

  @On('ListUsers')
  listUsers() {
    const users = this.usersService.findAll()
    return { users }
  }

  @On('CreateUser')
  createUser(@Body() req: Omit<User, 'id'>) {
    return this.usersService.create(req)
  }

  @On('DeleteUser')
  deleteUser(@Body('id') id: string) {
    const deleted = this.usersService.remove(id)
    return { deleted }
  }
}

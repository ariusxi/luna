import { Module } from '@lunafw/core'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  providers: [UsersService, UsersController],
  exports: [UsersService, UsersController],
})
export class UsersModule {}

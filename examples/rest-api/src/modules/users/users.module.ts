import { Module } from '@lunafw/core'
import { DatabaseModule } from '../database/database.module'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [DatabaseModule],
  providers: [UsersService, UsersController],
  exports: [UsersService],
})
export class UsersModule {}

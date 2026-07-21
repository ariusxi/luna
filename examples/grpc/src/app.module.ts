import { Module } from '@lunafw/core'
import { UsersModule } from './modules/users/users.module'

@Module({
  imports: [UsersModule],
})
export class AppModule {}

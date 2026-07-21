import { Module } from '@lunafw/core'
import { ChatModule } from './modules/chat/chat.module'
import { UsersModule } from './modules/users/users.module'

@Module({
  imports: [UsersModule, ChatModule],
})
export class AppModule {}

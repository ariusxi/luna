import { Module } from '@lunafw/core'
import { ChatController } from './chat.controller'

@Module({
  providers: [ChatController],
  exports: [ChatController],
})
export class ChatModule {}

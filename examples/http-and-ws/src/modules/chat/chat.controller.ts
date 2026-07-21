import { Injectable } from '@lunafw/core'
import { Body, Controller, Message, LunaMessage, On } from '@lunafw/common'

interface ChatMessage {
  user: string
  text: string
}

const history: ChatMessage[] = []

@Injectable()
@Controller('chat')
export class ChatController {
  // listens for WS event "chat.send"
  @On('send', '/')
  handleSend(
    @Body('user') user: string,
    @Body('text') text: string,
    @Message() _message: LunaMessage,
  ) {
    const entry: ChatMessage = { user, text }
    history.push(entry)
    return { ok: true, entry }
  }

  // listens for WS event "chat.history"
  @On('history', '/')
  getHistory() {
    return history
  }
}

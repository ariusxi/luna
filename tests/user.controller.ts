import { Inject, Injectable } from '@lunafw/core'

import { UserService } from './user.service'

@Injectable()
export class UserController {
  constructor(
    @Inject('API_KEY') private readonly apiKey: string,
    @Inject('Config') private readonly config: Function,
    private readonly service: UserService,
  ) {}

  public onModuleInit(): void {
    console.log(this.service.getUsers())
    console.log('To rodando no controller', { api: this.apiKey })
  }
}
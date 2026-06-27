import { Inject, Injectable } from '../packages/core'

import { UserService } from './user.service';

@Injectable()
export class UserController {
  constructor(
    @Inject('API_KEY') private readonly apiKey: string,
    private readonly service: UserService,
  ) {}

  public onModuleInit(): void {
    console.log('To rodando no controller', { api: this.apiKey })
  }
}
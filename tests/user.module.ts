import { Module } from '@lunafw/core'

import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  providers: [
    UserController,
    UserService,
    { provide: 'API_KEY', useValue: 'minha-chave' },
    { provide: 'Config', useFactory: () => ({ port: 3000 }) },
  ],
})
export class UserModule {}
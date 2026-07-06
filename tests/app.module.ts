import { Module } from '@lunafw/core'

import { UserModule } from './user.module'

@Module({
  imports: [UserModule],
})
export class AppModule {}
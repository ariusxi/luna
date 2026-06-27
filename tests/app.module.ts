import { Module } from '../packages/core'

import { UserModule } from './user.module'

@Module({
  imports: [UserModule],
})
export class AppModule {}
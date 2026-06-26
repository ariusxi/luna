import { Module } from '../src'

import { UserModule } from './user.module'

@Module({
  imports: [UserModule],
})
export class AppModule {}
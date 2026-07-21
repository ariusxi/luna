import { Module } from '@lunafw/core'
import { ConfigModule } from '@lunafw/config'
import { DatabaseModule } from './modules/database/database.module'
import { PostsModule } from './modules/posts/posts.module'
import { UsersModule } from './modules/users/users.module'

@Module({
  imports: [ConfigModule, DatabaseModule, UsersModule, PostsModule],
})
export class AppModule {}

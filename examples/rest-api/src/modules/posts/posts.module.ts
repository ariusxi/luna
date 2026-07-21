import { Module } from '@lunafw/core'
import { DatabaseModule } from '../database/database.module'
import { PostsController } from './posts.controller'
import { PostsService } from './posts.service'

@Module({
  imports: [DatabaseModule],
  providers: [PostsService, PostsController],
})
export class PostsModule {}

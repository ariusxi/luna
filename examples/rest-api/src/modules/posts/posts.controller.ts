import { Injectable } from '@lunafw/core'
import { Body, Controller, On, Param, UsePipes, ValidationPipe } from '@lunafw/common'
import { PostsService } from './posts.service'
import { CreatePostDto } from './dto/create-post.dto'

@Injectable()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @On('get', '/')
  findAll() {
    return this.postsService.findAll()
  }

  @On('get', '/:id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id)
  }

  @On('post', '/')
  @UsePipes(new ValidationPipe(CreatePostDto))
  create(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto)
  }

  @On('delete', '/:id')
  async remove(@Param('id') id: string) {
    await this.postsService.remove(id)
    return { deleted: true }
  }
}

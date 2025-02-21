import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ArticleService } from './article.service';
import { GetArticlesDto } from './dto/getArticles.dto';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  async getAllArticles(@Query() query: GetArticlesDto) {
    try {
      return this.articleService.findAll(query);
    } catch (error) {
      throw new BadRequestException('Error occured when getting all articles');
    }
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { GetArticlesDto } from './dto/getArticles.dto';
import { ElasticsearchService } from 'src/elasticsearch/elasticsearch.service';

@Controller('articles')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  @Get()
  async getAllArticles(@Query() query: GetArticlesDto) {
    try {
      return this.articleService.findAll(query);
    } catch (error) {
      Logger.error(error);
      throw new BadRequestException('Error occured when getting all articles');
    }
  }

  @Post('search')
  async searchArticles(@Body('word') word: string) {
    try {
      return this.elasticsearchService.searchArticlesByTitle(word);
    } catch (error) {
      Logger.error(error);
      throw new BadRequestException(
        'Error occured when searching articles by title using elasticsearch',
      );
    }
  }

  @Get('recent')
  async getRecentArticles() {
    return this.articleService.getRecentArticles();
  }
}

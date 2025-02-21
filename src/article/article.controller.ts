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
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('articles')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Récuperer tous les articles avec options ',
    description:
      'Récuperer tous les articles triés par la date de publication, avec options de filtre par source ou recherche par text sur le titre.',
  })
  @ApiResponse({
    status: 200,
    description: 'Articles récuperés avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Erreur survenue lors de la récuperation des articles',
  })
  async getAllArticles(@Query() query: GetArticlesDto) {
    try {
      return await this.articleService.findAll(query);
    } catch (error) {
      Logger.error(error);
      throw new BadRequestException('Error occured when getting all articles');
    }
  }

  @Post('search')
  @ApiOperation({
    summary: 'Recherche par texte sur le titre',
    description: 'Recherche par texte sur le titre avec Elasticsearch.',
  })
  @ApiResponse({
    status: 200,
    description: 'Articles récuperés avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Erreur survenue lors de la recherche des articles par texte.',
  })
  @ApiBody({
    description: 'Recherche par texte',
    schema: {
      type: 'object',
      properties: {
        word: {
          type: 'string',
          example: 'when',
        },
      },
    },
  })
  async searchArticles(@Body('word') word: string) {
    try {
      return await this.elasticsearchService.searchArticlesByTitle(word);
    } catch (error) {
      Logger.error(error);
      throw new BadRequestException(
        'Error occured when searching articles by title using elasticsearch',
      );
    }
  }

  @Get('recent')
  @ApiOperation({
    summary: 'Récuperer les articles les plus récents',
    description: 'Récuperer les articles les plus récents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Articles récuperés avec succès.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Erreur survenue lors de la récuperation des articles les plus récents.',
  })
  async getRecentArticles() {
    try {
      return await this.articleService.getRecentArticles();
    } catch (error) {
      Logger.error(error);
      throw new BadRequestException(
        'Error occured when getting recent articles',
      );
    }
  }
}

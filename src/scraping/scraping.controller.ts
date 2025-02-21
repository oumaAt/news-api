import { BadRequestException, Controller, Get, Logger } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { ArticleService } from 'src/article/article.service';
import { error } from 'console';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('scraping')
export class ScrapingController {
  constructor(
    private readonly scrapingService: ScrapingService,
    private readonly articleService: ArticleService,
  ) {}
  @Get()
  @ApiOperation({
    summary: 'Extraire des articles ',
    description:
      "Extraire des articles à partir d'un site d'actualités et les sauvegarder dans la base de données ",
  })
  @ApiResponse({
    status: 200,
    description: 'Articles extraits et sauvegardés avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Erreur survenue lors de l\'extraction ou la sauvegarde des articles',
  })
  async getAndSaveArticles() {
    try {
      //get articles data
      const articles = await this.scrapingService.extractArticles();
      //save in db
      return await this.articleService.bullkCreateArticlesWithComments(
        articles,
      );
    } catch (error) {
      Logger.error(error);
      throw new BadRequestException(
        'Error occured when scraping articles and trying to save to DB',
      );
    }
  }
}

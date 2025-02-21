import { BadRequestException, Controller, Get, Logger } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { ArticleService } from 'src/article/article.service';
import { error } from 'console';

@Controller('scraping')
export class ScrapingController {
  constructor(
    private readonly scrapingService: ScrapingService,
    private readonly articleService: ArticleService,
  ) {}
  @Get()
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

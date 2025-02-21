import { Module } from '@nestjs/common';
import { ArticleService } from '../article/article.service';
import { CommentService } from '../comment/comment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '../article/article.entity';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { Comment } from '../comment/comment.entity';
import { ScrapingService } from './scraping.service';
import { ScrapingController } from './scraping.controller';
import { ElasticsearchService } from 'src/elasticsearch/elasticsearch.service';

@Module({
  imports: [TypeOrmModule.forFeature([Article, User, Comment])],
  controllers: [ScrapingController],
  providers: [
    ScrapingService,
    ArticleService,
    CommentService,
    UserService,
    ElasticsearchService,
  ],
})
export class ScrapingModule {}

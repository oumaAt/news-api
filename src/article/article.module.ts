import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { User } from '../user/user.entity';
import { Comment } from '../comment/comment.entity';
import { UserService } from '../user/user.service';
import { CommentService } from '../comment/comment.service';
import { ScrapingService } from '../scraping/scraping.service';

@Module({
  imports: [TypeOrmModule.forFeature([Article, User, Comment])],
  providers: [
    ArticleService,
    UserService,
    ScrapingService,
    CommentService,
  ],
  controllers: [],
})
export class ArticleModule {}

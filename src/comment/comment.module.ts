import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from 'src/article/article.entity';
import { User } from 'src/user/user.entity';
import { Comment } from './comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article, User, Comment])],
  providers: [CommentService],
})
export class CommentModule {}

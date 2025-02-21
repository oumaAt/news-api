import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './comment.entity';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { CreateCommentDto } from './dto/createComment.dto';
import { validate } from 'class-validator';

interface CommentData {
  text: string;
  publishedDate: Date | null;
  authorId: number;
  articleId: number;
}

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async createMany(comments: CommentData[]) {
    // Validate input data using DTO
    const validationPromises = comments.map(async (article) => {
      const commentDto = plainToClass(CreateCommentDto, article);
      const errors = await validate(commentDto);
      if (errors.length > 0) {
        throw new ConflictException(`Validation failed for comment`);
      }
    });

    await Promise.all(validationPromises);

    let toCreateComments = [];
    for (const commentData of comments) {
      const existing = await this.commentRepository.findOne({
        where: {
          text: commentData.text,
          author: { id: commentData.authorId },
          article: { id: commentData.articleId },
        },
      });
      if (!existing) {
        toCreateComments.push(commentData);
      }
    }
    console.log({ toCreateComments });
    const commentsToSave = toCreateComments.map((comment) => ({
      ...comment,
      author: { id: comment.authorId },
      article: { id: comment.articleId },
    }));
    // Insérer uniquement les nouveaux commentaires
    return await this.commentRepository.save(commentsToSave);
  }
}

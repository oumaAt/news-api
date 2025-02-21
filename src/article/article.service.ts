import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { Article } from './article.entity';
import { UserService } from 'src/user/user.service';
import { CommentService } from 'src/comment/comment.service';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateArticleDto } from './dto/createArticle.dto';

interface CommentData {
  text: string;
  publishedDate: Date | null;
  author: string;
}
interface ArticleData {
  title: string;
  url: string;
  source: string;
  publishedDate: Date | null;
  author: string;
  comments: CommentData[];
}

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,

    private readonly userService: UserService,
    private readonly commentService: CommentService,
  ) {}

  async createMany(articles: any[]) {
    // Validate input data using DTO
    const validationPromises = articles.map(async (article) => {
      const articleDto = plainToClass(CreateArticleDto, article);
      const errors = await validate(articleDto);
      if (errors.length > 0) {
        console.log(errors);
        throw new ConflictException(
          `Validation failed for article with title: ${article.title}`,
        );
      }
    });

    await Promise.all(validationPromises);

    // Récupérer les URLs déjà existantes en base
    const urls = articles.map((article) => article.url.trim().toLowerCase());
    const existingArticles = await this.articleRepository.find({
      where: { url: In(urls) },
    });

    const existingUrls = new Set(
      existingArticles.map((article) => article.url.trim().toLowerCase()),
    );

    const treatedUrls = new Set();
    const newArticles = articles.filter((article) => {
      const normalizedUrl = article.url.trim().toLowerCase();
      if (existingUrls.has(normalizedUrl) || treatedUrls.has(normalizedUrl)) {
        return false;
      }
      treatedUrls.add(normalizedUrl); // Mark this URL as seen
      return true;
    });

    console.log('newArticles', newArticles.length);

    if (newArticles.length === 0) {
      Logger.warn('All articles already exist');
    }
    // Insérer uniquement les nouveaux articles

    const articlesToSave = newArticles.map((article) => ({
      ...article,
      author: { id: article.authorId },
    }));
    console.log(articlesToSave[0]);
    const createdArticles = await this.articleRepository.save(articlesToSave);
    return [...existingArticles, ...createdArticles];
  }

  async bullkCreateArticlesWithComments(articlesData: ArticleData[]) {
    const users = articlesData.reduce(
      (acc, articleData) => {
        if (articleData.author) {
          acc.push({ username: articleData.author });
        }
        articleData.comments.forEach((comment: CommentData) => {
          acc.push({ username: comment.author });
        });
        return acc;
      },
      [] as { username: string }[],
    );
    console.log({ users });

    const uniqueUsers = Array.from(
      new Set(users.map((user) => user.username)),
    ).map((username) => ({ username }));

    // Bulk insert users
    const createdUsers = await this.userService.createMany(uniqueUsers);
    console.log({ createdUsers });
    //Prepare articles data with authorId
    const toCreateArticles = articlesData.map((articleData) => {
      const author = createdUsers.find(
        (user) => user.username === articleData.author,
      );
      if (!author) {
        console.log('here author', articleData);
      }
      return {
        title: articleData.title,
        url: articleData.url,
        source: articleData.source,
        publishedDate: articleData.publishedDate,
        authorId: author ? author.id : null,
      };
    });

    // Step 1.3: Bulk insert articles
    const insertedArticles = await this.createMany(toCreateArticles);

    // Step 1.4: Prepare comments data with articleId and authorId
    const comments = articlesData.flatMap((articleData) => {
      const article = insertedArticles.find(
        (elt) => elt.title === articleData.title,
      );
      return articleData.comments.map((commentData) => {
        const commentAuthor = createdUsers.find(
          (user) => user.username === commentData.author,
        );
        if (!commentAuthor) {
          console.log('here', commentData);
        }
        return {
          text: commentData.text,
          publishedDate: commentData.publishedDate,
          articleId: article.id,
          authorId: commentAuthor ? commentAuthor.id : null,
        };
      });
    });
    // Step 1.5: Bulk insert comments
    await this.commentService.createMany(comments);

    return insertedArticles;
  }

}

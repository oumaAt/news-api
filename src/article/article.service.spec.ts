import { ConflictException, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Article } from './article.entity'; 
import { ArticleService } from './article.service';
import { UserService } from '../user/user.service'; 
import { CommentService } from '../comment/comment.service'; 
import { GetArticlesDto } from './dto/getArticles.dto'; 
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service'; 
import redisClient from '../redis/redisClient';

const mockArticleRepository = () => ({
  find: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
});
const mockUserService = () => ({
  createMany: jest.fn(),
});
const mockCommentService = () => ({
  createMany: jest.fn(),
});
const mockElasticsearchService = () => ({
  bulkIndexArticles: jest.fn(),
});

jest.mock('../redis/redisClient', () => ({
  // Replace with your actual path
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
}));

describe('ArticleService', () => {
  let service: ArticleService;
  let articleRepository: Repository<Article>;
  let userService: UserService;
  let commentService: CommentService;
  let elasticsearchService: ElasticsearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: getRepositoryToken(Article),
          useFactory: mockArticleRepository,
        },
        {
          provide: UserService,
          useFactory: mockUserService,
        },
        {
          provide: CommentService,
          useFactory: mockCommentService,
        },
        {
          provide: ElasticsearchService,
          useFactory: mockElasticsearchService,
        },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
    articleRepository = module.get<Repository<Article>>(
      getRepositoryToken(Article),
    );
    userService = module.get<UserService>(UserService);
    commentService = module.get<CommentService>(CommentService);
    elasticsearchService =
      module.get<ElasticsearchService>(ElasticsearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMany', () => {
    it('should create new articles and return all articles (including existing)', async () => {
      const articles = [
        { 
          title: 'Test Article 1', 
          url: 'https://sky.cs.berkeley.edu/project/sky-t1/',
          source: 'Test Source', 
          publishedDate: new Date(), 
          authorId: 1,
        },
        { 
          title: 'Test Article 2', 
          url: 'https://benjdd.com/drives/',
          source: 'Another Source', 
          publishedDate: new Date(), 
          authorId: 1,
        },
      ];
      const existingArticles = [
        {
          title: 'Existing Article',
          url: 'test-url-1',
          source: 'Test Source',
          publishedDate: new Date(),
          author: { id: 1 },
        },
      ];

      articleRepository.find = jest.fn().mockResolvedValue(existingArticles);
      articleRepository.save = jest.fn().mockResolvedValue(articles);

      const result = await service.createMany(articles);

      expect(articleRepository.find).toHaveBeenCalledWith({
        where: { url: In(['test-url-1', 'test-url-2']) },
      });
      expect(articleRepository.save).toHaveBeenCalledWith(articles);
      expect(redisClient.del).toHaveBeenCalledWith('recent_articles');
      expect(elasticsearchService.bulkIndexArticles).toHaveBeenCalledWith(
        articles,
      );
      expect(result).toEqual([...existingArticles, ...articles]);
    });

    it('should throw ConflictException for invalid article data', async () => {
      const articles = [
        {
          title: 'Test Article 1',
          url: 'test-url-1',
          source: 'Test Source',
          publishedDate: new Date(),
          authorId: 1,
          invalidField: 'test',
        },
      ];
      await expect(service.createMany(articles)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should handle duplicate URLs and not insert them', async () => {
      const articles = [
        {
          title: 'Test Article 1',
          url: 'test-url-1',
          source: 'Test Source',
          publishedDate: new Date(),
          authorId: 1,
        },
        {
          title: 'Test Article 2',
          url: 'test-url-1',
          source: 'Test Source',
          publishedDate: new Date(),
          authorId: 1,
        },
      ];

      articleRepository.find = jest.fn().mockResolvedValue([]);
      articleRepository.save = jest.fn().mockResolvedValue([]);

      const result = await service.createMany(articles);

      expect(articleRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('bulkCreateArticlesWithComments', () => {
    it('should create articles with comments and users', async () => {
      const articlesData = [
        {
          title: 'Test Article 1',
          url: 'test-url-1',
          source: 'Test Source',
          publishedDate: new Date(),
          author: 'testuser1',
          comments: [
            {
              text: 'Test comment',
              author: 'testuser2',
              publishedDate: new Date(),
            },
          ],
        },
      ];
      const mockUsers = [
        { id: 1, username: 'testuser1' },
        { id: 2, username: 'testuser2' },
      ];
      const mockSavedArticles = [
        {
          title: 'Test Article 1',
          url: 'test-url-1',
          source: 'Test Source',
          publishedDate: new Date(),
          authorId: 1,
          id: 1,
        },
      ];

      userService.createMany = jest.fn().mockResolvedValue(mockUsers);
      articleRepository.save = jest.fn().mockResolvedValue(mockSavedArticles);
      commentService.createMany = jest.fn().mockResolvedValue([]);

      const result = await service.bullkCreateArticlesWithComments(articlesData);

      expect(userService.createMany).toHaveBeenCalledWith([
        { username: 'testuser1' },
        { username: 'testuser2' },
      ]);
      expect(articleRepository.save).toHaveBeenCalled();
      expect(commentService.createMany).toHaveBeenCalled();
      expect(result).toEqual(mockSavedArticles);
    });
  });

  describe('findAll', () => {
    it('should return articles with pagination and sorting', async () => {
      const query: GetArticlesDto = { page: 1, limit: 10, sort: 'DESC' };
      const articles = [{ title: 'Test Article' }] as Article[];
      const total = 1;

      articleRepository.findAndCount = jest
        .fn()
        .mockResolvedValue([articles, total]);

      const result = await service.findAll(query);

      expect(articleRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        relations: { author: true, comments: { author: true } },
        order: { publishedDate: 'DESC' },
        take: 10,
        skip: 0,
      });
      expect(result).toEqual({
        data: articles,
        total,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply search and source filters', async () => {
      const query: GetArticlesDto = { search: 'test', source: 'Test Source' };

      articleRepository.findAndCount = jest.fn().mockResolvedValue([[], 0]);

      await service.findAll(query);

      expect(articleRepository.findAndCount).toHaveBeenCalledWith({
        where: { title: expect.any(Object), source: 'Test Source' },
        relations: { author: true, comments: { author: true } },
        order: { publishedDate: 'DESC' },
        take: 10,
        skip: 0,
      });
    });
  });

  describe('getRecentArticles', () => {
    it('should return cached articles from Redis', async () => {
      const cachedArticles = [{ title: 'Recent Article' }];
      (redisClient.get as jest.Mock).mockResolvedValue(
        JSON.stringify(cachedArticles),
      );

      const result = await service.getRecentArticles();

      expect(redisClient.get).toHaveBeenCalledWith('recent_articles');
      expect(result).toEqual(cachedArticles);
    });

    it('should fetch articles from database and cache them in Redis', async () => {
      const articles = {
        data: [{ title: 'Recent Article' }],
        total: 1,
        page: 1,
        limit: 30,
        totalPages: 1,
      };
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      articleRepository.findAndCount = jest
        .fn()
        .mockResolvedValue([articles.data, articles.total]);

      const result = await service.getRecentArticles();

      expect(redisClient.get).toHaveBeenCalledWith('recent_articles');
      expect(articleRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        relations: { author: true, comments: { author: true } },
        order: { publishedDate: 'DESC' },
        take: 30,
        skip: 0,
      });
      expect(redisClient.setEx).toHaveBeenCalledWith(
        'recent_articles',
        600,
        JSON.stringify(articles),
      );
      expect(result).toEqual(articles);
    });
  });
});

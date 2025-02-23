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
import { Page } from 'puppeteer';

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
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  __esModule: true,
  default: {
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
  },
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

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock article data
    const mockPage = {
      goto: jest.fn().mockResolvedValue(undefined),
      evaluate: jest.fn().mockResolvedValue([
        {
          title: 'Article 1',
          url: 'https://example.com',
          source: 'Example',
          publishedDate: new Date('2024-03-20T12:00:00Z'), // Changed to ISO 8601 string format
          author: 'John',
          comments: [],
        },
      ]),
      $: jest.fn().mockResolvedValue(null),
      click: jest.fn().mockResolvedValue(undefined),
      close: jest.fn(),
    } as unknown as jest.Mocked<Page>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMany', () => {
    it('should create new articles and return all articles (including existing)', async () => {
      const articlesDto = [
        {
          title: 'Test Article 1',
          url: 'test-url-1',
          source: 'Test Source',
          publishedDate: new Date('2024-03-20T12:00:00Z'),
          authorId: 1,
        },
        {
          title: 'Test Article 2',
          url: 'test-url-2',
          source: 'Another Source',
          publishedDate: new Date('2024-03-20T12:00:00Z'),
          authorId: 1,
        },
      ];

      // Mock existing articles
      articleRepository.find = jest.fn().mockResolvedValue([]);

      // Mock saved articles with both DTO fields and author object
      const savedArticles = articlesDto.map((article) => ({
        ...article,
        author: { id: article.authorId },
      }));
      articleRepository.save = jest.fn().mockResolvedValue(savedArticles);

      // Mock other services
      (redisClient.del as jest.Mock).mockResolvedValue(undefined);
      elasticsearchService.bulkIndexArticles = jest
        .fn()
        .mockResolvedValue(undefined);

      const result = await service.createMany(articlesDto);

      expect(articleRepository.find).toHaveBeenCalledWith({
        where: { url: In(['test-url-1', 'test-url-2']) },
      });
      expect(articleRepository.save).toHaveBeenCalledWith(savedArticles);
      expect(redisClient.del).toHaveBeenCalledWith('recent_articles');
      expect(elasticsearchService.bulkIndexArticles).toHaveBeenCalledWith(
        savedArticles,
      );
      expect(result).toEqual(savedArticles);
    });

    it('should throw ConflictException for invalid article data', async () => {
      const articles = [
        {
          title: 'Test Article 1',
          url: 'test-url-1',
          source: 'Test Source',
          publishedDate: '2024-03-20T12:00:00Z',
          authorId: 1,
          invalidField: 'test',
        },
      ];

      articleRepository.find = jest.fn().mockResolvedValue([]);
      articleRepository.save = jest
        .fn()
        .mockRejectedValue(new ConflictException());

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
          publishedDate: new Date('2024-03-20T12:00:00Z'),
          authorId: 1,
        },
      ];

      const existingArticle = {
        title: 'Existing Article',
        url: 'test-url-1',
        source: 'Test Source',
        publishedDate: new Date('2024-03-20T12:00:00Z'),
        author: { id: 1 },
      };

      articleRepository.find = jest.fn().mockResolvedValue([existingArticle]);
      // Mock save to return empty array for no new articles
      articleRepository.save = jest.fn().mockResolvedValue([]);

      const result = await service.createMany(articles);
      expect(result).toEqual([existingArticle]);
    });

    it('should create articles with comments and users', async () => {
      const articlesData = [
        {
          title: 'Test Article 1',
          url: 'test-url-1',
          source: 'Test Source',
          publishedDate: new Date('2024-03-20T12:00:00Z'),
          authorId: 1,
        },
      ];

      const mockSavedArticles = [
        {
          id: 1,
          title: 'Test Article 1',
          url: 'test-url-1',
          source: 'Test Source',
          publishedDate: '2024-03-20T12:00:00Z',
          author: { id: 1 },
        },
      ];

      articleRepository.find = jest.fn().mockResolvedValue([]);
      articleRepository.save = jest.fn().mockResolvedValue(mockSavedArticles);

      const result = await service.createMany(articlesData);

      expect(result).toEqual(mockSavedArticles);
    });
  });

  describe('bulkCreateArticlesWithComments', () => {
    it('should create articles with comments and users', async () => {
      const articlesData = {
        title: 'Test Article 1',
        url: 'test-url-1',
        source: 'Test Source',
        publishedDate: new Date('2024-03-20T12:00:00Z'),
        author: 'testuser1',
        comments: [
          {
            text: 'Test comment',
            author: 'testuser2',
            publishedDate: new Date('2024-03-20T12:00:00Z'),
          },
        ],
      };

      const mockUsers = [
        { id: 1, username: 'testuser1' },
        { id: 2, username: 'testuser2' },
      ];

      const mockArticleToSave = {
        title: 'Test Article 1',
        url: 'test-url-1',
        source: 'Test Source',
        publishedDate: '2024-03-20T12:00:00Z',
        author: { id: 1 },
      };

      userService.createMany = jest.fn().mockResolvedValue(mockUsers);
      articleRepository.find = jest.fn().mockResolvedValue([]);
      articleRepository.save = jest.fn().mockResolvedValue([mockArticleToSave]);
      commentService.createMany = jest.fn().mockResolvedValue([]);

      const result = await service.bullkCreateArticlesWithComments([
        articlesData,
      ]);
      expect(result).toEqual([mockArticleToSave]);
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

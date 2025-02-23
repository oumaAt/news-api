import { Test, TestingModule } from '@nestjs/testing';
import { ScrapingService } from './scraping.service';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('ScrapingService', () => {
  let service: ScrapingService;
  let mockBrowser: jest.Mocked<Browser>;
  let mockPage: jest.Mocked<Page>;

  beforeEach(async () => {
    // Create mocks for Browser and Page first
    mockPage = {
      goto: jest.fn().mockResolvedValue(undefined),
      evaluate: jest.fn().mockResolvedValue([{
        title: 'Article 1',
        url: 'https://example.com',
        source: 'Example',
        publishedDate: null,
        author: 'John',
        comments: [],
      }]),
      $: jest.fn().mockResolvedValue(null),
      click: jest.fn().mockResolvedValue(undefined),
      close: jest.fn(),
    } as unknown as jest.Mocked<Page>;

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    } as unknown as jest.Mocked<Browser>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [ScrapingService],
    }).compile();

    service = module.get<ScrapingService>(ScrapingService);
    
    // Set the browser instance on the service
    (service as any).browser = mockBrowser;

    // Spy on extractArticleData method
    jest.spyOn(service, 'extractArticleData').mockResolvedValue([{
      title: 'Article 1',
      url: 'https://example.com',
      source: 'Example',
      publishedDate: null,
      author: 'John',
      comments: [],
    }]);
  });

  it('should extract articles with pagination', async () => {
    // Call the method with the mockPage
    const articles = await service.extractArticlesWithPagination(mockPage);

    // Verify the result
    expect(articles).toEqual([{
      title: 'Article 1',
      url: 'https://example.com',
      source: 'Example',
      publishedDate: null,
      author: 'John',
      comments: [],
    }]);

    // Verify that extractArticleData was called with the correct parameters
    expect(service.extractArticleData).toHaveBeenCalledWith(mockPage, mockBrowser);

    // Verify that pagination check was performed
    expect(mockPage.$).toHaveBeenCalledWith('.morelink');
  });
});

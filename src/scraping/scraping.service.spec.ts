import { Test, TestingModule } from '@nestjs/testing';
import { ScrapingService } from './scraping.service';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('ScrapingService', () => {
  let service: ScrapingService;
  let mockBrowser: jest.Mocked<Browser>;
  let mockPage: jest.Mocked<Page>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScrapingService],
    }).compile();

    service = module.get<ScrapingService>(ScrapingService);

    // Create mocks for Browser and Page
    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage), // Mock newPage returning mockPage
      close: jest.fn(), // Mock close
    } as unknown as jest.Mocked<Browser>;

    mockPage = {
      goto: jest.fn().mockResolvedValue(undefined), // Mock goto
      evaluate: jest.fn().mockResolvedValue([{
        title: 'Article 1',
        url: 'https://example.com',
        source: 'Example',
        publishedDate: null,
        author: 'John',
        comments: [],
      }]), // Mock evaluate to return a single article
      $: jest.fn().mockResolvedValue(null), // Simulate absence of "More" button
      click: jest.fn().mockResolvedValue(undefined), // Mock click
      close: jest.fn(), // Mock close for the page
    } as unknown as jest.Mocked<Page>;

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
    // Call the method with the mockPage and mockBrowser
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

    // Verify that methods on mockPage were called correctly
    expect(mockPage.goto).toHaveBeenCalled();
    expect(mockPage.evaluate).toHaveBeenCalled();
    expect(mockPage.$).toHaveBeenCalled();
  });
});

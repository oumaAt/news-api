import { Injectable } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';

interface Article {
  title: string;
  url: string;
  source: string;
  publishedDate: Date | null;
  author: string;
}

let siteUrl = 'https://news.ycombinator.com/';

@Injectable()
export class ScrapingService {
  constructor() {}

  async extractArticles() {
    let browser: Browser;
    try {
      browser = await puppeteer.launch({
        executablePath:
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
      });
      const page = await browser.newPage();

      await page.goto(siteUrl, {
        waitUntil: 'networkidle0',
      });
      const allArticles = await this.extractArticlesWithPagination(page);

      console.log(`Successfully extracted ${allArticles.length}`);
      console.log(allArticles[0]);
      const articleUrls = allArticles.map((article) => article.url);

      // Fetch all comments
      const data = await Promise.all(
        articleUrls.map(async (url) => {
          const comments = await this.extractArticleComments(browser, url);
          console.log('comments', url, comments);
          if (!comments) return;
          const concernedArticle = allArticles.find((elt) => elt.url == url);
          console.log({ concernedArticle });
          return { ...concernedArticle, comments };
        }),
      );
      console.log(data);
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      if (browser) await browser.close();
    }
  }

  async extractArticlesWithPagination(page: Page) {
    let moreArticles = true;
    let allArticles = [];
    while (moreArticles) {
      const articles = await this.extractArticleData(page);
      allArticles.push(...articles);
      console.log(
        `Successfully extracted ${articles.length}, total: ${allArticles.length}`,
      );

      const moreButtonExists = await page.$('.morelink');
      console.log(`More articles exists: ${moreButtonExists ? 'Yes' : 'No'}`);
      if (moreButtonExists) {
        await page.click('.morelink');
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        moreArticles = false;
        console.log('No more articles to load.');
        break;
      }
    }
    return allArticles;
  }

  async extractArticleData(page: Page): Promise<Article[]> {
    const articles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.athing')).map((elt) => {
        const titleElement = elt.querySelector(
          '.titleline a',
        ) as HTMLAnchorElement;

        const title = titleElement ? titleElement.innerText : null;
        const url = titleElement ? titleElement.href : null;
        const sourceElement = elt.querySelector(
          '.sitestr',
        ) as HTMLAnchorElement;
        const source = sourceElement ? sourceElement.innerText : null;

        const metadata = elt.nextElementSibling;
        if (!metadata) {
          console.warn('no metadata:', title);
          return { title, url, source, author: null, publishedDate: null };
        }

        const authorElement = metadata.querySelector(
          '.hnuser',
        ) as HTMLAnchorElement;
        const author = authorElement ? authorElement.innerText.trim() : null;
        let publishedDate = null;
        const ageElement = metadata.querySelector('.age');

        if (ageElement) {
          const titleAttr = ageElement.getAttribute('title');
          if (titleAttr) {
            publishedDate = titleAttr.split(' ')[0];
          }
        }

        return { title, url, source, author, publishedDate };
      });
    });
    return articles;
  }

  async extractArticleComments(browser: Browser, articleUrl: string) {
    const articleId = new URL(articleUrl).searchParams.get('id');
    if (!articleId) return null;

    const articlePage = await browser.newPage();
    await articlePage.goto(articleUrl, { waitUntil: 'domcontentloaded' });
    const comments = await this.extractComments(articlePage, articleId);
    await articlePage.close();

    return comments;
  }

  async extractComments(page: Page, articleId: string) {
    await page.goto(siteUrl + `/item?id=${articleId}`, {
      waitUntil: 'domcontentloaded',
    });

    const comments = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.athing.comtr')).map(
        (row) => {
          const commentElement = row.querySelector(
            '.commtext.c00',
          ) as HTMLAnchorElement;
          const authorElement = row.querySelector(
            '.hnuser',
          ) as HTMLAnchorElement;
          const dateElement = row.querySelector('.age');
          let publishedDate = null;
          if (dateElement) {
            publishedDate = dateElement.getAttribute('title')?.split(' ')[0];
          }
          return {
            author: authorElement
              ? authorElement.innerText.trim()
              : 'Anonymous',
            text: commentElement ? commentElement.innerText.trim() : '',
            publishedDate,
          };
        },
      );
    });

    return comments;
  }
}

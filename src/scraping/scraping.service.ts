import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';

interface Article {
  title: string;
  url: string;
  source: string;
  publishedDate: Date | null;
  author: string;
  comments: any[];
}

@Injectable()
export class ScrapingService {
  private siteUrl = 'https://news.ycombinator.com/';
  private browser: Browser;

  constructor() {}

  async extractArticles() {
    try {
      this.browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        // executablePath:
        //   'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
      });
      const page = await this.browser.newPage();

      await page.goto(this.siteUrl, {
        waitUntil: 'networkidle0',
      });
      const allArticles = await this.extractArticlesWithPagination(page);

      Logger.log(`Successfully extracted ${allArticles.length}`);
      return allArticles;
    } catch (error) {
      Logger.error(error);
      return [];
    } finally {
      if (this.browser) await this.browser.close();
    }
  }

  async extractArticlesWithPagination(page: Page) {
    let moreArticles = true;
    let allArticles = [];
    while (moreArticles) {
      const articles = await this.extractArticleData(page, this.browser);
      allArticles.push(...articles);
      Logger.log(
        `Successfully extracted ${articles.length}, total: ${allArticles.length}`,
      );

      const moreButtonExists = await page.$('.morelink');
      Logger.log(`More articles exists: ${moreButtonExists ? 'Yes' : 'No'}`);
      if (moreButtonExists) {
        await page.click('.morelink');
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        moreArticles = false;
        Logger.log('No more articles to load.');
        break;
      }
    }
    return allArticles;
  }

  async extractArticleData(page: Page, browser: Browser): Promise<Article[]> {
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
          return {
            title,
            url,
            source,
            author: null,
            publishedDate: null,
            commentUrl: null,
            comments: [],
          };
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

        const commentUrl = elt.querySelector('a[href^="item?id="]')
          ? elt.querySelector('a[href^="item?id="]')?.getAttribute('href')
          : null;

        return {
          title,
          url,
          source,
          author,
          publishedDate,
          commentUrl,
          comments: [],
        };
      });
    });

    // Récupérer les commentaires pour chaque article
    const articlesWithComments = await Promise.all(
      articles.map(async (article) => {
        if (article.commentUrl) {
          article.comments = await this.extractArticleComments(
            browser,
            this.siteUrl + article.commentUrl,
          );
        } else {
          article.comments = [];
        }
        return article;
      }),
    );

    return articlesWithComments;
  }

  async extractArticleComments(browser: Browser, commentUrl: string) {
    const articlePage = await browser.newPage();
    await articlePage.goto(commentUrl, { waitUntil: 'domcontentloaded' });
    const comments = await this.extractComments(articlePage, commentUrl);
    await articlePage.close();

    return comments;
  }

  async extractComments(page: Page, commentUrl: string) {
    await page.goto(commentUrl, {
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

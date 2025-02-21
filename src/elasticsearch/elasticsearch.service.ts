import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService {
  private readonly client: Client;

  constructor() {
    this.client = new Client({
      node: `http://${process.env.ELASTICSEARCH_HOST || 'localhost'}:${process.env.ELASTICSEARCH_PORT || 9200}`,
    });
  }

  async bulkIndexArticles(articles: any[]) {
    if (articles.length === 0) return;

    const bulkBody = articles.flatMap((article) => [
      { index: { _index: 'articles', _id: article.id.toString() } },
      {
        title: article.title,
        source: article.source,
        url: article.url,
        publishedDate: article.publishedDate,
        authorId: article.authorId,
      },
    ]);

    await this.client.bulk({ body: bulkBody });
    Logger.log(`Indexed ${articles.length} articles in Elasticsearch`);
  }

  async searchArticlesByTitle(word: string) {
    const result = await this.client.search({
      index: 'articles',
      body: {
        query: {
          match: {
            title: word,
          },
        },
      },
    });

    return result.hits.hits.map((hit) => hit._source);
  }

  async deleteArticle(articleId: number) {
    await this.client.delete({
      index: 'articles',
      id: articleId.toString(),
    });
  }
}

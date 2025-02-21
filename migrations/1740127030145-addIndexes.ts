import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddIndexes1740127030145 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'article',
      new TableIndex({
        name: 'IDX_ARTICLE_SOURCE',
        columnNames: ['source'],
      }),
    );

    await queryRunner.createIndex(
      'article',
      new TableIndex({
        name: 'IDX_ARTICLE_PUBLISHED_DATE',
        columnNames: ['publishedDate'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('article', 'IDX_ARTICLE_SOURCE');
    await queryRunner.dropIndex('article', 'IDX_ARTICLE_PUBLISHED_DATE');
  }
}

import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateArticle1740125378825 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'article',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'url',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'source',
            isNullable: true,
            type: 'varchar',
          },
          {
            name: 'publishedDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );
    await queryRunner.query(
      `ALTER TABLE article ADD FULLTEXT INDEX IDX_ARTICLE_TITLE (title)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('article');
    await queryRunner.query(`ALTER TABLE Article DROP INDEX idx_article_title`);
  }
}
